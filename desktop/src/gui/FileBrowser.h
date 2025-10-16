#pragma once
#include <windows.h>
#include <gdiplus.h>
#include <string>
#include <vector>
#include "../storagedata.h"

class FileBrowser {
public:
    FileBrowser();
    ~FileBrowser();
    void Show(HINSTANCE hInstance, HWND hParent);
    void Hide();
private:
    static LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
    static LRESULT CALLBACK PreviewProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
    HWND hwnd_ = nullptr;
    HWND hTab_ = nullptr;
    HWND hList_ = nullptr;
    HWND hPreview_ = nullptr;
    Gdiplus::Image* currentImage_ = nullptr;
    std::vector<storagedata::FileInfo> currentFiles_;  // Cache der aktuellen Dateien
    void PopulateList(int tabIndex);
    void LoadImagePreview(int fileIndex);  // Lade Preview anhand Index in currentFiles_
    std::string GenerateSignedUrl(const std::string& storagePath);  // Generiere Supabase signed URL
    Gdiplus::Image* DownloadImage(const std::string& url);  // Lade Bild via WinHTTP
};
