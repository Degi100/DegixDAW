#pragma once
#include <windows.h>
#include "FileBrowser.h"

class MainWindow {
public:
    MainWindow();
    ~MainWindow();
    int Show(HINSTANCE hInstance, int nCmdShow);

private:
    static LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
    HWND hwnd_ = nullptr;
    FileBrowser fileBrowser_;
};
