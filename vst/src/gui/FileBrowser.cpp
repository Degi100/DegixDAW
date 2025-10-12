#include "FileBrowser.h"
#include "storagedata.h"
#include <commctrl.h>
#include <vector>
#include <string>
#include <fstream>

FileBrowser::FileBrowser() {}
FileBrowser::~FileBrowser() {}

void FileBrowser::Show(HINSTANCE hInstance, HWND hParent) {
    // Common Controls initialisieren (TabControl braucht das für Textanzeige)
    INITCOMMONCONTROLSEX icc;
    icc.dwSize = sizeof(INITCOMMONCONTROLSEX);
    icc.dwICC = ICC_TAB_CLASSES;
    InitCommonControlsEx(&icc);
    const WCHAR CLASS_NAME[] = L"FileBrowserWindow";
    WNDCLASSW wc = {};
    wc.lpfnWndProc = FileBrowser::WindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW+1);
    RegisterClassW(&wc);
    // Child-Control direkt unter Begrüßung (y=60, Breite=MainWindow, Höhe=300)
    hwnd_ = CreateWindowExW(0, CLASS_NAME, NULL, WS_CHILD | WS_VISIBLE | WS_BORDER,
        10, 60, 780, 500, hParent, NULL, hInstance, this);
    // this-Pointer speichern für späteren Zugriff
    SetWindowLongPtr(hwnd_, GWLP_USERDATA, (LONG_PTR)this);
}

void FileBrowser::Hide() {
    if (hwnd_ && IsWindow(hwnd_)) {
        DestroyWindow(hwnd_);
        hwnd_ = nullptr;
    }
}

