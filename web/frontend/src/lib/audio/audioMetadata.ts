// ============================================
// AUDIO METADATA SERVICE
// Extract metadata from audio files using Web Audio API
// ============================================

import * as detector from 'web-audio-beat-detector';

export interface AudioMetadata {
  duration: number; // in seconds
  sampleRate: number; // e.g., 44100, 48000
  numberOfChannels: number; // 1 = mono, 2 = stereo
  bitDepth?: number | undefined; // Not available in Web Audio API
  format?: string | undefined; // e.g., 'audio/mpeg', 'audio/wav'
  fileName: string;
  fileSize: number; // in bytes
  bpm?: number | undefined; // Beats per minute (detected)
}

export interface WaveformData {
  peaks: number[]; // Amplitude values (-1 to 1)
  length: number; // Number of samples
}

// ============================================
// Extract Audio Metadata
// ============================================

export async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Detect BPM
        let bpm: number | undefined = undefined;
        try {
          const result = await detector.analyze(audioBuffer);
          // Library returns number (BPM) directly
          if (typeof result === 'number') {
            bpm = Math.round(result);
          }
        } catch (error) {
          console.warn('BPM detection failed:', error);
          // Continue without BPM
        }

        const metadata: AudioMetadata = {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels,
          format: file.type,
          fileName: file.name,
          fileSize: file.size,
          bpm,
        };

        // Close context to free resources
        await audioContext.close();

        resolve(metadata);
      } catch (error) {
        await audioContext.close();
        reject(new Error(`Failed to decode audio: ${error}`));
      }
    };

    fileReader.onerror = () => {
      audioContext.close();
      reject(new Error('Failed to read file'));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

// ============================================
// Generate Waveform Data
// ============================================

export async function generateWaveform(
  file: File,
  samplesPerPixel: number = 512
): Promise<WaveformData> {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get raw audio data from first channel
        const rawData = audioBuffer.getChannelData(0);
        const samples = audioBuffer.length;
        const blockSize = Math.floor(samples / samplesPerPixel);
        const peaks: number[] = [];

        // Downsample to create waveform
        for (let i = 0; i < samplesPerPixel; i++) {
          const start = blockSize * i;
          let min = 1.0;
          let max = -1.0;

          for (let j = 0; j < blockSize; j++) {
            const datum = rawData[start + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }

          // Store peak value (max absolute)
          peaks.push(Math.max(Math.abs(min), Math.abs(max)));
        }

        await audioContext.close();

        resolve({
          peaks,
          length: peaks.length,
        });
      } catch (error) {
        await audioContext.close();
        reject(new Error(`Failed to generate waveform: ${error}`));
      }
    };

    fileReader.onerror = () => {
      audioContext.close();
      reject(new Error('Failed to read file'));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

// ============================================
// Validate Audio File
// ============================================

const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg', // MP3
  'audio/mp3',
  'audio/wav', // WAV
  'audio/wave',
  'audio/x-wav',
  'audio/flac', // FLAC
  'audio/x-flac',
  'audio/mp4', // M4A
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg', // OGG
  'audio/webm', // WebM
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAudioFile(file: File): ValidationResult {
  // Check file type
  if (!SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    // Also check file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'webm'];

    if (!extension || !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file format. Supported: MP3, WAV, FLAC, M4A, AAC, OGG, WebM`,
      };
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

// ============================================
// Format File Size (Helper)
// ============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================
// Format Duration (Helper)
// ============================================

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
