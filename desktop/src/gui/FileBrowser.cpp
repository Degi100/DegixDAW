#include "FileBrowser.h"
#include "storagedata.h"
#include "../auth/Auth.h"
#include <commctrl.h>
#include <vector>
#include <string>
#include <fstream>
#include <algorithm>
#include <winhttp.h>
#include <gdiplus.h>

#pragma comment(lib, "gdiplus.lib")

using namespace Gdiplus;

// Hilfsfunktion für sichere UTF-8 zu UTF-16 Konvertierung
static std::wstring Utf8ToUtf16(const std::string& utf8) {
    if (utf8.empty()) return L"";
    
    // Berechne benötigte Buffer-Größe
    int len = MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, NULL, 0);
    if (len <= 0) {
        // Fallback: Zeichen für Zeichen konvertieren (nur für ASCII)
        std::wstring result;
        for (char c : utf8) {
            if (c >= 0) { // Nur ASCII-Bereich
                result += (wchar_t)c;
            }
        }
        return result;
    }
    
    // Konvertierung durchführen
    std::vector<wchar_t> buffer(len + 1, 0); // +1 für Sicherheit
    int result = MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, buffer.data(), len);
    if (result > 0) {
        return std::wstring(buffer.data());
    }
    
    // Letzter Fallback
    return L"[Konvertierungsfehler]";
}

// GDI+ Initialization
static ULONG_PTR gdiplusToken = 0;

FileBrowser::FileBrowser() {
    // Initialize GDI+
    if (gdiplusToken == 0) {
        GdiplusStartupInput gdiplusStartupInput;
        GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);
    }
}

FileBrowser::~FileBrowser() {
    if (currentImage_) {
        delete currentImage_;
        currentImage_ = nullptr;
    }
}

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

            // Listbox (links, schmaler für Split-View)
            pThis->hList_ = CreateWindowExW(0, L"LISTBOX", L"", WS_CHILD | WS_VISIBLE | WS_BORDER | LBS_NOTIFY | WS_VSCROLL | LBS_HASSTRINGS,
                10, 50, 360, 430, hwnd, (HMENU)1001, NULL, NULL);

            // Preview-Panel (rechts)
            WNDCLASSW previewClass = {};
            previewClass.lpfnWndProc = FileBrowser::PreviewProc;
            previewClass.hInstance = GetModuleHandle(NULL);
            previewClass.lpszClassName = L"PreviewPanel";
            previewClass.hbrBackground = (HBRUSH)(COLOR_WINDOW+1);
            previewClass.hCursor = LoadCursor(NULL, IDC_ARROW);
            RegisterClassW(&previewClass);

            pThis->hPreview_ = CreateWindowExW(WS_EX_CLIENTEDGE, L"PreviewPanel", L"", WS_CHILD | WS_VISIBLE,
                380, 50, 380, 430, hwnd, (HMENU)1002, NULL, pThis);

            SetWindowLongPtr(pThis->hPreview_, GWLP_USERDATA, (LONG_PTR)pThis);

            // Initial die erste Liste befüllen
            pThis->PopulateList(0);
        }
        return 0;
    }
    case WM_COMMAND: {
        FileBrowser* pThis = reinterpret_cast<FileBrowser*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
        if (pThis && LOWORD(wParam) == 1001 && HIWORD(wParam) == LBN_SELCHANGE) {
            // User hat eine Datei in der Liste ausgewählt
            int selIndex = (int)SendMessage(pThis->hList_, LB_GETCURSEL, 0, 0);
            if (selIndex != LB_ERR) {
                int len = (int)SendMessage(pThis->hList_, LB_GETTEXTLEN, selIndex, 0);
                if (len > 0) {
                    std::vector<WCHAR> buffer(len + 1);
                    SendMessage(pThis->hList_, LB_GETTEXT, selIndex, (LPARAM)buffer.data());

                    // Konvertiere zurück zu UTF-8
                    int utf8Len = WideCharToMultiByte(CP_UTF8, 0, buffer.data(), -1, NULL, 0, NULL, NULL);
                    std::vector<char> utf8Buffer(utf8Len);
                    WideCharToMultiByte(CP_UTF8, 0, buffer.data(), -1, utf8Buffer.data(), utf8Len, NULL, NULL);
                    std::string fileName(utf8Buffer.data());

                    // Lade Bildvorschau
                    pThis->LoadImagePreview(fileName);
                }
            }
        }
        break;
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
            AppendMenuW(hMenu, MF_STRING, 2, L"Im Browser öffnen");
            AppendMenuW(hMenu, MF_STRING, 3, L"Thumbnail öffnen (nur Bilder)");
            POINT pt;
            pt.x = LOWORD(lParam);
            pt.y = HIWORD(lParam);
            if (pt.x == -1 && pt.y == -1) {
                GetCursorPos(&pt);
            }
            int cmd = TrackPopupMenu(hMenu, TPM_RETURNCMD | TPM_RIGHTBUTTON, pt.x, pt.y, 0, hwnd, NULL);
            if (cmd == 1) {
                // Kopieren (bestehende Logik)
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
            } else if (cmd == 2) {
                // Im Browser öffnen - hier würde man die URL aus der Datenbank brauchen
                MessageBoxW(hwnd, L"Funktion noch nicht implementiert - brauche Datei-URLs aus Datenbank", L"Info", MB_OK);
            } else if (cmd == 3) {
                // Thumbnail öffnen
                MessageBoxW(hwnd, L"Thumbnail-Funktion noch nicht implementiert", L"Info", MB_OK);
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
            // Alle Dateien mit korrekter UTF-8 Konvertierung anzeigen
            for (const auto& file : files) {
                std::wstring wfile = Utf8ToUtf16(file);
                SendMessage(hList_, LB_ADDSTRING, 0, (LPARAM)wfile.c_str());
            }
        }
    } else {
        std::wstring werr = Utf8ToUtf16(err);
        SendMessage(hList_, LB_ADDSTRING, 0, (LPARAM)werr.c_str());
    }
}

