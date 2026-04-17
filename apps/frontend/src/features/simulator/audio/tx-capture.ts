/**
 * TX Capture — captures the microphone to a MediaRecorder blob for STT.
 * Self-monitoring (mic → DSP → speakers) is intentionally disabled — real
 * VHF radios do not play your own voice back and acoustic feedback corrupts STT.
 */

export class TxCapture {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime = 0;

  /**
   * Start capturing audio from the microphone. The capture is recorded directly
   * via MediaRecorder; no AudioContext routing is needed since self-monitoring
   * is disabled (see file header).
   */
  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.chunks = [];
    const mimeType = this.getSupportedMimeType();
    this.recorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();

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
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4", // Safari/WebKit
      "audio/mp4;codecs=aac",
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }
}
