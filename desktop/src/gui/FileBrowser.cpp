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
#include <objbase.h>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "winhttp.lib")

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
            if (selIndex != LB_ERR && selIndex < (int)pThis->currentFiles_.size()) {
                // Lade Bildvorschau direkt mit Index
                pThis->LoadImagePreview(selIndex);
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
    std::ofstream log("debug.log", std::ios::app);
    log << "\n=== COMPILED ! PopulateList called, tabIndex=" << tabIndex << " ===\n";

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

    // Dateien mit detaillierten Infos laden
    currentFiles_.clear();
    std::string err;
    if (storagedata::ListFilesDetailed(currentFiles_, filter, &err)) {
        log << "ListFilesDetailed SUCCESS: Found " << currentFiles_.size() << " files\n";
        if (currentFiles_.empty()) {
            SendMessage(hList_, LB_ADDSTRING, 0, (LPARAM)L"Keine Dateien gefunden.");
        } else {
            // Alle Dateien mit DisplayName (inkl. Größe) anzeigen
            for (const auto& fileInfo : currentFiles_) {
                log << "  File: " << fileInfo.fileName << " (" << fileInfo.fileType << ")\n";
                log << "    StoragePath: " << fileInfo.storagePath << "\n";
                std::wstring displayName = Utf8ToUtf16(fileInfo.GetDisplayName());
                SendMessage(hList_, LB_ADDSTRING, 0, (LPARAM)displayName.c_str());
            }
        }
    } else {
        log << "ListFilesDetailed FAILED: " << err << "\n";
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

// Generiere Signed URL für Storage-Pfad via Supabase Storage API
std::string FileBrowser::GenerateSignedUrl(const std::string& storagePath) {
    std::ofstream log("debug.log", std::ios::app);
    log << "\n=== GenerateSignedUrl called ===\n";
    log << "StoragePath: " << storagePath << "\n";

    // Hole JWT Token aus Auth
    std::string jwt = Auth::GetAccessToken();
    if (jwt.empty()) {
        log << "ERROR: No JWT token!\n";
        return "";
    }
    log << "JWT Token found (length=" << jwt.length() << ")\n";

    // Supabase Storage API Endpoint - POST mit JSON Body
    std::string apiPath = "/storage/v1/object/sign/chat-attachments/" + storagePath;
    log << "API Path: " << apiPath << "\n";

    HINTERNET hSession = WinHttpOpen(L"DegixDAW/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!hSession) return "";

    HINTERNET hConnect = WinHttpConnect(hSession, L"xcdzugnjzrkngzmtzeip.supabase.co", INTERNET_DEFAULT_HTTPS_PORT, 0);
    if (!hConnect) {
        WinHttpCloseHandle(hSession);
        return "";
    }

    std::wstring wApiPath = Utf8ToUtf16(apiPath);
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", wApiPath.c_str(), NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
    if (!hRequest) {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return "";
    }

    // JSON Body mit expiresIn
    std::string jsonBody = "{\"expiresIn\":3600}";
    DWORD jsonBodyLen = (DWORD)jsonBody.length();

    // Headers setzen
    std::string authHeader = "Authorization: Bearer " + jwt;
    std::wstring wAuthHeader = Utf8ToUtf16(authHeader);
    WinHttpAddRequestHeaders(hRequest, wAuthHeader.c_str(), -1, WINHTTP_ADDREQ_FLAG_ADD);
    WinHttpAddRequestHeaders(hRequest, L"Content-Type: application/json", -1, WINHTTP_ADDREQ_FLAG_ADD);

    log << "Sending POST request with body: " << jsonBody << "\n";

    // Request senden mit JSON Body
    if (!WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0, (LPVOID)jsonBody.c_str(), jsonBodyLen, jsonBodyLen, 0)) {
        log << "ERROR: WinHttpSendRequest failed\n";
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return "";
    }

    if (!WinHttpReceiveResponse(hRequest, NULL)) {
        log << "ERROR: WinHttpReceiveResponse failed\n";
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return "";
    }

    // HTTP Status prüfen
    DWORD statusCode = 0;
    DWORD statusSize = sizeof(statusCode);
    WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, NULL, &statusCode, &statusSize, NULL);
    log << "HTTP Status: " << statusCode << "\n";

    // Response lesen
    std::string response;
    DWORD bytesAvailable = 0;
    while (WinHttpQueryDataAvailable(hRequest, &bytesAvailable) && bytesAvailable > 0) {
        std::vector<char> buffer(bytesAvailable + 1, 0);
        DWORD bytesRead = 0;
        if (WinHttpReadData(hRequest, buffer.data(), bytesAvailable, &bytesRead)) {
            response.append(buffer.data(), bytesRead);
        }
    }

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);

    log << "Response: " << response << "\n";

    // Parse JSON Response (Simple string search for "signedURL")
    size_t pos = response.find("\"signedURL\":\"");
    if (pos != std::string::npos) {
        size_t start = pos + 13; // Length of "signedURL":""
        size_t end = response.find("\"", start);
        if (end != std::string::npos) {
            std::string signedUrl = response.substr(start, end - start);

            // Supabase gibt relativen Pfad zurück - mache es zu voller URL
            if (signedUrl[0] == '/') {
                signedUrl = "https://xcdzugnjzrkngzmtzeip.supabase.co/storage/v1" + signedUrl;
                log << "Converted relative path to full URL\n";
            }

            log << "SUCCESS: Got signed URL (length=" << signedUrl.length() << ")\n";
            return signedUrl;
        }
    }

    log << "ERROR: Could not parse signedURL from response\n";
    return "";
}

