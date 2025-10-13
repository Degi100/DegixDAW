#pragma once
#include <windows.h>

class FileBrowser {
public:
    FileBrowser();
    ~FileBrowser();
    void Show(HINSTANCE hInstance, HWND hParent);
    void Hide();
private:
    static LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
    HWND hwnd_ = nullptr;
    HWND hTab_ = nullptr;
    HWND hList_ = nullptr;
    void PopulateList(int tabIndex);
};
