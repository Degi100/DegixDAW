// ============================================
// CHAT SOUND SYSTEM
// Web Audio API - Synthesized Sounds
// ============================================

class ChatSoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    this.initAudioContext();
  }

  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      try {
        const win = window as unknown as { webkitAudioContext?: typeof AudioContext };
        this.audioContext = new (window.AudioContext || win.webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private createChord(frequencies: number[], duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.isEnabled) return;

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      oscillator.type = type;
      
      // Staggered start for chord effect
      const startTime = this.audioContext!.currentTime + (index * 0.01);
      const endTime = startTime + duration;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
      
      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  }

  // Sound Effects
  async playMessageReceived(): Promise<void> {
    await this.ensureAudioContext();
    // Soft notification sound - gentle bell
    this.createChord([523.25, 659.25], 0.3, 'sine');
  }

  async playMessageSent(): Promise<void> {
    await this.ensureAudioContext();
    // Quick "whoosh" sound - descending tone
    this.createTone(800, 0.15, 'sawtooth');
    setTimeout(() => this.createTone(400, 0.1, 'sawtooth'), 50);
  }

  async playNewChat(): Promise<void> {
    await this.ensureAudioContext();
    // Friendly "ding" - ascending chord
    this.createChord([440, 554.37, 659.25], 0.4, 'sine');
  }

  async playChatOpen(): Promise<void> {
    await this.ensureAudioContext();
    // Subtle open sound
    this.createTone(600, 0.2, 'sine');
  }

  async playChatClose(): Promise<void> {
    await this.ensureAudioContext();
    // Subtle close sound
    this.createTone(400, 0.15, 'sine');
  }

  // Control methods
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  // Cleanup
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const chatSounds = new ChatSoundManager();

// Hook for React components
export const useChatSounds = () => {
  return {
    playMessageReceived: () => chatSounds.playMessageReceived(),
    playMessageSent: () => chatSounds.playMessageSent(),
    playNewChat: () => chatSounds.playNewChat(),
    playChatOpen: () => chatSounds.playChatOpen(),
    playChatClose: () => chatSounds.playChatClose(),
    setEnabled: (enabled: boolean) => chatSounds.setEnabled(enabled),
    isEnabled: () => chatSounds.isSoundEnabled(),
  };
};
