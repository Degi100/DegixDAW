# DegixDAW Desktop

Electron/Tauri desktop application for DegixDAW with native DAW integration.

## Features (Planned)

- Native desktop integration
- VST plugin hosting
- DAW protocol integration (ReWire, VST3, AAX)
- Low-latency audio processing
- File system access for project management
- System tray integration

## Tech Stack (To Be Decided)

### Option 1: Electron
- **Pros**: Mature ecosystem, web tech reuse, extensive plugin support
- **Cons**: Large bundle size, higher memory usage

### Option 2: Tauri
- **Pros**: Smaller bundle, lower memory usage, Rust backend
- **Cons**: Younger ecosystem, less plugin support

## Development Setup

```bash
# Not yet implemented
# Coming soon...
```

## Architecture

```
desktop/
├── src/
│   ├── main/           # Main process (Node.js/Rust)
│   ├── renderer/       # Renderer process (React)
│   ├── audio/          # Audio engine integration
│   └── plugins/        # VST plugin loader
├── resources/          # App icons, assets
└── scripts/            # Build scripts
```

## Integration with Web Frontend

The desktop app will reuse React components from `web/frontend`:
- Shared UI components
- Shared business logic
- Shared types from `packages/types`

## Audio Processing

- Integration with VST plugins from `vst/` directory
- Real-time audio streaming
- MIDI support
- Audio file I/O

## Status

🚧 **Under Construction** - Not yet implemented

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
