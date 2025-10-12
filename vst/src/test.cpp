
#include "gui/MainWindow.h"

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int nCmdShow) {
    MainWindow mainWindow;
    return mainWindow.Show(hInstance, nCmdShow);
}