// Lade Bild von URL mit WinHTTP
Gdiplus::Image* FileBrowser::DownloadImage(const std::string& url) {
    std::ofstream log("debug.log", std::ios::app);
    log << "\n=== DownloadImage called ===\n";
    log << "URL: " << url << "\n";

    // Parse URL (Format: https://host/path)
    size_t hostStart = url.find("://");
    if (hostStart == std::string::npos) {
        log << "ERROR: No '://' found in URL\n";
        return nullptr;
    }
    hostStart += 3;

    size_t pathStart = url.find("/", hostStart);
    if (pathStart == std::string::npos) {
        log << "ERROR: No path separator found\n";
        return nullptr;
    }

    std::string host = url.substr(hostStart, pathStart - hostStart);
    std::string path = url.substr(pathStart);

    log << "Host: " << host << "\n";
    log << "Path: " << path.substr(0, 80) << "...\n";

    std::wstring wHost = Utf8ToUtf16(host);
    std::wstring wPath = Utf8ToUtf16(path);

    HINTERNET hSession = WinHttpOpen(L"DegixDAW/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!hSession) {
        log << "ERROR: WinHttpOpen failed\n";
        return nullptr;
    }

    HINTERNET hConnect = WinHttpConnect(hSession, wHost.c_str(), INTERNET_DEFAULT_HTTPS_PORT, 0);
    if (!hConnect) {
        log << "ERROR: WinHttpConnect failed\n";
        WinHttpCloseHandle(hSession);
        return nullptr;
    }

    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", wPath.c_str(), NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
    if (!hRequest) {
        log << "ERROR: WinHttpOpenRequest failed\n";
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return nullptr;
    }

    if (!WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0)) {
        log << "ERROR: WinHttpSendRequest failed\n";
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return nullptr;
    }

    if (!WinHttpReceiveResponse(hRequest, NULL)) {
        log << "ERROR: WinHttpReceiveResponse failed\n";
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return nullptr;
    }

    // HTTP Status prüfen
    DWORD statusCode = 0;
    DWORD statusSize = sizeof(statusCode);
    WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, NULL, &statusCode, &statusSize, NULL);
    log << "HTTP Status: " << statusCode << "\n";

    // Lade Bild-Daten in Memory
    std::vector<BYTE> imageData;
    DWORD bytesAvailable = 0;
    while (WinHttpQueryDataAvailable(hRequest, &bytesAvailable) && bytesAvailable > 0) {
        size_t currentSize = imageData.size();
        imageData.resize(currentSize + bytesAvailable);
        DWORD bytesRead = 0;
        if (!WinHttpReadData(hRequest, &imageData[currentSize], bytesAvailable, &bytesRead)) {
            log << "ERROR: WinHttpReadData failed\n";
            break;
        }
    }

    log << "Downloaded " << imageData.size() << " bytes\n";

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);

    if (imageData.empty()) {
        log << "ERROR: No image data received\n";
        return nullptr;
    }

    // Erstelle GDI+ Image aus Memory Buffer
    log << "Creating GDI+ Image from buffer...\n";
    HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, imageData.size());
    if (!hMem) {
        log << "ERROR: GlobalAlloc failed\n";
        return nullptr;
    }

    void* pMem = GlobalLock(hMem);
    if (!pMem) {
        log << "ERROR: GlobalLock failed\n";
        GlobalFree(hMem);
        return nullptr;
    }

    memcpy(pMem, imageData.data(), imageData.size());
    GlobalUnlock(hMem);

    IStream* pStream = nullptr;
    HRESULT hr = CreateStreamOnHGlobal(hMem, TRUE, &pStream);
    if (hr != S_OK) {
        log << "ERROR: CreateStreamOnHGlobal failed (HRESULT=" << hr << ")\n";
        GlobalFree(hMem);
        return nullptr;
    }

    log << "Creating Image from stream...\n";
    Gdiplus::Image* image = Gdiplus::Image::FromStream(pStream);
    pStream->Release();

    if (!image) {
        log << "ERROR: Image::FromStream returned nullptr\n";
        return nullptr;
    }

    Gdiplus::Status status = image->GetLastStatus();
    if (status != Gdiplus::Ok) {
        log << "ERROR: GDI+ Status = " << status << " (0=Ok, 1=GenericError, 2=InvalidParameter...)\n";
        delete image;
        return nullptr;
    }

    log << "SUCCESS: GDI+ Image created! Size: " << image->GetWidth() << "x" << image->GetHeight() << "\n";
    return image;
}

