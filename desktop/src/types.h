#pragma once
#include <string>

class CredentialStorage {
public:
    static bool SaveCredentials(const std::string& email, const std::string& password);
    static bool LoadCredentials(std::string& email, std::string& password);
    static bool HasSavedCredentials();
    static void ClearCredentials();
};
