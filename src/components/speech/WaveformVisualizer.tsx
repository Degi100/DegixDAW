/**
 * WaveformVisualizer Component
 *
 * Animated waveform visualization during speech recording
 * Shows 5 bars that animate to simulate audio input
 */

import React, { useEffect, useState } from 'react';

interface WaveformVisualizerProps {
  /** Is currently listening/recording */
  isListening: boolean;

  /** Custom class name */
  className?: string;

  /** Number of bars to display (default: 5) */
  barCount?: number;

  /** Animation speed in ms (default: 100) */
  animationSpeed?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isListening,
  className = '',
  barCount = 5,
  animationSpeed = 100,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(barCount).fill(20)
  );

  // Animate bars while listening
  useEffect(() => {
    if (!isListening) {
      // Reset to baseline when not listening
      setBarHeights(Array(barCount).fill(20));
      return;
    }

    // Animate bars with random heights
    const interval = setInterval(() => {
      setBarHeights(
        Array(barCount)
          .fill(0)
          .map(() => Math.random() * 80 + 20) // Random height between 20% and 100%
      );
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [isListening, barCount, animationSpeed]);

  return (
    <div className={`waveform-visualizer ${className}`}>
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="waveform-visualizer__bar"
          style={{
            height: `${height}%`,
            animationDelay: `${index * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;