// Lade Bildvorschau anhand des FileInfo Index
void FileBrowser::LoadImagePreview(int fileIndex) {
    std::ofstream log("debug.log", std::ios::app);
    log << "\n=== LoadImagePreview called, fileIndex=" << fileIndex << " ===\n";

    // Altes Bild löschen
    if (currentImage_) {
        delete currentImage_;
        currentImage_ = nullptr;
    }

    // Index validieren
    if (fileIndex < 0 || fileIndex >= (int)currentFiles_.size()) {
        log << "ERROR: Invalid index! currentFiles_.size()=" << currentFiles_.size() << "\n";
        InvalidateRect(hPreview_, NULL, TRUE);
        return;
    }

    const storagedata::FileInfo& fileInfo = currentFiles_[fileIndex];
    log << "File: " << fileInfo.fileName << "\n";
    log << "Type: " << fileInfo.fileType << "\n";
    log << "StoragePath: " << fileInfo.storagePath << "\n";

    // Nur Bilder laden
    if (!fileInfo.IsImage()) {
        log << "Not an image, skipping\n";
        InvalidateRect(hPreview_, NULL, TRUE);
        return;
    }

    // Signed URL generieren
    log << "Generating signed URL...\n";
    std::string signedUrl = GenerateSignedUrl(fileInfo.storagePath);
    if (signedUrl.empty()) {
        log << "ERROR: Failed to generate signed URL\n";
        InvalidateRect(hPreview_, NULL, TRUE);
        return;
    }
    log << "Signed URL: " << signedUrl.substr(0, 100) << "...\n";

    // Bild herunterladen
    log << "Downloading image...\n";
    currentImage_ = DownloadImage(signedUrl);
    if (currentImage_) {
        log << "SUCCESS: Image downloaded and loaded!\n";
    } else {
        log << "ERROR: Failed to download/load image\n";
    }

    // Preview neu zeichnen
    InvalidateRect(hPreview_, NULL, TRUE);
}
