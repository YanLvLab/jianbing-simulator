let context: AudioContext | null = null;
export type Sound =
  | "pour"
  | "scrape"
  | "egg"
  | "flip"
  | "sauce"
  | "fold"
  | "bag"
  | "happy"
  | "sad";
export function playSound(kind: Sound, enabled: boolean) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const t = context.currentTime;
    const notes: Record<Sound, [number, number, number]> = {
      pour: [230, 140, 0.12],
      scrape: [310, 180, 0.07],
      egg: [530, 240, 0.13],
      flip: [180, 450, 0.2],
      sauce: [340, 280, 0.11],
      fold: [210, 160, 0.17],
      bag: [410, 610, 0.22],
      happy: [520, 780, 0.3],
      sad: [330, 160, 0.3],
    };
    const [from, to, duration] = notes[kind];
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = kind === "happy" || kind === "bag" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(from, t);
    oscillator.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.02);
  } catch {
    /* Audio is optional. */
  }
}
