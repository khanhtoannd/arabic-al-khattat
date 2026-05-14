import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const categories = [
  "150 most common Arabic verbs",
  "150 most common Arabic adjectives",
  "150 most common Arabic nouns (food, body parts, animals, home)",
  "150 most common Arabic nouns (nature, city, transport, clothes, professions)",
  "150 most common Arabic basics (numbers, time, days, family, pronouns, greetings, prepositions)"
];

async function run() {
  console.log("Generating dictionary...");
  let allWords: any[] = [];
  
  for (const cat of categories) {
    console.log(`Generating category: ${cat}`);
    const prompt = `
Generate a JSON array of exactly ${cat}. Use modern standard Arabic.
Format exactly as:
[
  { "letter": "arabic script", "phonetic": "english phonetic", "description": "english translation" }
]
Output ONLY valid JSON.
`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text || '[]');
      allWords = allWords.concat(parsed);
      console.log(`Generated ${parsed.length} items.`);
    } catch (e) {
      console.error(e);
    }
  }

  // Filter out duplicates
  const uniqueUrls = new Set();
  const finalWords = [];
  for (const w of allWords) {
    if (!uniqueUrls.has(w.letter)) {
      uniqueUrls.add(w.letter);
      finalWords.push(w);
    }
  }

  const alphabet = [
    { letter: 'ا', phonetic: 'alif', description: 'a as in father' },
    { letter: 'ب', phonetic: 'baa', description: 'b as in bat' },
    { letter: 'ت', phonetic: 'taa', description: 't as in tap' },
    { letter: 'ث', phonetic: 'thaa', description: 'th as in think' },
    { letter: 'ج', phonetic: 'jeem', description: 'j as in jam' },
    { letter: 'ح', phonetic: 'haa', description: 'sharp h (from throat)' },
    { letter: 'خ', phonetic: 'khaa', description: 'kh like Bach or loch' },
    { letter: 'د', phonetic: 'daal', description: 'd as in dad' },
    { letter: 'ذ', phonetic: 'thaal', description: 'th as in this' },
    { letter: 'ر', phonetic: 'raa', description: 'rolled r' },
    { letter: 'ز', phonetic: 'zay', description: 'z as in zoo' },
    { letter: 'س', phonetic: 'seen', description: 's as in sit' },
    { letter: 'ش', phonetic: 'sheen', description: 'sh as in shoe' },
    { letter: 'ص', phonetic: 'saad', description: 'heavy s' },
    { letter: 'ض', phonetic: 'daad', description: 'heavy d' },
    { letter: 'ط', phonetic: 'taa', description: 'heavy t' },
    { letter: 'ظ', phonetic: 'zaa', description: 'heavy th' },
    { letter: 'ع', phonetic: 'ayn', description: 'guttural tightening' },
    { letter: 'غ', phonetic: 'ghayn', description: 'gargling g/r sound' },
    { letter: 'ف', phonetic: 'faa', description: 'f as in fan' },
    { letter: 'ق', phonetic: 'qaaf', description: 'deep k back of throat' },
    { letter: 'ك', phonetic: 'kaaf', description: 'k as in kite' },
    { letter: 'ل', phonetic: 'laam', description: 'l as in lap' },
    { letter: 'م', phonetic: 'meem', description: 'm as in mat' },
    { letter: 'ن', phonetic: 'noon', description: 'n as in nut' },
    { letter: 'ه', phonetic: 'haa', description: 'h as in hat' },
    { letter: 'و', phonetic: 'waaw', description: 'w as in win / oo sound' },
    { letter: 'ي', phonetic: 'yaa', description: 'y as in yes / ee sound' }
  ];

  const completelyFinal = [...alphabet];
  for (const w of finalWords) {
    if (!completelyFinal.some(x => x.letter === w.letter)) {
      completelyFinal.push(w);
    }
  }

  const content = `export const ARABIC_DICTIONARY = ${JSON.stringify(completelyFinal, null, 2)};\n`;
  fs.writeFileSync('src/constants/dictionary.ts', content);
  console.log(`Done! Total entries: ${completelyFinal.length}`);
}

run();
