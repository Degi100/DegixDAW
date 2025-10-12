#include "MainWindow.h"
#include "auth/Auth.h"
#include "util/StringUtil.h"
#include "util/CredentialStorage.h"

MainWindow::MainWindow() {}
MainWindow::~MainWindow() {}

int MainWindow::Show(HINSTANCE hInstance, int nCmdShow) {
	WNDCLASSW wc = {};
	wc.lpfnWndProc = MainWindow::WindowProc;
	wc.hInstance = hInstance;
	wc.lpszClassName = L"MainWindowClass";
	wc.hbrBackground = (HBRUSH)(COLOR_WINDOW+1);
	RegisterClassW(&wc);

	hwnd_ = CreateWindowExW(0, L"MainWindowClass", L"DegixDAW", WS_OVERLAPPEDWINDOW | WS_VISIBLE,
		CW_USEDEFAULT, CW_USEDEFAULT, 800, 600, NULL, NULL, hInstance, this);

	ShowWindow(hwnd_, nCmdShow);
	UpdateWindow(hwnd_);

	MSG msg = {};
	while (GetMessage(&msg, NULL, 0, 0)) {
		if (!IsDialogMessage(hwnd_, &msg)) {
			TranslateMessage(&msg);
			DispatchMessage(&msg);
		}
	}
	return 0;
}

