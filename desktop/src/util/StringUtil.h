#pragma once
#include <string>
#include <windows.h>

namespace StringUtil {
    std::wstring Utf8ToUtf16(const std::string& utf8);
    std::string Utf16ToUtf8(const std::wstring& utf16);
}
