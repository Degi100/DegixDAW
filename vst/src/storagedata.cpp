#include "storagedata.h"
#include "auth/Auth.h"
#include <windows.h>
#include <winhttp.h>
#include <string>
#include <vector>
#include <sstream>
#include "util/json.hpp" // Lokale Header-only-Variante
#include <fstream>

// Supabase-Parameter (wie in Auth.cpp)
static const wchar_t* SUPABASE_HOST = L"xcdzugnjzrkngzmtzeip.supabase.co";
static const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHp1Z25qenJrbmd6bXR6ZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzY4NjAsImV4cCI6MjA3NDMxMjg2MH0.5W99cq4lNO_5XqVWkGJ8_q4C6PzD0gSKnJjj37NU-rU";
// REST API Base Path
static const wchar_t* ATTACHMENTS_BASE_PATH = L"/rest/v1/message_attachments";
// Storage API als Fallback
static const wchar_t* STORAGE_LIST_PATH = L"/storage/v1/object/list/chat-attachments";

using json = nlohmann::json;

// Helper: Erstellt Query-String basierend auf Filter
static std::wstring BuildQueryPath(storagedata::FileFilter filter) {
    std::wstring path = ATTACHMENTS_BASE_PATH;
    path += L"?select=*,messages!inner(sender_id)&limit=100&order=created_at.desc";
    
    switch (filter) {
        case storagedata::FileFilter::IMAGES:
            path += L"&file_type=like.image*";
            break;
        case storagedata::FileFilter::AUDIO:
            path += L"&file_type=like.audio*";
            break;
        case storagedata::FileFilter::MIDI:
            path += L"&file_type=in.(audio/midi,audio/x-midi)";
            break;
        case storagedata::FileFilter::VIDEO:
            path += L"&file_type=like.video*";
            break;
        case storagedata::FileFilter::RECEIVED:
            // Filter wird später im Code angewendet (braucht current_user_id)
            break;
        case storagedata::FileFilter::ALL:
        default:
            // Keine zusätzlichen Filter
            break;
    }
    
    return path;
}

