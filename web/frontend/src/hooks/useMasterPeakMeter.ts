// ============================================
// useMasterPeakMeter Hook
// Multi-track audio summing for master bus monitoring
// ============================================

import { useState, useEffect, useRef } from 'react';

interface MasterPeakState {
  peak: number;          // 0.0 - 1.0 (linear amplitude, summed from all tracks)
  peakdB: number;        // dBFS (-Infinity to 0+)
  peakHold: number;      // Peak hold value
  isClipping: boolean;   // True if any track exceeds threshold
  clipCount: number;     // Total clips across all tracks
  activeTrackCount: number; // Number of currently playing tracks
}

interface UseMasterPeakMeterOptions {
  clipThreshold?: number;      // Threshold for clipping detection (0-1), default: 0.99
  peakHoldTime?: number;       // ms to hold peak indicator, default: 1500
}

/**
 * Hook for master bus peak monitoring (summing multiple tracks)
 *
 * NOTE: This is a simplified version for NOW.
 * In a real DAW, you'd need:
 * - Audio Context with GainNode summing
 * - Multi-track synchronization
 * - Proper mixing/summing algorithms
 *
 * Current implementation: Monitors single "active" track (the one playing in AudioPlayer)
 * Later: Extend for true multi-track summing when timeline/multi-track playback exists
 *
 * @param audioElements - Array of HTML Audio Elements to monitor
 * @param options - Configuration options
 * @returns Master peak state with summed levels
 *
 * @example
 * const { peak, peakdB, isClipping } = useMasterPeakMeter([audioRef1.current, audioRef2.current]);
 */
export function useMasterPeakMeter(
  audioElements: (HTMLAudioElement | null)[],
  options?: UseMasterPeakMeterOptions
): MasterPeakState {
  const [state, setState] = useState<MasterPeakState>({
    peak: 0,
    peakdB: -Infinity,
    peakHold: 0,
    isClipping: false,
    clipCount: 0,
    activeTrackCount: 0,
  });

  const peakHoldTimeout = useRef<number | null>(null);
  const peakHoldValue = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodesRef = useRef<Map<HTMLAudioElement, AnalyserNode>>(new Map());

  useEffect(() => {
    // Filter out null elements
    const validElements = audioElements.filter((el): el is HTMLAudioElement => el !== null);

    if (validElements.length === 0) {
      return;
    }

    // Get options with defaults
    const clipThreshold = options?.clipThreshold ?? 0.99;
    const peakHoldTime = options?.peakHoldTime ?? 1500;

    // Setup Web Audio API
    let audioContext: AudioContext;
    const analysers: AnalyserNode[] = [];
    const sources: MediaElementAudioSourceNode[] = [];

    try {
      // Create or reuse audio context
      if (!audioContextRef.current) {
        audioContext = new AudioContext();
        audioContextRef.current = audioContext;
      } else {
        audioContext = audioContextRef.current;
      }

      // Create analyser for each audio element
      validElements.forEach((audioElement) => {
        // Skip if already has analyser
        if (analyserNodesRef.current.has(audioElement)) {
          const existingAnalyser = analyserNodesRef.current.get(audioElement)!;
          analysers.push(existingAnalyser);
          return;
        }

        // Create source and analyser
        const source = audioContext.createMediaElementSource(audioElement);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.3;

        // Connect: source → analyser → destination
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analysers.push(analyser);
        sources.push(source);
        analyserNodesRef.current.set(audioElement, analyser);
      });

      const bufferLength = analysers[0]?.fftSize || 2048;
      const dataArrays: Float32Array[] = analysers.map(() => new Float32Array(bufferLength));

      // Peak detection loop
      const detectPeaks = () => {
        let maxPeak = 0;
        let activeCount = 0;

        // Get peaks from all tracks
        analysers.forEach((analyser, index) => {
          analyser.getFloatTimeDomainData(dataArrays[index]);

          // Find peak in this track
          let trackPeak = 0;
          for (let i = 0; i < bufferLength; i++) {
            const abs = Math.abs(dataArrays[index][i]);
            if (abs > trackPeak) trackPeak = abs;
          }

          // Check if track is active (producing audio)
          if (trackPeak > 0.001) {
            activeCount++;
          }

          // Sum peaks (simple approach - real DAW would use proper mixing)
          // Using RMS-style summing: sqrt(sum of squares)
          maxPeak += trackPeak * trackPeak;
        });

        // Calculate final peak (RMS)
        const finalPeak = analysers.length > 0 ? Math.sqrt(maxPeak / analysers.length) : 0;

        // Update peak hold
        if (finalPeak > peakHoldValue.current) {
          peakHoldValue.current = finalPeak;

          if (peakHoldTimeout.current !== null) {
            window.clearTimeout(peakHoldTimeout.current);
          }

          peakHoldTimeout.current = window.setTimeout(() => {
            peakHoldValue.current = 0;
          }, peakHoldTime);
        }

        // Convert to dBFS
        const peakdB = finalPeak > 0 ? 20 * Math.log10(finalPeak) : -Infinity;

        // Detect clipping
        const isClipping = finalPeak >= clipThreshold;

        // Update state
        setState((prev) => ({
          peak: finalPeak,
          peakdB,
          peakHold: peakHoldValue.current,
          isClipping,
          clipCount: isClipping ? prev.clipCount + 1 : prev.clipCount,
          activeTrackCount: activeCount,
        }));

        // Continue loop
        animationFrameId.current = requestAnimationFrame(detectPeaks);
      };

      detectPeaks();

    } catch (error) {
      console.error('[useMasterPeakMeter] Failed to setup Web Audio API:', error);
    }

    // Cleanup
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }

      if (peakHoldTimeout.current !== null) {
        window.clearTimeout(peakHoldTimeout.current);
      }

      // Don't close audio context - reuse it
      // Don't disconnect nodes - they might be used by track meters
    };
  }, [audioElements, options?.clipThreshold, options?.peakHoldTime]);

  return state;
}
