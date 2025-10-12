#pragma once
#include <string>
#include <windows.h>

namespace StringUtil {
    std::wstring Utf8ToUtf16(const std::string& utf8);
}
