/**
 * Radio DSP chain — bandpass → distortion → compression.
 * Simulates the frequency response of a VHF marine radio speaker.
 */

/**
 * Create the radio DSP chain and return input/output nodes.
 * Connect any audio source to `input` and route `output` to destination.
 */
export function createRadioDspChain(ctx: AudioContext): {
  input: AudioNode;
  output: AudioNode;
} {
  // 1. Bandpass filter: 300–3400 Hz (voice band for VHF radio)
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1850; // center of 300–3400
  bandpass.Q.value = 0.6; // wide enough for voice

  // 2. Waveshaper: light distortion for radio character
  const distortion = ctx.createWaveShaper();
  distortion.curve = createDistortionCurve(8) as Float32Array<ArrayBuffer>;
  distortion.oversample = "2x";

  // 3. Dynamics compressor: heavy compression like a radio AGC
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.ratio.value = 12;
  compressor.knee.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.1;

  // 4. Output gain
  const gain = ctx.createGain();
  gain.gain.value = 0.8;

  // Chain: bandpass → distortion → compressor → gain
  bandpass.connect(distortion);
  distortion.connect(compressor);
  compressor.connect(gain);

  return { input: bandpass, output: gain };
}

/**
 * Generate a soft-clipping distortion curve.
 */
function createDistortionCurve(amount: number): Float32Array {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Create a filtered white noise generator for ambient radio static.
 * Returns the source node and a gain node for squelch control.
 */
export function createNoiseGenerator(ctx: AudioContext): {
  source: AudioBufferSourceNode;
  gain: GainNode;
} {
  // Generate white noise buffer (2 seconds, looped)
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Bandpass to shape noise like radio static
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2000;
  filter.Q.value = 0.3;

  const gain = ctx.createGain();
  gain.gain.value = 0.05; // default low level

  source.connect(filter);
  filter.connect(gain);

  return { source, gain };
}

/**
 * Map squelch level (0–100) to noise gain.
 * Higher squelch = less noise.
 */
export function squelchToNoiseGain(squelch: number): number {
  // Inverse: squelch 0 = full noise (0.15), squelch 100 = silence (0)
  const ratio = 1 - squelch / 100;
  return ratio * 0.15;
}
