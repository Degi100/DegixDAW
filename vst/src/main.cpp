#include "StringUtil.h"

std::wstring StringUtil::Utf8ToUtf16(const std::string& utf8) {
    int wlen = MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, NULL, 0);
    std::wstring wstr;
    if (wlen > 1) {
        wstr.resize(wlen - 1);
        MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), -1, &wstr[0], wlen - 1);
    }
    return wstr;
}
