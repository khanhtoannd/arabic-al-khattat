import React from 'react';

interface ActivityHeatmapProps {
  history: Record<string, number>;
}

export function ActivityHeatmap({ history }: ActivityHeatmapProps) {
  const getLocalISODate = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDayOfWeek = today.getDay();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - currentDayOfWeek));
  
  const numWeeks = 16;
  const totalDays = numWeeks * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const days = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const ds = getLocalISODate(d);
    
    days.push({
      date: ds,
      isFuture: d > today,
      count: history[ds] || 0,
      month: d.toLocaleString('default', { month: 'short' }),
      formattedDate: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      dateObj: d,
    });
  }

  // Create weeks array [ [{day1}, {day2}, ...], [{day...}] ]
  const weeks = [];
  for (let i = 0; i < numWeeks; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count < 3) return 'bg-emerald-200';
    if (count < 6) return 'bg-emerald-300';
    if (count < 10) return 'bg-emerald-400';
    if (count < 15) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };

  const totalScore = Object.values(history).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md mt-6 border border-slate-100 flex flex-col items-center">
      <div className="w-full flex justify-between items-end mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Learning Activity</h3>
          <p className="text-xs text-slate-500">{totalScore} correct answers</p>
        </div>
      </div>
      
      <div className="w-full overflow-x-auto pb-4 scrollbar-hide" dir="ltr">
        <div className="min-w-fit flex text-[10px] text-slate-400">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between pt-5 pb-1 pr-2 uppercase leading-none font-medium h-[116px]">
            <span className="invisible">Sun</span>
            <span>Mon</span>
            <span className="invisible">Tue</span>
            <span>Wed</span>
            <span className="invisible">Thu</span>
            <span>Fri</span>
            <span className="invisible">Sat</span>
          </div>

          <div className="flex flex-col">
            {/* Month labels */}
            <div className="flex h-5 items-end mb-1">
              {weeks.map((week, i) => {
                const firstDayOfMonth = week.find(d => d.dateObj.getDate() <= 7 && d.dateObj.getDate() >= 1 && (d.dateObj.getDay() === 0 || d.dateObj.getDate() === 1));
                
                // Show month if it's the first week, or if this week contains the 1st of the month.
                // We also require that the 1st is either Sunday, or if it's not Sunday, we just show the month label if this week has the 1st. 
                // Actually to avoid overlapping, just show if the week contains the 1st.
                const isFirstWeekOfMonth = week.some(d => d.dateObj.getDate() === 1);
                const showMonth = isFirstWeekOfMonth || i === 0;
                
                const monthDay = week.find(d => d.dateObj.getDate() === 1) || week[0];
                const monthLabel = monthDay.month;

                return (
                  <div key={i} className="relative w-[14px] flex-shrink-0 mr-[4px]">
                    {showMonth && (
                      <span className="absolute bottom-0 whitespace-nowrap">{monthLabel}</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Grid */}
            <div className="flex">
              {weeks.map((week, i) => (
                <div key={i} className="flex flex-col gap-1 mr-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={day.count === 0 ? `No activity on ${day.formattedDate}` : `${day.count} correct on ${day.formattedDate}`}
                      className={`w-[14px] h-[14px] rounded-[3px] ${day.isFuture ? 'bg-transparent' : getColorClass(day.count)} transition-all hover:ring-2 hover:ring-slate-300 cursor-pointer`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 w-full flex items-center justify-end text-xs text-slate-400 gap-1.5">
        <span>Less</span>
        <div className="w-[14px] h-[14px] rounded-[3px] bg-slate-100"></div>
        <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-200"></div>
        <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-400"></div>
        <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-600"></div>
        <span>More</span>
      </div>
    </div>
  );
}
