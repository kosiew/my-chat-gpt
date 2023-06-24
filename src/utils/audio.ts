// utils/audio.ts

// utils/audio.ts

export interface Note {
  frequency: number;
  duration: number;
}

export async function playTune(notes: Note[]) {
  for (const note of notes) {
    await new Promise((resolve) => {
      playTone(note.frequency, note.duration);
      setTimeout(resolve, note.duration * 1000);
    });
  }
}

export function playTone(frequency: number, duration: number) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();

  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(
    0,
    audioContext.currentTime + duration - 0.01
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}