LRESULT CALLBACK FileBrowser::WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    static HWND hTab, hList;
    switch (uMsg) {
    case WM_CREATE: {
        FileBrowser* pThis = reinterpret_cast<FileBrowser*>(((CREATESTRUCT*)lParam)->lpCreateParams);
        if (pThis) {
            SetWindowLongPtr(hwnd, GWLP_USERDATA, (LONG_PTR)pThis);
            pThis->hTab_ = CreateWindowW(WC_TABCONTROLW, L"", WS_CHILD | WS_VISIBLE,
                10, 10, 750, 30, hwnd, NULL, NULL, NULL);
            TCITEMW tie = { 0 };
            tie.mask = TCIF_TEXT;
            tie.pszText = (LPWSTR)L"Alle Dateien";
            TabCtrl_InsertItem(pThis->hTab_, 0, &tie);
            tie.pszText = (LPWSTR)L"Empfangene Dateien";
            TabCtrl_InsertItem(pThis->hTab_, 1, &tie);
            tie.pszText = (LPWSTR)L"Bilder";
            TabCtrl_InsertItem(pThis->hTab_, 2, &tie);
            pThis->hList_ = CreateWindowW(L"LISTBOX", L"", WS_CHILD | WS_VISIBLE | WS_BORDER | LBS_NOTIFY | WS_VSCROLL,
                10, 50, 750, 430, hwnd, NULL, NULL, NULL);
            // Initial die erste Liste befüllen
            pThis->PopulateList(0);
        }
        return 0;
    }
    case WM_NOTIFY: {
        NMHDR* nmhdr = (NMHDR*)lParam;
        FileBrowser* pThis = reinterpret_cast<FileBrowser*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
        if (pThis && nmhdr->code == TCN_SELCHANGE) {
            int tabIndex = TabCtrl_GetCurSel(pThis->hTab_);
            pThis->PopulateList(tabIndex);
        }
        break;
    }
    case WM_KEYDOWN: {
        // Strg+C: Kopierfunktion für Listbox
        if (wParam == 'C' && (GetKeyState(VK_CONTROL) & 0x8000)) {
            FileBrowser* pThis = reinterpret_cast<FileBrowser*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
            if (pThis && pThis->hList_) {
                int selIndex = (int)SendMessage(pThis->hList_, LB_GETCURSEL, 0, 0);
                if (selIndex != LB_ERR) {
                    int len = (int)SendMessage(pThis->hList_, LB_GETTEXTLEN, selIndex, 0);
                    if (len > 0) {
                        std::vector<WCHAR> buffer(len + 1);
                        SendMessage(pThis->hList_, LB_GETTEXT, selIndex, (LPARAM)buffer.data());
                        if (OpenClipboard(hwnd)) {
                            EmptyClipboard();
                            HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, (len + 1) * sizeof(WCHAR));
                            if (hMem) {
                                memcpy(GlobalLock(hMem), buffer.data(), (len + 1) * sizeof(WCHAR));
                                GlobalUnlock(hMem);
                                SetClipboardData(CF_UNICODETEXT, hMem);
                            }
                            CloseClipboard();
                        }
                    }
                }
            }
            return 0;
        }
        break;
    }
    case WM_CONTEXTMENU: {
        // Rechtsklick-Kontextmenü
        FileBrowser* pThis = reinterpret_cast<FileBrowser*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
        if (pThis && pThis->hList_) {
            HMENU hMenu = CreatePopupMenu();
            AppendMenuW(hMenu, MF_STRING, 1, L"Kopieren");
            POINT pt;
            pt.x = LOWORD(lParam);
            pt.y = HIWORD(lParam);
            if (pt.x == -1 && pt.y == -1) {
                GetCursorPos(&pt);
            }
            int cmd = TrackPopupMenu(hMenu, TPM_RETURNCMD | TPM_RIGHTBUTTON, pt.x, pt.y, 0, hwnd, NULL);
            if (cmd == 1) {
                // Kopieren
                int selIndex = (int)SendMessage(pThis->hList_, LB_GETCURSEL, 0, 0);
                if (selIndex != LB_ERR) {
                    int len = (int)SendMessage(pThis->hList_, LB_GETTEXTLEN, selIndex, 0);
                    if (len > 0) {
                        std::vector<WCHAR> buffer(len + 1);
                        SendMessage(pThis->hList_, LB_GETTEXT, selIndex, (LPARAM)buffer.data());
                        if (OpenClipboard(hwnd)) {
                            EmptyClipboard();
                            HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, (len + 1) * sizeof(WCHAR));
                            if (hMem) {
                                memcpy(GlobalLock(hMem), buffer.data(), (len + 1) * sizeof(WCHAR));
                                GlobalUnlock(hMem);
                                SetClipboardData(CF_UNICODETEXT, hMem);
                            }
                            CloseClipboard();
                        }
                    }
                }
            }
            DestroyMenu(hMenu);
        }
        return 0;
    }
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

void FileBrowser::PopulateList(int tabIndex) {
    if (!hList_) return;
    SendMessage(hList_, LB_RESETCONTENT, 0, 0);
    
    // Filter basierend auf Tab auswählen
    storagedata::FileFilter filter;
    switch (tabIndex) {
        case 0: // Alle Dateien
            filter = storagedata::FileFilter::ALL;
            break;
        case 1: // Empfangene Dateien
            filter = storagedata::FileFilter::RECEIVED;
            break;
        case 2: // Bilder
            filter = storagedata::FileFilter::IMAGES;
            break;
        default:
            filter = storagedata::FileFilter::ALL;
            break;
    }
    
    // Dateien mit entsprechendem Filter laden
    std::vector<std::string> files;
    std::string err;
    if (storagedata::ListFiles(files, filter, &err)) {
        if (files.empty()) {
            SendMessage(hList_, LB_ADDSTRING, 0, (LPARAM)L"Keine Dateien gefunden.");
        } else {
            for (const auto& f : files) {
                std::wstring wf(f.begin(), f.end());
                SendMessage(hList_, LB_ADDSTRING, 0, (LPARAM)wf.c_str());
            }
        }
    } else {
        std::wstring werr(err.begin(), err.end());
        SendMessage(hList_, LB_ADDSTRING, 0, (LPARAM)werr.c_str());
    }
}
