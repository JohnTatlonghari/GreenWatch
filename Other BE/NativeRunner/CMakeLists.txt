cmake_minimum_required(VERSION 3.20)
project(NativeRunner LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(greenwatch_runner
  src/main.cpp
)

# Make #include "httplib.h" and nlohmann/json.hpp work
target_include_directories(greenwatch_runner PRIVATE
  ${CMAKE_SOURCE_DIR}/thirdParty
)

# (Optional but nice on MSVC)
if (MSVC)
  target_compile_options(greenwatch_runner PRIVATE /W4)
endif()
