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

    // File Info Struktur
    struct FileInfo {
        std::string id;              // UUID
        std::string fileName;        // Originaler Dateiname
        std::string fileType;        // MIME type (image/jpeg, audio/mp3, etc.)
        std::string storagePath;     // Storage path (für signed URL generation)
        std::string thumbnailPath;   // Optional: Thumbnail path
        long long fileSize;          // Dateigröße in Bytes
        std::string createdAt;       // Timestamp

        // Helper: Formatierter Display-Name
        std::string GetDisplayName() const {
            if (fileSize > 0) {
                double sizeMB = fileSize / (1024.0 * 1024.0);
                char buffer[512];
                snprintf(buffer, sizeof(buffer), "%s (%.2f MB)", fileName.c_str(), sizeMB);
                return std::string(buffer);
            }
            return fileName;
        }

        // Helper: Ist es ein Bild?
        bool IsImage() const {
            return fileType.find("image/") == 0;
        }
    };

    // Neue API: Gibt FileInfo Structs zurück
    bool ListFilesDetailed(std::vector<FileInfo>& outFiles, FileFilter filter = FileFilter::ALL, std::string* lastError = nullptr);

    // Legacy API: Gibt nur Display-Namen zurück (für Kompatibilität)
    bool ListFiles(std::vector<std::string>& outFiles, FileFilter filter = FileFilter::ALL, std::string* lastError = nullptr);

    // Legacy-Funktion (für Kompatibilität)
    inline bool ListImages(std::vector<std::string>& outFiles, std::string* lastError = nullptr) {
        return ListFiles(outFiles, FileFilter::IMAGES, lastError);
    }
}
