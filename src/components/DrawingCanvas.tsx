import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface DrawingCanvasHandle {
  clear: () => void;
  getBase64: () => string | undefined;
}

interface DrawingCanvasProps {
  className?: string;
}

const LINE_WIDTH = 6;
const LINE_COLOR = '#0f172a'; // slate-900

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Only set canvas dimensions if they don't match the rect (prevents endless clearing)
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
         canvas.width = rect.width * dpr;
         canvas.height = rect.height * dpr;
         ctx.scale(dpr, dpr);
      }

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = LINE_WIDTH;
      ctx.strokeStyle = LINE_COLOR;
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        initCanvas();
      },
      getBase64: () => {
        return canvasRef.current?.toDataURL('image/png');
      }
    }));

    useEffect(() => {
      initCanvas();
      window.addEventListener('resize', initCanvas);
      return () => window.removeEventListener('resize', initCanvas);
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      e.preventDefault(); // Prevent scrolling on touch

      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      ctx.beginPath();
      ctx.moveTo(clientX - rect.left, clientY - rect.top);
      setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientX ? e.clientY : 0; // fallback
      }

      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        className={`w-full h-full cursor-crosshair touch-none ${className}`}
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
