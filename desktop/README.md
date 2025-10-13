# DegixDAW Desktop Application

Native Windows desktop app for DegixDAW with Supabase integration.

## Features

- **Authentication**: Supabase OAuth integration
- **File Browser**: Multi-tab file browser with filtering
  - All files, Received, Images, Audio, MIDI, Video
  - Clipboard support (Ctrl+C)
  - Context menu integration
- **Storage API**: Direct Supabase REST API client
  - Message attachments listing
  - File metadata retrieval
  - WinHTTP implementation

## Tech Stack

- **Language**: C++17
- **GUI**: Windows API (Win32)
- **HTTP**: WinHTTP
- **Backend**: Supabase (Auth + Storage)
- **Build**: CMake + Visual Studio 2022

## Project Structure

```
vst/
├── CMakeLists.txt           # Build configuration
├── src/
│   ├── main.cpp             # Application entry point
│   ├── auth/
│   │   ├── Auth.cpp/h       # Supabase authentication
│   ├── gui/
│   │   └── FileBrowser.cpp/h # File browser UI
│   ├── util/
│   │   └── StringUtil.cpp/h  # UTF-8/UTF-16 helpers
│   ├── storagedata.cpp/h    # Storage API client
│   ├── config.h             # Configuration
│   ├── types.h              # Type definitions
│   ├── debug.cpp            # Debug utilities
│   └── test.cpp             # Test code
└── build/                   # Generated build files
```

## Build Instructions

### Prerequisites

- Visual Studio 2022 with C++ Desktop Development
- CMake 3.15+
- Windows SDK

### Building

```bash
# Generate Visual Studio solution
cmake -B build -G "Visual Studio 17 2022"

# Build project
cmake --build build --config Release

# Or open in Visual Studio
start build/DegixDAW-VST.sln
```

### VS Code

Install extensions:
- C/C++ (Microsoft)
- CMake Tools (Microsoft)

Press `Ctrl+Shift+P` → "CMake: Configure" to generate build files.

## Configuration

Create `src/config.h` with your Supabase credentials:

```cpp
#define SUPABASE_URL "https://your-project.supabase.co"
#define SUPABASE_ANON_KEY "your-anon-key"
```

## Running

```bash
# Via CMake
cmake --build build --target run

# Or directly
./build/bin/DegixDAW-VST.exe
```

## Integration with Web Frontend

The desktop app communicates with the web frontend via:
- Shared Supabase database
- Real-time subscriptions
- Storage API for file sharing

## Development Status

✅ **Implemented:**
- Authentication flow
- File browser UI
- Storage API client
- UTF-8/UTF-16 conversion

🚧 **TODO:**
- Complete OAuth callback handling
- Implement file upload
- Add audio playback
- MIDI file parsing
- DAW integration

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Resources

- [JUCE Framework](https://juce.com/)
- [VST3 SDK](https://steinbergmedia.github.io/vst3_doc/)
- [Audio Plugin Development Guide](https://www.theaudioprogrammer.com/)
