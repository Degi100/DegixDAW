#include "CredentialStorage.h"
#include <windows.h>
#include <wincrypt.h>
#include <fstream>
#include <vector>

#pragma comment(lib, "crypt32.lib")

static const char* CRED_FILE = "degixdaw_creds.dat";

bool CredentialStorage::SaveCredentials(const std::string& email, const std::string& password) {
    // Email als Klartext, Passwort verschlüsselt mit DPAPI
    DATA_BLOB dataIn;
    DATA_BLOB dataOut;
    
    dataIn.pbData = (BYTE*)password.c_str();
    dataIn.cbData = (DWORD)(password.size() + 1);
    
    if (!CryptProtectData(&dataIn, L"DegixDAW Password", NULL, NULL, NULL, 0, &dataOut)) {
        return false;
    }
    
    std::ofstream file(CRED_FILE, std::ios::binary);
    if (!file.is_open()) {
        LocalFree(dataOut.pbData);
        return false;
    }
    
    // Email-Länge + Email + verschlüsseltes Passwort-Länge + verschlüsseltes Passwort
    size_t emailLen = email.size();
    file.write((char*)&emailLen, sizeof(emailLen));
    file.write(email.c_str(), emailLen);
    file.write((char*)&dataOut.cbData, sizeof(dataOut.cbData));
    file.write((char*)dataOut.pbData, dataOut.cbData);
    
    file.close();
    LocalFree(dataOut.pbData);
    return true;
}

bool CredentialStorage::LoadCredentials(std::string& email, std::string& password) {
    std::ifstream file(CRED_FILE, std::ios::binary);
    if (!file.is_open()) {
        return false;
    }
    
    // Email lesen
    size_t emailLen;
    file.read((char*)&emailLen, sizeof(emailLen));
    if (emailLen > 1024) { // Sicherheitscheck
        file.close();
        return false;
    }
    
    std::vector<char> emailBuf(emailLen);
    file.read(emailBuf.data(), emailLen);
    email.assign(emailBuf.begin(), emailBuf.end());
    
    // Verschlüsseltes Passwort lesen
    DWORD encryptedLen;
    file.read((char*)&encryptedLen, sizeof(encryptedLen));
    if (encryptedLen > 4096) { // Sicherheitscheck
        file.close();
        return false;
    }
    
    std::vector<BYTE> encryptedData(encryptedLen);
    file.read((char*)encryptedData.data(), encryptedLen);
    file.close();
    
    // Mit DPAPI entschlüsseln
    DATA_BLOB dataIn;
    DATA_BLOB dataOut;
    
    dataIn.pbData = encryptedData.data();
    dataIn.cbData = encryptedLen;
    
    if (!CryptUnprotectData(&dataIn, NULL, NULL, NULL, NULL, 0, &dataOut)) {
        return false;
    }
    
    password.assign((char*)dataOut.pbData);
    LocalFree(dataOut.pbData);
    return true;
}

bool CredentialStorage::HasSavedCredentials() {
    std::ifstream file(CRED_FILE);
    return file.good();
}

void CredentialStorage::ClearCredentials() {
    DeleteFileA(CRED_FILE);
}
