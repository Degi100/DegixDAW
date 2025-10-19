// Type declarations for web-audio-beat-detector
// Project: https://github.com/chrisguttandin/web-audio-beat-detector
// Definitions by: Claude Code

declare module 'web-audio-beat-detector' {
  /**
   * Analyzes an audio buffer and detects the tempo/BPM
   * @param audioBuffer - The AudioBuffer to analyze
   * @returns A promise that resolves to an object containing the detected tempo
   */
  export function analyze(
    audioBuffer: AudioBuffer
  ): Promise<{
    bpm: number;
    offset: number;
    tempo: number;
  }>;

  /**
   * Detects the tempo/BPM from an audio buffer
   * @param audioBuffer - The AudioBuffer to analyze
   * @returns A promise that resolves to the detected BPM
   */
  export function guess(audioBuffer: AudioBuffer): Promise<number>;
}
