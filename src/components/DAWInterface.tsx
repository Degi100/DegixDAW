import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { audioEngine } from '../lib/audioEngine'
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  Volume2, 
  LogOut, 
  Save, 
  FolderOpen,
  Music
} from 'lucide-react'

export function DAWInterface() {
  const { user, signOut } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [bpm, setBpm] = useState(120)
  const [currentRecording, setCurrentRecording] = useState<Blob | null>(null)

  useEffect(() => {
    audioEngine.initialize().catch(console.error)
  }, [])

  const handleStartRecording = async () => {
    try {
      await audioEngine.startRecording()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check microphone permissions.')
    }
  }

  const handleStopRecording = async () => {
    try {
      const recording = await audioEngine.stopRecording()
      setCurrentRecording(recording)
      setIsRecording(false)
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }
  }

  const handlePlayMetronome = () => {
    if (isPlaying) {
      audioEngine.stopMetronome()
      setIsPlaying(false)
    } else {
      audioEngine.playMetronome(bpm)
      setIsPlaying(true)
    }
  }

  const handleVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    audioEngine.setMasterVolume((volume - 1) * 20) // Convert to dB
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">🎧 DegixDAW</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              Welcome, {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <div className="space-y-4">
            <button className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors">
              <FolderOpen className="h-4 w-4" />
              <span>New Project</span>
            </button>
            
            <button className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
              <Save className="h-4 w-4" />
              <span>Save Project</span>
            </button>

            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Project Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">BPM</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    min="60"
                    max="200"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Master Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6">
          {/* Transport Controls */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handlePlayMetronome}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isPlaying 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>

              <button className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors">
                <Square className="h-6 w-6" />
              </button>

              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <Mic className="h-6 w-6" />
              </button>

              <div className="flex items-center space-x-2 ml-8">
                <Volume2 className="h-5 w-5" />
                <span className="text-sm font-mono">{Math.round(masterVolume * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording in progress...</span>
              </div>
            </div>
          )}

          {/* Current Recording */}
          {currentRecording && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium mb-2">Latest Recording</h3>
              <audio 
                controls 
                src={URL.createObjectURL(currentRecording)}
                className="w-full"
              />
            </div>
          )}

          {/* Track Area - Placeholder for now */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400">
              <Music className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Ready to Create</h3>
              <p>Start recording to create your first track</p>
              <div className="mt-6 text-sm">
                <p>Coming Soon:</p>
                <ul className="mt-2 space-y-1">
                  <li>🔜 Multi-track recording</li>
                  <li>🔜 MIDI support</li>
                  <li>🔜 Audio effects</li>
                  <li>🔜 Cloud sync</li>
                  <li>🔜 VST integration</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}