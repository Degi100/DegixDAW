#include "StringUtil.h"

namespace StringUtil {
    std::wstring Utf8ToUtf16(const std::string& utf8) {
        if (utf8.empty()) return std::wstring();

        int wlen = MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, NULL, 0);
        if (wlen <= 0) return std::wstring();

        std::wstring wstr(wlen - 1, L'\0');
        MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, &wstr[0], wlen);

        return wstr;
    }

    std::string Utf16ToUtf8(const std::wstring& utf16) {
        if (utf16.empty()) return std::string();

        int len = WideCharToMultiByte(CP_UTF8, 0, utf16.c_str(), -1, NULL, 0, NULL, NULL);
        if (len <= 0) return std::string();

        std::string str(len - 1, '\0');
        WideCharToMultiByte(CP_UTF8, 0, utf16.c_str(), -1, &str[0], len, NULL, NULL);

        return str;
    }
}