namespace storagedata {
    bool ListFiles(std::vector<std::string>& outFiles, FileFilter filter, std::string* lastError) {
        std::ofstream log("debug.log", std::ios::app);
        outFiles.clear();
        
        log << "=== ListFiles called with filter: " << static_cast<int>(filter) << " ===\n";
        
        HINTERNET hSession = WinHttpOpen(L"DegixDAW-VST/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, NULL, NULL, 0);
        if (!hSession) { if (lastError) *lastError = "WinHttpOpen fehlgeschlagen"; log << "WinHttpOpen fehlgeschlagen\n"; return false; }
        
        HINTERNET hConnect = WinHttpConnect(hSession, SUPABASE_HOST, INTERNET_DEFAULT_HTTPS_PORT, 0);
        if (!hConnect) { if (lastError) *lastError = "WinHttpConnect fehlgeschlagen"; log << "WinHttpConnect fehlgeschlagen\n"; WinHttpCloseHandle(hSession); return false; }
        
        // Query-Path basierend auf Filter erstellen
        std::wstring queryPath = BuildQueryPath(filter);
        log << "Query Path: " << std::string(queryPath.begin(), queryPath.end()) << "\n";
        
        // GET Request für REST API (Tabelle message_attachments)
        HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", queryPath.c_str(), NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
        if (!hRequest) { if (lastError) *lastError = "WinHttpOpenRequest fehlgeschlagen"; log << "WinHttpOpenRequest fehlgeschlagen\n"; WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false; }

        // Headers für Supabase REST API (braucht apikey + JWT Token für RLS)
        std::string accessToken = Auth::GetAccessToken();
        if (accessToken.empty()) {
            log << "WARNUNG: Kein JWT-Token verfügbar, verwende ANON_KEY (RLS könnte blockieren)\n";
            accessToken = SUPABASE_ANON_KEY;
        } else {
            log << "JWT-Token gefunden, verwende authentifizierten Zugriff\n";
        }
        
        std::wstring headers = L"apikey: ";
        headers += std::wstring(SUPABASE_ANON_KEY, SUPABASE_ANON_KEY + strlen(SUPABASE_ANON_KEY));
        headers += L"\r\nAuthorization: Bearer ";
        headers += std::wstring(accessToken.begin(), accessToken.end());
        headers += L"\r\nPrefer: return=representation";

        // GET-Request (kein Body)
        BOOL bResults = WinHttpSendRequest(hRequest, headers.c_str(), (DWORD)headers.length(), WINHTTP_NO_REQUEST_DATA, 0, 0, 0);
        if (!bResults) {
            if (lastError) *lastError = "WinHttpSendRequest fehlgeschlagen";
            log << "WinHttpSendRequest fehlgeschlagen\n";
            WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false;
        }
        
        bResults = WinHttpReceiveResponse(hRequest, NULL);
        if (!bResults) {
            if (lastError) *lastError = "WinHttpReceiveResponse fehlgeschlagen";
            log << "WinHttpReceiveResponse fehlgeschlagen\n";
            WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false;
        }
        
        DWORD dwStatusCode = 0; DWORD dwSize = sizeof(dwStatusCode);
        WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, NULL, &dwStatusCode, &dwSize, NULL);
        log << "HTTP-Status: " << dwStatusCode << "\n";
        
        WinHttpQueryDataAvailable(hRequest, &dwSize);
        std::string response;
        while (dwSize > 0) {
            std::vector<char> buffer(dwSize);
            DWORD dwDownloaded = 0;
            WinHttpReadData(hRequest, buffer.data(), dwSize, &dwDownloaded);
            response.append(buffer.data(), dwDownloaded);
            WinHttpQueryDataAvailable(hRequest, &dwSize);
        }
        log << "Response: " << response << "\n";
        WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
        
        // JSON parsen und file_name extrahieren
        try {
            auto j = json::parse(response);
            if (j.is_array()) {
                if (j.empty()) {
                    log << "Tabelle message_attachments ist leer. Versuche Storage API als Fallback...\n";
                    
                    // FALLBACK: Storage API direkt abfragen
                    HINTERNET hSession2 = WinHttpOpen(L"DegixDAW-VST/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, NULL, NULL, 0);
                    if (hSession2) {
                        HINTERNET hConnect2 = WinHttpConnect(hSession2, SUPABASE_HOST, INTERNET_DEFAULT_HTTPS_PORT, 0);
                        if (hConnect2) {
                            HINTERNET hRequest2 = WinHttpOpenRequest(hConnect2, L"POST", STORAGE_LIST_PATH, NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
                            if (hRequest2) {
                                std::wstring headers2 = L"Content-Type: application/json\r\napikey: ";
                                headers2 += std::wstring(SUPABASE_ANON_KEY, SUPABASE_ANON_KEY + strlen(SUPABASE_ANON_KEY));
                                headers2 += L"\r\nAuthorization: Bearer ";
                                headers2 += std::wstring(SUPABASE_ANON_KEY, SUPABASE_ANON_KEY + strlen(SUPABASE_ANON_KEY));
                                
                                std::string body = "{\"prefix\":\"\",\"limit\":100,\"offset\":0,\"sortBy\":{\"column\":\"name\",\"order\":\"asc\"}}";
                                if (WinHttpSendRequest(hRequest2, headers2.c_str(), (DWORD)headers2.length(), (LPVOID)body.c_str(), (DWORD)body.size(), (DWORD)body.size(), 0)) {
                                    if (WinHttpReceiveResponse(hRequest2, NULL)) {
                                        DWORD dwSize2 = 0;
                                        WinHttpQueryDataAvailable(hRequest2, &dwSize2);
                                        std::string response2;
                                        while (dwSize2 > 0) {
                                            std::vector<char> buffer(dwSize2);
                                            DWORD dwDownloaded = 0;
                                            WinHttpReadData(hRequest2, buffer.data(), dwSize2, &dwDownloaded);
                                            response2.append(buffer.data(), dwDownloaded);
                                            WinHttpQueryDataAvailable(hRequest2, &dwSize2);
                                        }
                                        log << "Storage API Response: " << response2 << "\n";
                                        
                                        auto j2 = json::parse(response2);
                                        if (j2.is_array() && !j2.empty()) {
                                            outFiles.push_back("=== Dateien im Storage (UUID-Namen) ===");
                                            for (const auto& entry : j2) {
                                                if (entry.contains("name")) {
                                                    outFiles.push_back(entry["name"].get<std::string>());
                                                }
                                            }
                                        } else {
                                            outFiles.push_back("Keine Dateien im Storage gefunden.");
                                        }
                                    }
                                }
                                WinHttpCloseHandle(hRequest2);
                            }
                            WinHttpCloseHandle(hConnect2);
                        }
                        WinHttpCloseHandle(hSession2);
                    }
                } else {
                    // TODO: Für RECEIVED-Filter brauchen wir die current_user_id
                    // Für jetzt: Zeige alle Dateien an, RECEIVED-Filter später implementieren
                    
                    for (const auto& entry : j) {
                        if (entry.contains("file_name")) {
                            std::string fileName = entry["file_name"].get<std::string>();
                            std::string fileType = entry.value("file_type", "unknown");
                            
                            // Optionale Informationen sammeln
                            std::string displayName = fileName;
                            
                            // Dateigröße hinzufügen
                            if (entry.contains("file_size") && !entry["file_size"].is_null()) {
                                long long fileSize = entry["file_size"].get<long long>();
                                double sizeMB = fileSize / (1024.0 * 1024.0);
                                char buffer[512];
                                snprintf(buffer, sizeof(buffer), "%s (%.2f MB)", fileName.c_str(), sizeMB);
                                displayName = buffer;
                            }
                            
                            // RECEIVED-Filter: Prüfe sender_id (falls vorhanden)
                            if (filter == FileFilter::RECEIVED) {
                                // TODO: Vergleiche mit current_user_id
                                // Für jetzt: Zeige alle an
                                log << "RECEIVED filter aktiv (noch nicht vollständig implementiert)\n";
                            }
                            
                            outFiles.push_back(displayName);
                            log << "Datei gefunden: " << fileName << " (" << fileType << ")\n";
                        }
                    }
                }
            }
        } catch (const std::exception& ex) {
            if (lastError) *lastError = std::string("JSON-Parsing fehlgeschlagen: ") + ex.what();
            log << "JSON-Parsing fehlgeschlagen: " << ex.what() << "\n";
            return false;
        }
        
        log << "Fertig. " << outFiles.size() << " Einträge.\n";
        return true;
    }
}
