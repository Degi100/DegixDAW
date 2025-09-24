import * as Tone from 'tone'

export class AudioEngine {
  private static instance: AudioEngine
  private initialized = false
  private recorder: Tone.Recorder | null = null
  private metronome: Tone.Player | null = null
  private masterVolume: Tone.Volume | null = null

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine()
    }
    return AudioEngine.instance
  }

  async initialize() {
    if (this.initialized) return

    try {
      await Tone.start()
      
      // Set up master volume
      this.masterVolume = new Tone.Volume(-10).toDestination()
      
      // Initialize recorder
      this.recorder = new Tone.Recorder()
      
      // Create a simple metronome
      this.metronome = new Tone.Player({
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCjiX2+3PdCsEJIHO7tySOgcXZrjnwK1bGAg+lNv2z3+tGzSH0/H+8B6rGjOH0vL/8x6pGzKHavg8qno='
      }).connect(this.masterVolume)

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
      throw error
    }
  }

  async startRecording(): Promise<void> {
    if (!this.initialized) await this.initialize()
    if (!this.recorder) throw new Error('Recorder not initialized')

    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = Tone.context.createMediaStreamSource(stream)
    
    // Connect to recorder using native web audio API
    const recorderInput = (this.recorder as unknown as { input: { input: AudioNode } }).input
    if (recorderInput && recorderInput.input) {
      source.connect(recorderInput.input)
    }
    this.recorder.start()
  }

  async stopRecording(): Promise<Blob> {
    if (!this.recorder) throw new Error('Recorder not initialized')
    
    const recording = await this.recorder.stop()
    return recording
  }

  async playMetronome(bpm: number = 120): Promise<void> {
    if (!this.initialized) await this.initialize()
    if (!this.metronome) return

    Tone.Transport.bpm.value = bpm
    this.metronome.start()
    Tone.Transport.start()
  }

  stopMetronome(): void {
    if (this.metronome) {
      this.metronome.stop()
      Tone.Transport.stop()
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterVolume) {
      this.masterVolume.volume.value = volume
    }
  }

  dispose(): void {
    if (this.recorder) {
      this.recorder.dispose()
      this.recorder = null
    }
    if (this.metronome) {
      this.metronome.dispose()
      this.metronome = null
    }
    if (this.masterVolume) {
      this.masterVolume.dispose()
      this.masterVolume = null
    }
    this.initialized = false
  }
}

export const audioEngine = AudioEngine.getInstance()