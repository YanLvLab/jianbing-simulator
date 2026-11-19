let context: AudioContext | null = null;
export type Sound =
  | "pour"
  | "scrape"
  | "egg"
  | "flip"
  | "sauce"
  | "fold"
  | "cut"
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
      cut: [440, 170, 0.12],
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
    gain.gain.exponentialRampToValueAtTime(
      ["happy", "sad", "bag"].includes(kind) ? 0.07 : 0.025,
      t + 0.012,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.02);
    if (!["happy", "sad"].includes(kind)) {
      const buffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * duration),
        context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = kind === "egg" || kind === "cut" ? "highpass" : "bandpass";
      filter.frequency.value =
        kind === "scrape" ? 1100 : kind === "sauce" ? 520 : 1600;
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t);
      noiseGain.gain.linearRampToValueAtTime(
        kind === "egg" ? 0.09 : 0.045,
        t + 0.015,
      );
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      noise.connect(filter).connect(noiseGain).connect(context.destination);
      noise.start(t);
      noise.stop(t + duration);
    }
  } catch {
    /* Audio is optional. */
  }
}

export function startMusic(enabled: boolean) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const audio = context;
    const notes = [
      293.66, 369.99, 440, 554.37, 440, 369.99, 329.63, 440, 587.33, 440,
      369.99, 329.63,
    ];
    let step = 0;
    const play = () => {
      const t = audio.currentTime;
      const tone = audio.createOscillator();
      const gain = audio.createGain();
      tone.type = "sine";
      tone.frequency.value = notes[step++ % notes.length];
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.016, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      tone.connect(gain).connect(audio.destination);
      tone.start(t);
      tone.stop(t + 0.51);
    };
    play();
    const timer = window.setInterval(play, 540);
    return () => window.clearInterval(timer);
  } catch {
    return;
  }
}
