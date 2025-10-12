#include "FileBrowser.h"
#pragma once
#include <windows.h>
#include <string>

class MainWindow {
public:
    MainWindow();
    ~MainWindow();
    int Show(HINSTANCE hInstance, int nCmdShow);
private:
    FileBrowser fileBrowser_;

private:
    static LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
    HWND hwnd_ = nullptr;
};
