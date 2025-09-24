export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface AudioProject {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string
  data: AudioProjectData
}

export interface AudioProjectData {
  tracks: AudioTrack[]
  bpm: number
  duration: number
  settings: ProjectSettings
}

export interface AudioTrack {
  id: string
  name: string
  type: 'audio' | 'midi'
  data: ArrayBuffer | MidiData
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  effects: AudioEffect[]
}

export interface MidiData {
  notes: MidiNote[]
  duration: number
}

export interface MidiNote {
  pitch: number
  velocity: number
  start: number
  duration: number
}

export interface AudioEffect {
  id: string
  type: string
  parameters: Record<string, unknown>
  enabled: boolean
}

export interface ProjectSettings {
  sampleRate: number
  bufferSize: number
  metronome: boolean
  countIn: boolean
}