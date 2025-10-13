#pragma once
#include <string>

class CredentialStorage {
public:
    // Speichert Email (Klartext) + Passwort (verschlüsselt mit DPAPI)
    static bool SaveCredentials(const std::string& email, const std::string& password);

    // Lädt gespeicherte Credentials
    static bool LoadCredentials(std::string& email, std::string& password);

    // Prüft ob Credentials gespeichert sind
    static bool HasSavedCredentials();

    // Löscht gespeicherte Credentials
    static void ClearCredentials();
};
