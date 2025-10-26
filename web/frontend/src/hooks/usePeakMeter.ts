// ============================================
// usePeakMeter Hook
// Web Audio API peak detection for real-time audio level monitoring
// ============================================

import { useState, useEffect, useRef } from 'react';

interface PeakMeterState {
  peakL: number;        // 0.0 - 1.0 (linear amplitude)
  peakR: number;        // 0.0 - 1.0 (linear amplitude)
  peakLdB: number;      // dBFS (-Infinity to 0+)
  peakRdB: number;      // dBFS (-Infinity to 0+)
  peakHoldL: number;    // Peak hold value for L
  peakHoldR: number;    // Peak hold value for R
  isClipping: boolean;  // True if any channel exceeds threshold
  clipCount: number;    // Total number of clips detected
}

interface UsePeakMeterOptions {
  clipThreshold?: number;      // Threshold for clipping detection (0-1), default: 0.99
  peakHoldTime?: number;       // ms to hold peak indicator, default: 1500
  smoothingFactor?: number;    // Smoothing for visual updates (0-1), default: 0.3
}

/**
 * Hook for real-time audio peak detection using Web Audio API
 *
 * @param audioElement - HTML Audio Element to monitor
 * @param options - Configuration options
 * @returns Peak meter state with levels in linear and dBFS
 *
 * @example
 * const { peakL, peakR, peakLdB, peakRdB, isClipping } = usePeakMeter(audioRef.current);
 */
export function usePeakMeter(
  audioElement: HTMLAudioElement | null,
  options?: UsePeakMeterOptions
): PeakMeterState {
  const [state, setState] = useState<PeakMeterState>({
    peakL: 0,
    peakR: 0,
    peakLdB: -Infinity,
    peakRdB: -Infinity,
    peakHoldL: 0,
    peakHoldR: 0,
    isClipping: false,
    clipCount: 0,
  });

  // Refs for peak hold timeouts
  const peakHoldTimeoutL = useRef<number | null>(null);
  const peakHoldTimeoutR = useRef<number | null>(null);
  const peakHoldLValue = useRef<number>(0);
  const peakHoldRValue = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  useEffect(() => {
    if (!audioElement) {
      return;
    }

    // Get options with defaults
    const clipThreshold = options?.clipThreshold ?? 0.99;
    const peakHoldTime = options?.peakHoldTime ?? 1500;
    const smoothingFactor = options?.smoothingFactor ?? 0.3;

    // Setup Web Audio API
    let audioContext: AudioContext;
    let source: MediaElementAudioSourceNode;
    let splitter: ChannelSplitterNode;
    let analyserL: AnalyserNode;
    let analyserR: AnalyserNode;

    try {
      // Create or reuse audio context
      if (!audioContextRef.current) {
        audioContext = new AudioContext();
        audioContextRef.current = audioContext;
      } else {
        audioContext = audioContextRef.current;
      }

      // Create or reuse source node (can only create once per element!)
      if (!sourceNodeRef.current) {
        source = audioContext.createMediaElementSource(audioElement);
        sourceNodeRef.current = source;
      } else {
        source = sourceNodeRef.current;
      }
      
      splitter = audioContext.createChannelSplitter(2);
      analyserL = audioContext.createAnalyser();
      analyserR = audioContext.createAnalyser();

      // Configure analysers
      analyserL.fftSize = 2048;
      analyserL.smoothingTimeConstant = smoothingFactor;
      analyserR.fftSize = 2048;
      analyserR.smoothingTimeConstant = smoothingFactor;

      // Connect nodes: source → splitter → analysers
      source.connect(splitter);
      splitter.connect(analyserL, 0);  // Left channel
      splitter.connect(analyserR, 1);  // Right channel

      // Connect analysers to destination for audio output
      analyserL.connect(audioContext.destination);
      analyserR.connect(audioContext.destination);

      // IMPORTANT: Reconnect to destination for audio output
      // DEPRECATED: Direct source connection (use analyser connections instead)
      //       source.connect(audioContext.destination);

      const bufferLength = analyserL.fftSize;
      const dataArrayL = new Float32Array(bufferLength);
      const dataArrayR = new Float32Array(bufferLength);

      // Peak detection loop (runs at ~60fps)
      const detectPeaks = () => {
        // Get time domain data (raw audio samples)
        analyserL.getFloatTimeDomainData(dataArrayL);
        analyserR.getFloatTimeDomainData(dataArrayR);

        // Find peak (max absolute value)
        let maxL = 0;
        let maxR = 0;
        for (let i = 0; i < bufferLength; i++) {
          const absL = Math.abs(dataArrayL[i]);
          const absR = Math.abs(dataArrayR[i]);
          if (absL > maxL) maxL = absL;
          if (absR > maxR) maxR = absR;
        }

        // Update peak hold values
        if (maxL > peakHoldLValue.current) {
          peakHoldLValue.current = maxL;

          // Reset peak hold timeout
          if (peakHoldTimeoutL.current !== null) {
            window.clearTimeout(peakHoldTimeoutL.current);
          }

          peakHoldTimeoutL.current = window.setTimeout(() => {
            peakHoldLValue.current = 0;
          }, peakHoldTime);
        }

        if (maxR > peakHoldRValue.current) {
          peakHoldRValue.current = maxR;

          if (peakHoldTimeoutR.current !== null) {
            window.clearTimeout(peakHoldTimeoutR.current);
          }

          peakHoldTimeoutR.current = window.setTimeout(() => {
            peakHoldRValue.current = 0;
          }, peakHoldTime);
        }

        // Convert to dBFS: dB = 20 * log10(amplitude)
        const peakLdB = maxL > 0 ? 20 * Math.log10(maxL) : -Infinity;
        const peakRdB = maxR > 0 ? 20 * Math.log10(maxR) : -Infinity;

        // Detect clipping
        const isClipping = maxL >= clipThreshold || maxR >= clipThreshold;

        // Update state
        setState((prev) => ({
          peakL: maxL,
          peakR: maxR,
          peakLdB,
          peakRdB,
          peakHoldL: peakHoldLValue.current,
          peakHoldR: peakHoldRValue.current,
          isClipping,
          clipCount: isClipping ? prev.clipCount + 1 : prev.clipCount,
        }));

        // Continue loop
        animationFrameId.current = requestAnimationFrame(detectPeaks);
      };

      // Start detection
      detectPeaks();

    } catch (error) {
      console.error('[usePeakMeter] Failed to setup Web Audio API:', error);
    }

    // Cleanup
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }

      if (peakHoldTimeoutL.current !== null) {
        window.clearTimeout(peakHoldTimeoutL.current);
      }

      if (peakHoldTimeoutR.current !== null) {
        window.clearTimeout(peakHoldTimeoutR.current);
      }

      // Don't close audio context - reuse it to avoid "already connected" errors
      // audioContext.close();
    };
  }, [audioElement, options?.clipThreshold, options?.peakHoldTime, options?.smoothingFactor]);

  return state;
}
