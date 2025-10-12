cmake_minimum_required(VERSION 3.15)
project(DegixDAW-VST VERSION 1.0.0 LANGUAGES CXX)

# C++17 Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Windows specific settings
if(WIN32)
    add_definitions(-DUNICODE -D_UNICODE)
    add_definitions(-D_CRT_SECURE_NO_WARNINGS)
endif()

# Source files
set(SOURCES
    src/main.cpp
    src/storagedata.cpp
    src/debug.cpp
    src/test.cpp
    src/auth/Auth.cpp
    src/gui/FileBrowser.cpp
    src/util/StringUtil.cpp
)

set(HEADERS
    src/storagedata.h
    src/config.h
    src/types.h
    src/auth/Auth.h
    src/gui/FileBrowser.h
    src/util/StringUtil.h
)

# Executable target
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Windows libraries
if(WIN32)
    target_link_libraries(${PROJECT_NAME} PRIVATE
        winhttp
        comctl32
        user32
        gdi32
        kernel32
    )
endif()

# Output directory
set_target_properties(${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# Visual Studio specific
if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W4 /permissive-)
    # GUI subsystem (not console)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()

# Custom target for running
add_custom_target(run
    COMMAND ${CMAKE_BINARY_DIR}/bin/${PROJECT_NAME}.exe
    DEPENDS ${PROJECT_NAME}
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
    COMMENT "Running DegixDAW Desktop App..."
)

# Installation rules
install(TARGETS ${PROJECT_NAME} RUNTIME DESTINATION bin)

# Print configuration
message(STATUS "===========================================")
message(STATUS "DegixDAW Desktop App Configuration")
message(STATUS "===========================================")
message(STATUS "CMake Version: ${CMAKE_VERSION}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Compiler: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "===========================================")
