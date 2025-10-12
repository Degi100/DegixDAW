#include "Auth.h"
#include <windows.h>
#include <winhttp.h>
#include <string>
#include <sstream>

// Supabase-Parameter
static const wchar_t* SUPABASE_HOST = L"xcdzugnjzrkngzmtzeip.supabase.co";
static const wchar_t* SUPABASE_PATH = L"/auth/v1/token?grant_type=password";
static const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzY4NjAsImV4cCI6MjA3NDMxMjg2MH0.5W99cq4lNO_5XqVWkGJ8_q4C6PzD0gSKnJjj37NU-rU";

// Static member für JWT Token
std::string Auth::s_accessToken;

bool Auth::Login(const std::string& email, const std::string& password, std::string& userName, std::string* lastError) {
    // JSON-Body vorbereiten
    std::ostringstream oss;
    oss << "{\"email\":\"" << email << "\",\"password\":\"" << password << "\"}";
    std::string body = oss.str();

    // WinHTTP Session
    HINTERNET hSession = WinHttpOpen(L"DegixDAW-VST/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, NULL, NULL, 0);
        if (!hSession) { if (lastError) *lastError = "WinHttpOpen fehlgeschlagen"; return false; }
    HINTERNET hConnect = WinHttpConnect(hSession, SUPABASE_HOST, INTERNET_DEFAULT_HTTPS_PORT, 0);
        if (!hConnect) { if (lastError) *lastError = "WinHttpConnect fehlgeschlagen"; WinHttpCloseHandle(hSession); return false; }
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", SUPABASE_PATH, NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
        if (!hRequest) { if (lastError) *lastError = "WinHttpOpenRequest fehlgeschlagen"; WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false; }

    // Header setzen
    std::wstring headers = L"Content-Type: application/json\r\napikey: ";
    headers += std::wstring(SUPABASE_ANON_KEY, SUPABASE_ANON_KEY + strlen(SUPABASE_ANON_KEY));

    BOOL bResults = WinHttpSendRequest(
        hRequest,
        headers.c_str(), (DWORD)headers.length(),
        (LPVOID)body.c_str(), (DWORD)body.size(), (DWORD)body.size(), 0);
        if (!bResults) {
            if (lastError) *lastError = "WinHttpSendRequest fehlgeschlagen";
            WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false;
        }
    bResults = WinHttpReceiveResponse(hRequest, NULL);
        if (!bResults) {
            if (lastError) *lastError = "WinHttpReceiveResponse fehlgeschlagen";
            WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false;
        }

    // Antwort lesen
    DWORD dwSize = 0;
    std::string response;
    do {
        DWORD dwDownloaded = 0;
        if (!WinHttpQueryDataAvailable(hRequest, &dwSize)) break;
        if (dwSize == 0) break;
        std::string buf(dwSize, 0);
        if (!WinHttpReadData(hRequest, &buf[0], dwSize, &dwDownloaded)) break;
        response.append(buf, 0, dwDownloaded);
    } while (dwSize > 0);

    WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);

    // Erfolg prüfen und access_token extrahieren
    size_t tokenPos = response.find("\"access_token\":\"");
    if (tokenPos != std::string::npos) {
        tokenPos += 16; // Nach "access_token":" springen
        size_t tokenEnd = response.find("\"", tokenPos);
        if (tokenEnd != std::string::npos) {
            s_accessToken = response.substr(tokenPos, tokenEnd - tokenPos);
        }
        userName = email; // Optional: Usernamen extrahieren
        return true;
    }
        if (lastError) *lastError = response;
    return false;
}

void Auth::SetAccessToken(const std::string& token) {
    s_accessToken = token;
}

std::string Auth::GetAccessToken() {
    return s_accessToken;
}
