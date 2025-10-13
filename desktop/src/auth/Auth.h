#pragma once
#include <string>

class Auth {
public:
    // lastError ist optional (nullptr erlaubt)
    static bool Login(const std::string& email, const std::string& password, std::string& userName, std::string* lastError = nullptr);
    
    // JWT Token Management
    static void SetAccessToken(const std::string& token);
    static std::string GetAccessToken();
    
private:
    static std::string s_accessToken;
};
