import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import {
  getRandomKey,
  getScale,
  getRandomChordProgression,
  getRomanNumeral,
  getChordDegreeInfo,
  getChordNotes,
  validateAnswers,
  getKeyDisplayName,
  getNoteIndex,
  type KeySignature,
  type ChordProgression,
} from '../utils/music';
import '../styles/game.css';

type FeedbackColor = 'green' | 'yellow' | 'gray' | null;

interface Attempt {
  answers: (number | null)[];
  feedback: FeedbackColor[];
}

const MAX_ATTEMPTS = 4;

export function MaestroGame() {
  const [key, setKey] = useState<KeySignature | null>(null);
  const [progression, setProgression] = useState<ChordProgression | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([null, null, null, null]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const synthRef = useRef<Tone.PolySynth<Tone.Synth> | null>(null);

  // Initialize Tone.js and start new game
  useEffect(() => {
    const initGame = async () => {
      if (!synthRef.current) {
        const gain = new Tone.Gain(0.5).toDestination();
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.01,
            decay: 0.4,
            sustain: 0.08,
            release: 1.2,
          },
        }).connect(gain);
      }

      const newKey = getRandomKey();
      const newProgression = getRandomChordProgression(newKey.note, newKey.mode);

      setKey(newKey);
      setProgression(newProgression);
      setUserAnswers([null, null, null, null]);
      setAttempts([]);
      setAttemptCount(0);
      setGameOver(false);
      setIsCorrect(false);
    };

    initGame();
  }, []);

  const getScaleNotesWithOctaves = () => {
    if (!key) return [];
    const scale = getScale(key.note, key.mode);
    const scaleWithOctave = [...scale, key.note];

    const notesWithOctaves: { note: string; octave: number }[] = [];
    let currentOctave = 4;
    let prevNoteIndex = getNoteIndex(key.note);

    scaleWithOctave.forEach((note, index) => {
      const noteIndex = getNoteIndex(note);
      if (index > 0 && noteIndex < prevNoteIndex) {
        currentOctave++;
      }
      notesWithOctaves.push({ note, octave: currentOctave });
      prevNoteIndex = noteIndex;
    });

    return notesWithOctaves;
  };

  const playScale = async () => {
    if (!key || !synthRef.current) return;

    await Tone.start();
    const notesWithOctaves = getScaleNotesWithOctaves();

    const now = Tone.now();
    notesWithOctaves.forEach((noteData, index) => {
      synthRef.current!.triggerAttackRelease(`${noteData.note}${noteData.octave}`, '0.4', now + index * 0.3);
    });
  };

  const playProgression = async () => {
    if (!progression || !synthRef.current) return;

    await Tone.start();
    const now = Tone.now();

    progression.chords.forEach((chord, index) => {
      const notes = getChordNotes(chord, 4);
      synthRef.current!.triggerAttackRelease(notes as Tone.Unit.Frequency[], '0.8', now + index * 1.2);
    });
  };

  const handleAnswerChange = (index: number, value: number | null) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!progression || gameOver) return;

    const feedback = validateAnswers(userAnswers, progression);
    const correct = feedback.every(f => f === 'green');

    const newAttempt: Attempt = {
      answers: [...userAnswers],
      feedback,
    };

    setAttempts([...attempts, newAttempt]);
    setAttemptCount(attemptCount + 1);

    if (correct) {
      setIsCorrect(true);
      setGameOver(true);
    } else if (attemptCount + 1 >= MAX_ATTEMPTS) {
      setGameOver(true);
    } else {
      // Reset for next attempt
      setUserAnswers([null, null, null, null]);
    }
  };

  const handleNewGame = () => {
    if (!key) return;
    const newProgression = getRandomChordProgression(key.note, key.mode);
    setProgression(newProgression);
    setUserAnswers([null, null, null, null]);
    setAttempts([]);
    setAttemptCount(0);
    setGameOver(false);
    setIsCorrect(false);
  };

  const getRomanNumeralOptions = () => {
    const options = [];
    for (let i = 1; i <= 6; i++) {
      const chordInfo = getChordDegreeInfo(i, key!.note, key!.mode);
      const label = getRomanNumeral(i, chordInfo.isMinor, chordInfo.isDiminished);
      options.push({ value: i, label });
    }
    return options;
  };

  if (!key || !progression) return <div className="maestro-loading">Loading...</div>;

  const options = getRomanNumeralOptions();

  return (
    <div className="maestro-container">
      <div className="maestro-content">
        <h1>Maestro</h1>
        <p className="maestro-subtitle">Ear Training Minigame</p>

        {/* Key Display Box */}
        <div className="maestro-key-box">
          <div className="maestro-key-content">
            <p className="maestro-key-label">Current Key</p>
            <p className="maestro-key-name">{getKeyDisplayName(key)}</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="maestro-controls">
          <button className="maestro-btn" onClick={playScale}>
            ▶ Play Scale
          </button>
          <button className="maestro-btn maestro-btn-secondary" onClick={playProgression}>
            ▶ Play Progression
          </button>
        </div>

        {/* Current Answer Section */}
        {!gameOver ? (
          <div className="maestro-answer-section">
            <p className="maestro-instruction">
              Attempt {attemptCount + 1} of {MAX_ATTEMPTS}
            </p>
            <div className="maestro-dropdowns">
              {[0, 1, 2, 3].map(index => (
                <select
                  key={index}
                  className="maestro-dropdown"
                  value={userAnswers[index] ?? ''}
                  onChange={e => handleAnswerChange(index, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">—</option>
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
            <button
              className="maestro-btn maestro-btn-submit"
              onClick={handleSubmit}
              disabled={userAnswers.some(a => a === null)}
            >
              Submit
            </button>
          </div>
        ) : (
          <div className="maestro-game-over">
            <div className={`maestro-result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <>
                  <p className="maestro-result-title">🎉 Perfect!</p>
                  <p className="maestro-result-subtitle">You got it in {attemptCount} attempt{attemptCount !== 1 ? 's' : ''}!</p>
                </>
              ) : (
                <>
                  <p className="maestro-result-title">Game Over</p>
                  <p className="maestro-result-subtitle">The correct progression was:</p>
                  <div className="maestro-correct-progression">
                    {progression.degrees.map((degree, index) => {
                      const chord = getChordDegreeInfo(degree, key.note, key.mode);
                      const label = getRomanNumeral(degree, chord.isMinor, chord.isDiminished);
                      return (
                        <div key={index} className="maestro-correct-chord">
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <button className="maestro-btn maestro-btn-submit" onClick={handleNewGame}>
              New Game
            </button>
          </div>
        )}

        {/* Attempts History */}
        {attempts.length > 0 && (
          <div className="maestro-attempts">
            {attempts.slice().reverse().map((attempt, reverseIndex) => {
              const attemptIndex = attempts.length - 1 - reverseIndex;
              return (
                <div key={attemptIndex} className="maestro-attempt">
                  <div className="maestro-attempt-number">Attempt {attemptIndex + 1}</div>
                  <div className="maestro-feedback-items">
                    {[0, 1, 2, 3].map(index => {
                      const correctDegree = progression.degrees[index];
                      const correctChord = getChordDegreeInfo(correctDegree, key.note, key.mode);
                      const correctLabel = getRomanNumeral(
                        correctDegree,
                        correctChord.isMinor,
                        correctChord.isDiminished
                      );
                      const userDegree = attempt.answers[index];
                      const userChord = userDegree
                        ? getChordDegreeInfo(userDegree, key.note, key.mode)
                        : null;
                      const userLabel = userChord && userDegree
                        ? getRomanNumeral(userDegree, userChord.isMinor, userChord.isDiminished)
                        : '—';

                      return (
                        <div
                          key={index}
                          className={`maestro-feedback-item maestro-feedback-${attempt.feedback[index]}`}
                        >
                          <div className="maestro-feedback-answer">{userLabel}</div>
                          {attemptIndex === attempts.length - 1 && gameOver && (
                            <div className="maestro-feedback-correct">({correctLabel})</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
