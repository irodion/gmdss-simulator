/**
 * TX Capture — microphone capture with dual output paths.
 * Clean path: MediaRecorder blob (for future STT).
 * Effected path: through radio DSP chain to speakers (self-monitoring).
 */

import { createRadioDspChain } from "./radio-effects.ts";

export class TxCapture {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private dspChain: { input: AudioNode; output: AudioNode } | null = null;
  private startTime = 0;

  /**
   * Start capturing audio from the microphone.
   * @param ctx AudioContext to use
   * @param destination Where to route the effected monitor output
   */
  async start(ctx: AudioContext, destination: AudioNode): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Clean path: MediaRecorder for STT
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, {
      mimeType: this.getSupportedMimeType(),
    });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();

    // Effected path: mic → DSP chain → speakers (self-monitoring)
    this.sourceNode = ctx.createMediaStreamSource(this.stream);
    this.dspChain = createRadioDspChain(ctx);
    this.sourceNode.connect(this.dspChain.input);
    this.dspChain.output.connect(destination);

    this.startTime = Date.now();
  }

  /**
   * Stop capturing and return the clean audio blob + duration.
   */
  stop(): Promise<{ cleanBlob: Blob; durationMs: number }> {
    const durationMs = Date.now() - this.startTime;

    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === "inactive") {
        this.cleanup();
        resolve({ cleanBlob: new Blob(), durationMs });
        return;
      }

      this.recorder.onstop = () => {
        const mimeType = this.recorder?.mimeType ?? "audio/webm";
        const cleanBlob = new Blob(this.chunks, { type: mimeType });
        this.cleanup();
        resolve({ cleanBlob, durationMs });
      };

      this.recorder.stop();
    });
  }

  /**
   * Whether capture is currently active.
   */
  isCapturing(): boolean {
    return this.recorder !== null && this.recorder.state === "recording";
  }

  private cleanup(): void {
    // Disconnect audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.dspChain) {
      this.dspChain.input.disconnect();
      this.dspChain.output.disconnect();
      this.dspChain = null;
    }

    // Stop all media tracks
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    this.recorder = null;
    this.chunks = [];
  }

  private getSupportedMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "audio/webm";
  }
}
