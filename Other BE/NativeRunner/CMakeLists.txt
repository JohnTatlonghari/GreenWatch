cmake_minimum_required(VERSION 3.20)
project(NativeRunner LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(greenwatch_runner
  src/main.cpp
 "src/llm_engine_stub.h")

# Make #include "httplib.h" work
target_include_directories(greenwatch_runner PRIVATE ${CMAKE_SOURCE_DIR}/thirdParty)