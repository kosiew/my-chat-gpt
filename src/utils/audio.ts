// utils/audio.ts

// utils/audio.ts

export interface Note {
  frequency: number;
  duration: number;
}

const c = 261.63;
const d = 293.66;
const e = 329.63;
const f = 349.23;
const g = 392.0;
const a = 440.0;
const b = 493.88;

export const shortTune: Note[] = [
  { frequency: c, duration: 0.25 },
  { frequency: d, duration: 0.25 },
  { frequency: e, duration: 0.25 },
  { frequency: f, duration: 0.5 },
  { frequency: e, duration: 0.25 },
  { frequency: d, duration: 0.5 },
  { frequency: c, duration: 0.25 },
  { frequency: g, duration: 0.5 },
  { frequency: f, duration: 0.25 },
  { frequency: e, duration: 0.25 },
  { frequency: d, duration: 0.5 },
  { frequency: e, duration: 0.25 },
  { frequency: f, duration: 0.5 },
  { frequency: e, duration: 0.25 },
  { frequency: d, duration: 0.25 },
  { frequency: c, duration: 0.75 },
];

export async function playTune(notes: Note[]) {
  for (const note of notes) {
    await new Promise((resolve) => {
      playViolinTone(note.frequency, note.duration);
      setTimeout(resolve, note.duration * 1000);
    });
  }
}

function generateNotes(
  startFrequency: number,
  interval: number,
  duration: number,
  count: number
): Note[] {
  const notes: Note[] = [];

  for (let i = 0; i < count; i++) {
    const frequency = startFrequency + i * interval;
    notes.push({ frequency, duration });
  }

  return notes;
}

export const onSubmitTune: Note[] = generateNotes(2000, 1000, 0.05, 2);

export const onCompletionTune: Note[] = generateNotes(5000, -1000, 0.05, 3);

function playTone(
  frequency: number,
  duration: number,
  oscillatorType: OscillatorType,
  gainNodeValues: number[]
) {
  const AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();

  const oscillator = audioContext.createOscillator();
  oscillator.type = oscillatorType;
  oscillator.frequency.value = frequency;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(
    gainNodeValues[0],
    audioContext.currentTime + 0.01
  );
  gainNode.gain.linearRampToValueAtTime(
    gainNodeValues[1],
    audioContext.currentTime + duration * 0.5
  );
  gainNode.gain.linearRampToValueAtTime(
    gainNodeValues[2],
    audioContext.currentTime + duration - 0.01
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export function playViolinTone(frequency: number, duration: number) {
  playTone(frequency, duration, "sawtooth", [1, 0.8, 0]);
}

export function playFluteTone(frequency: number, duration: number) {
  playTone(frequency, duration, "sine", [1, 0.1, 0]);
}

export function playSynthesizerTone(frequency: number, duration: number) {
  playTone(frequency, duration, "sine", [1, 0, 0]);
}

export function playPianoTone(frequency: number, duration: number) {
  const AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();

  const triangleOsc = audioContext.createOscillator();
  triangleOsc.type = "triangle";
  triangleOsc.frequency.value = frequency;

  const squareOsc = audioContext.createOscillator();
  squareOsc.type = "square";
  squareOsc.frequency.value = frequency;

  const triangleGain = audioContext.createGain();
  const squareGain = audioContext.createGain();
  triangleGain.gain.value = 0.6;
  squareGain.gain.value = 0.4;

  triangleOsc.connect(triangleGain);
  squareOsc.connect(squareGain);
  triangleGain.connect(audioContext.destination);
  squareGain.connect(audioContext.destination);

  triangleOsc.start(audioContext.currentTime);
  squareOsc.start(audioContext.currentTime);
  triangleOsc.stop(audioContext.currentTime + duration);
  squareOsc.stop(audioContext.currentTime + duration);
}

export function playTrumpetTone(frequency: number, duration: number) {
  playTone(frequency, duration, "square", [1, 0.6, 0]);
}
