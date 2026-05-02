// All chromatic notes
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
type Note = typeof NOTES[number];
type Mode = 'major' | 'minor';

// Intervals in semitones from root
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

export interface KeySignature {
  note: Note;
  mode: Mode;
}

export interface ChordDegree {
  degree: number; // 1-7
  root: Note;
  isMinor: boolean;
  isDiminished: boolean;
}

export interface ChordProgression {
  degrees: number[]; // 1-7
  chords: ChordDegree[];
}

export function getRandomKey(): KeySignature {
  const note = NOTES[Math.floor(Math.random() * NOTES.length)];
  const mode = Math.random() > 0.5 ? 'major' : 'minor';
  return { note, mode };
}

export function getNoteIndex(note: Note): number {
  return NOTES.indexOf(note);
}

export function getNoteName(index: number): Note {
  return NOTES[index % 12];
}

export function getMajorScale(root: Note): Note[] {
  const rootIndex = getNoteIndex(root);
  return MAJOR_SCALE_INTERVALS.map(interval =>
    getNoteName(rootIndex + interval)
  );
}

export function getMinorScale(root: Note): Note[] {
  const rootIndex = getNoteIndex(root);
  return MINOR_SCALE_INTERVALS.map(interval =>
    getNoteName(rootIndex + interval)
  );
}

export function getScale(root: Note, mode: Mode): Note[] {
  return mode === 'major' ? getMajorScale(root) : getMinorScale(root);
}

export function getRomanNumeral(degree: number, isMinor: boolean, isDiminished: boolean = false): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const numeral = numerals[degree - 1];

  if (isDiminished) return numeral + '°';
  if (isMinor) return numeral.toLowerCase();
  return numeral;
}

export function getChordDegreeInfo(
  degree: number,
  rootNote: Note,
  mode: Mode
): ChordDegree {
  const scale = getScale(rootNote, mode);
  const chordRoot = scale[degree - 1];

  // Determine chord quality (major/minor) - no diminished chords
  let isMinor = false;

  if (mode === 'major') {
    // I, IV, V are major; ii, iii, vi, vii are minor
    isMinor = [2, 3, 6, 7].includes(degree);
  } else {
    // i, iv, v are minor; III, VI, VII are major; ii is minor
    isMinor = [1, 2, 4, 5].includes(degree);
  }

  return {
    degree,
    root: chordRoot,
    isMinor,
    isDiminished: false
  };
}

export function getRandomChordProgression(
  rootNote: Note,
  mode: Mode
): ChordProgression {
  // Generate 4 random chord degrees (1-6, excluding vii)
  const degrees: number[] = [];
  for (let i = 0; i < 4; i++) {
    degrees.push(Math.floor(Math.random() * 6) + 1);
  }

  const chords = degrees.map(degree =>
    getChordDegreeInfo(degree, rootNote, mode)
  );

  return { degrees, chords };
}

export function getChordNotes(chord: ChordDegree, octave: number = 4): string[] {
  const rootIndex = getNoteIndex(chord.root);

  // Get intervals for chord type
  let intervals: number[];
  if (chord.isDiminished) {
    intervals = [0, 3, 6]; // diminished triad: root, minor third, diminished fifth
  } else if (chord.isMinor) {
    intervals = [0, 3, 7]; // minor triad: root, minor third, perfect fifth
  } else {
    intervals = [0, 4, 7]; // major triad: root, major third, perfect fifth
  }

  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return `${getNoteName(noteIndex)}${octave}`;
  });
}

export function validateAnswers(
  userAnswers: (number | null)[],
  correctProgression: ChordProgression
): Array<'green' | 'yellow' | 'gray'> {
  const results: Array<'green' | 'yellow' | 'gray'> = [];
  const correctDegrees = correctProgression.degrees;
  const usedIndices = new Set<number>();

  // First pass: find greens (exact matches)
  userAnswers.forEach((answer, index) => {
    if (answer !== null && answer === correctDegrees[index]) {
      results[index] = 'green';
      usedIndices.add(index);
    }
  });

  // Second pass: find yellows (right chord, wrong position)
  userAnswers.forEach((answer, index) => {
    if (results[index] !== 'green' && answer !== null) {
      const foundIndex = correctDegrees.findIndex(
        (degree, dIdx) =>
          degree === answer &&
          !usedIndices.has(dIdx) &&
          results[dIdx] !== 'green'
      );

      if (foundIndex !== -1) {
        results[index] = 'yellow';
        usedIndices.add(foundIndex);
      } else {
        results[index] = 'gray';
      }
    }
  });

  return results;
}

export function getKeyDisplayName(key: KeySignature): string {
  return `${key.note} ${key.mode === 'major' ? 'Major' : 'Minor'}`;
}
