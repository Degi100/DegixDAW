#pragma once
#include <windows.h>
#include <gdiplus.h>
#include <string>

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
    void PopulateList(int tabIndex);
    void LoadImagePreview(const std::string& fileName);
    std::string GetImageUrl(const std::string& displayName);
};