LRESULT CALLBACK MainWindow::WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    static HWND hEmail, hPassword, hLogin, hWelcomeLabel, hPasswordLabel, hStayLoggedIn, hLogout;
    switch (uMsg) {
        case WM_CREATE: {
            CREATESTRUCT* cs = (CREATESTRUCT*)lParam;
            SetWindowLongPtr(hwnd, GWLP_USERDATA, (LONG_PTR)cs->lpCreateParams);
            CreateWindowW(L"STATIC", L"Email:", WS_VISIBLE | WS_CHILD, 10, 10, 50, 20, hwnd, NULL, NULL, NULL);
            hEmail = CreateWindowW(L"EDIT", L"", WS_VISIBLE | WS_CHILD | WS_BORDER | WS_TABSTOP, 70, 10, 200, 20, hwnd, (HMENU)10, NULL, NULL);
            hPasswordLabel = CreateWindowW(L"STATIC", L"Password:", WS_VISIBLE | WS_CHILD, 10, 40, 60, 20, hwnd, NULL, NULL, NULL);
            hPassword = CreateWindowW(L"EDIT", L"", WS_VISIBLE | WS_CHILD | WS_BORDER | ES_PASSWORD | WS_TABSTOP, 70, 40, 200, 20, hwnd, (HMENU)11, NULL, NULL);
            hStayLoggedIn = CreateWindowW(L"BUTTON", L"Immer angemeldet bleiben", WS_VISIBLE | WS_CHILD | BS_AUTOCHECKBOX | WS_TABSTOP, 70, 70, 200, 20, hwnd, (HMENU)12, NULL, NULL);
            hLogin = CreateWindowW(L"BUTTON", L"Login", WS_VISIBLE | WS_CHILD | BS_DEFPUSHBUTTON | WS_TABSTOP, 10, 100, 100, 30, hwnd, (HMENU)1, NULL, NULL);
            // Tab-Reihenfolge explizit setzen (hWndInsertAfter ist das Fenster, NACH dem eingefügt wird)
            SetWindowPos(hPassword, hEmail, 0,0,0,0, SWP_NOMOVE|SWP_NOSIZE);
            SetWindowPos(hStayLoggedIn, hPassword, 0,0,0,0, SWP_NOMOVE|SWP_NOSIZE);
            SetWindowPos(hLogin, hStayLoggedIn, 0,0,0,0, SWP_NOMOVE|SWP_NOSIZE);
            
            // Auto-Login versuchen, wenn Credentials gespeichert sind
            if (CredentialStorage::HasSavedCredentials()) {
                std::string savedEmail, savedPassword;
                if (CredentialStorage::LoadCredentials(savedEmail, savedPassword)) {
                    std::wstring wEmail = StringUtil::Utf8ToUtf16(savedEmail);
                    std::wstring wPassword = StringUtil::Utf8ToUtf16(savedPassword);
                    SetWindowTextW(hEmail, wEmail.c_str());
                    SetWindowTextW(hPassword, wPassword.c_str());
                    SendMessage(hStayLoggedIn, BM_SETCHECK, BST_CHECKED, 0);
                    // Auto-Login ausführen
                    PostMessage(hwnd, WM_COMMAND, MAKEWPARAM(1, BN_CLICKED), (LPARAM)hLogin);
                }
            } else {
                SetFocus(hEmail); // Fokus auf das erste Feld setzen
            }
            return 0;
        }
        case WM_COMMAND: {
            if (LOWORD(wParam) == 2) { // Logout Button
                // Gespeicherte Credentials löschen
                CredentialStorage::ClearCredentials();
                
                // FileBrowser schließen
                MainWindow* pThis = reinterpret_cast<MainWindow*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
                if (pThis) {
                    pThis->fileBrowser_.Hide();
                }
                
                // Welcome-Label und Logout-Button entfernen
                DestroyWindow(hWelcomeLabel);
                DestroyWindow(hLogout);
                hWelcomeLabel = NULL;
                hLogout = NULL;
                
                // Login-Controls wieder erstellen
                SetWindowTextW(hwnd, L"DegixDAW");
                InvalidateRect(hwnd, NULL, TRUE);
                CreateWindowW(L"STATIC", L"Email:", WS_VISIBLE | WS_CHILD, 10, 10, 50, 20, hwnd, NULL, NULL, NULL);
                hEmail = CreateWindowW(L"EDIT", L"", WS_VISIBLE | WS_CHILD | WS_BORDER | WS_TABSTOP, 70, 10, 200, 20, hwnd, (HMENU)10, NULL, NULL);
                hPasswordLabel = CreateWindowW(L"STATIC", L"Password:", WS_VISIBLE | WS_CHILD, 10, 40, 60, 20, hwnd, NULL, NULL, NULL);
                hPassword = CreateWindowW(L"EDIT", L"", WS_VISIBLE | WS_CHILD | WS_BORDER | ES_PASSWORD | WS_TABSTOP, 70, 40, 200, 20, hwnd, (HMENU)11, NULL, NULL);
                hStayLoggedIn = CreateWindowW(L"BUTTON", L"Immer angemeldet bleiben", WS_VISIBLE | WS_CHILD | BS_AUTOCHECKBOX | WS_TABSTOP, 70, 70, 200, 20, hwnd, (HMENU)12, NULL, NULL);
                hLogin = CreateWindowW(L"BUTTON", L"Login", WS_VISIBLE | WS_CHILD | BS_DEFPUSHBUTTON | WS_TABSTOP, 10, 100, 100, 30, hwnd, (HMENU)1, NULL, NULL);
                SetWindowPos(hPassword, hEmail, 0,0,0,0, SWP_NOMOVE|SWP_NOSIZE);
                SetWindowPos(hStayLoggedIn, hPassword, 0,0,0,0, SWP_NOMOVE|SWP_NOSIZE);
                SetWindowPos(hLogin, hStayLoggedIn, 0,0,0,0, SWP_NOMOVE|SWP_NOSIZE);
                SetFocus(hEmail);
                InvalidateRect(hwnd, NULL, TRUE);
                return 0;
            }
            if (LOWORD(wParam) == 1) { // Login Button
                WCHAR email[256], password[256];
                GetWindowTextW(hEmail, email, 256);
                GetWindowTextW(hPassword, password, 256);
                BOOL stayLoggedIn = (SendMessage(hStayLoggedIn, BM_GETCHECK, 0, 0) == BST_CHECKED);
                int lenEmail = WideCharToMultiByte(CP_UTF8, 0, email, -1, NULL, 0, NULL, NULL);
                std::string emailStr(lenEmail, 0);
                WideCharToMultiByte(CP_UTF8, 0, email, -1, &emailStr[0], lenEmail, NULL, NULL);
                emailStr.resize(lenEmail - 1);
                int lenPassword = WideCharToMultiByte(CP_UTF8, 0, password, -1, NULL, 0, NULL, NULL);
                std::string passwordStr(lenPassword, 0);
                WideCharToMultiByte(CP_UTF8, 0, password, -1, &passwordStr[0], lenPassword, NULL, NULL);
                passwordStr.resize(lenPassword - 1);
                std::string userName, lastError;
                if (Auth::Login(emailStr, passwordStr, userName, &lastError)) {
                    // Credentials speichern, wenn Checkbox aktiviert
                    if (stayLoggedIn) {
                        CredentialStorage::SaveCredentials(emailStr, passwordStr);
                    } else {
                        CredentialStorage::ClearCredentials();
                    }
                    
                    DestroyWindow(hEmail);
                    DestroyWindow(hPassword);
                    DestroyWindow(hLogin);
                    DestroyWindow(hPasswordLabel);
                    DestroyWindow(hStayLoggedIn);
                    InvalidateRect(hwnd, NULL, TRUE);
                    std::wstring wUserName = StringUtil::Utf8ToUtf16(userName);
                    std::wstring welcome = L"Hallo " + wUserName + L"! Willkommen zurück in DegixDAW. ÖÄÜöäüß";
                    SetWindowTextW(hwnd, L"DegixDAW - Eingeloggt");
                    hWelcomeLabel = CreateWindowW(L"STATIC", welcome.c_str(), WS_VISIBLE | WS_CHILD, 10, 10, 380, 40, hwnd, NULL, NULL, NULL);
                    HFONT hFont = CreateFontW(20, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_SWISS, L"Arial");
                    SendMessage(hWelcomeLabel, WM_SETFONT, (WPARAM)hFont, TRUE);
                    // Logout-Button hinzufügen
                    hLogout = CreateWindowW(L"BUTTON", L"Abmelden", WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON, 290, 10, 100, 30, hwnd, (HMENU)2, NULL, NULL);
                    InvalidateRect(hwnd, NULL, TRUE);
                    // Datei-Browser als Child anzeigen
                    MainWindow* pThis = reinterpret_cast<MainWindow*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
                    if (pThis) {
                        pThis->fileBrowser_.Show((HINSTANCE)GetWindowLongPtr(hwnd, GWLP_HINSTANCE), hwnd);
                    }
                } else {
                    std::wstring werr = StringUtil::Utf8ToUtf16(lastError.empty() ? "Login fehlgeschlagen!" : lastError);
                    MessageBoxW(hwnd, werr.c_str(), L"Fehler", MB_OK);
                    // Bei fehlgeschlagenem Auto-Login Credentials löschen
                    CredentialStorage::ClearCredentials();
                }
            }
            return 0;
        }
        case WM_CHAR: {
            // Leertaste auf Checkbox: Toggle
            if (wParam == VK_SPACE && GetFocus() == hStayLoggedIn) {
                LRESULT state = SendMessage(hStayLoggedIn, BM_GETCHECK, 0, 0);
                SendMessage(hStayLoggedIn, BM_SETCHECK, state == BST_CHECKED ? BST_UNCHECKED : BST_CHECKED, 0);
                return 0;
            }
            break;
        }
        case WM_CTLCOLOREDIT: {
            return 0;
        }
        case WM_CTLCOLORSTATIC: {
            if ((HWND)lParam == hWelcomeLabel) {
                HDC hdc = (HDC)wParam;
                SetTextColor(hdc, RGB(0, 0, 255));
                SetBkMode(hdc, TRANSPARENT);
                return (LRESULT)GetSysColorBrush(COLOR_WINDOW);
            }
            return 0;
        }
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}