// Preview Window Procedure
LRESULT CALLBACK FileBrowser::PreviewProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    FileBrowser* pThis = reinterpret_cast<FileBrowser*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));

    switch (uMsg) {
    case WM_PAINT: {
        PAINTSTRUCT ps;
        HDC hdc = BeginPaint(hwnd, &ps);

        if (pThis && pThis->currentImage_) {
            // Zeichne Bild
            Graphics graphics(hdc);
            graphics.SetInterpolationMode(InterpolationModeHighQualityBicubic);

            RECT rect;
            GetClientRect(hwnd, &rect);
            int panelWidth = rect.right - rect.left;
            int panelHeight = rect.bottom - rect.top;

            UINT imgWidth = pThis->currentImage_->GetWidth();
            UINT imgHeight = pThis->currentImage_->GetHeight();

            // Berechne Skalierung (fit to window, keep aspect ratio)
            float scaleX = (float)panelWidth / imgWidth;
            float scaleY = (float)panelHeight / imgHeight;
            float scale = (scaleX < scaleY) ? scaleX : scaleY;

            int drawWidth = (int)(imgWidth * scale);
            int drawHeight = (int)(imgHeight * scale);
            int offsetX = (panelWidth - drawWidth) / 2;
            int offsetY = (panelHeight - drawHeight) / 2;

            graphics.DrawImage(pThis->currentImage_, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            // Zeige Platzhalter-Text
            RECT rect;
            GetClientRect(hwnd, &rect);
            SetTextColor(hdc, RGB(128, 128, 128));
            SetBkMode(hdc, TRANSPARENT);
            DrawTextW(hdc, L"Wähle ein Bild aus der Liste", -1, &rect, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
        }

        EndPaint(hwnd, &ps);
        return 0;
    }
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

// Extrahiere Dateinamen aus Display-String (entferne Größe)
std::string FileBrowser::GetImageUrl(const std::string& displayName) {
    // displayName Format: "filename.jpg (0.16 MB)"
    // Wir müssen den reinen Dateinamen extrahieren
    size_t pos = displayName.find(" (");
    std::string fileName = (pos != std::string::npos) ? displayName.substr(0, pos) : displayName;

    // TODO: Hier müssen wir die storage_path aus der Datenbank laden
    // Für jetzt: Konstruiere URL basierend auf bekanntem Muster
    // Format: https://HOST/storage/v1/object/authenticated/chat-attachments/USER_ID/ATTACHMENT_ID/FILENAME

    // Diese Info müssen wir aus der message_attachments Tabelle laden!
    // Siehe storagedata.cpp - wir brauchen storage_path oder user_id + attachment_id

    return ""; // Placeholder - wird in nächstem Schritt implementiert
}

// Lade Bild von Supabase mit Authentication
void FileBrowser::LoadImagePreview(const std::string& fileName) {
    // Altes Bild löschen
    if (currentImage_) {
        delete currentImage_;
        currentImage_ = nullptr;
    }

    // TODO: Implementiere Bild-Download
    // 1. GetImageUrl() - hole storage_path aus DB
    // 2. WinHTTP Download mit JWT Token
    // 3. Lade in Memory Stream
    // 4. Erstelle GDI+ Image

    // Placeholder: Zeige "Loading..." Text
    InvalidateRect(hPreview_, NULL, TRUE);

    // Vorläufig: Zeige MessageBox als Debug
    std::wstring msg = L"Lade Vorschau für: " + Utf8ToUtf16(fileName);
    // MessageBoxW(hPreview_, msg.c_str(), L"Debug", MB_OK);
}
