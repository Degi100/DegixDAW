#pragma once
#include <string>
#include <vector>

namespace storagedata {
    // Filter-Typen für verschiedene Tabs
    enum class FileFilter {
        ALL,              // Alle Dateien
        RECEIVED,         // Nur empfangene Dateien (von anderen Usern)
        IMAGES,           // Nur Bilder (image/*)
        AUDIO,            // Nur Audio (audio/*)
        MIDI,             // Nur MIDI (audio/midi, audio/x-midi)
        VIDEO             // Nur Videos (video/*)
    };
    
    // Holt Dateien aus message_attachments mit optionalem Filter
    bool ListFiles(std::vector<std::string>& outFiles, FileFilter filter = FileFilter::ALL, std::string* lastError = nullptr);
    
    // Legacy-Funktion (für Kompatibilität)
    inline bool ListImages(std::vector<std::string>& outFiles, std::string* lastError = nullptr) {
        return ListFiles(outFiles, FileFilter::IMAGES, lastError);
    }
}
