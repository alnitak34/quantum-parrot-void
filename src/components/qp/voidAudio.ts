// Shared dark ambient audio (Web Audio API, no external assets).
// Started on first user interaction (e.g. ENTER THE VOID click).
// Mute toggle controlled from the navbar.

type Listener = (muted: boolean) => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let oscs: OscillatorNode[] = [];
let started = false;
let muted = false;
const listeners = new Set<Listener>();

const TARGET_GAIN = 0.15;
const RAMP_SECONDS = 3;

export function startVoidAudio() {
  if (started) return;
  started = true;
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();

    master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(muted ? 0 : TARGET_GAIN, ctx.currentTime + RAMP_SECONDS);
    master.connect(ctx.destination);

    [55, 57].forEach((freq) => {
      const o = ctx!.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(master!);
      o.start();
      oscs.push(o);
    });
  } catch {
    started = false;
  }
}

export function isVoidAudioStarted() {
  return started;
}

export function isVoidAudioMuted() {
  return muted;
}

export function setVoidAudioMuted(next: boolean) {
  muted = next;
  if (ctx && master) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : TARGET_GAIN, now + 0.4);
  }
  listeners.forEach((l) => l(muted));
}

export function subscribeVoidAudio(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
