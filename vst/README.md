# DegixDAW VST Plugins

Native VST/AU/AAX audio plugins for DegixDAW.

## Features (Planned)

- VST3 plugin format
- Audio Unit (AU) for macOS
- AAX for Pro Tools
- Real-time audio processing
- Parameter automation
- Preset management
- MIDI support

## Tech Stack

### JUCE Framework (Recommended)
- Cross-platform C++ framework for audio plugins
- Supports VST3, AU, AAX, LV2, Standalone
- Industry standard for plugin development
- Excellent documentation and community

## Development Setup

```bash
# Not yet implemented
# Coming soon...

# Prerequisites:
# - CMake
# - C++17 compiler (MSVC, GCC, Clang)
# - JUCE framework
# - Platform SDKs (VST3 SDK, AU SDK, AAX SDK)
```

## Architecture

```
vst/
├── Source/
│   ├── PluginProcessor.h/cpp    # Audio processing
│   ├── PluginEditor.h/cpp       # GUI
│   └── Parameters.h/cpp         # Parameter definitions
├── JuceLibraryCode/             # JUCE framework
├── Builds/                      # Platform-specific builds
│   ├── VisualStudio2022/        # Windows
│   ├── Xcode/                   # macOS
│   └── LinuxMakefile/           # Linux
└── Resources/                   # Graphics, presets
```

## Plugin Types (Planned)

1. **DegixDAW Synth** - Virtual synthesizer
2. **DegixDAW FX** - Audio effects (reverb, delay, EQ, compressor)
3. **DegixDAW Bridge** - DAW integration plugin (communicates with web frontend)

## Integration with Desktop App

The desktop app (`desktop/`) will:
- Host these VST plugins
- Provide UI for plugin management
- Handle audio routing and processing

## Status

🚧 **Under Construction** - Not yet implemented

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Resources

- [JUCE Framework](https://juce.com/)
- [VST3 SDK](https://steinbergmedia.github.io/vst3_doc/)
- [Audio Plugin Development Guide](https://www.theaudioprogrammer.com/)
