@echo off
setlocal
if "%GRADLE_USER_HOME%"=="" set GRADLE_USER_HOME=D:\photo_app\.gradle
set GRADLE_BIN=C:\Users\vishn\.gradle\wrapper\dists\gradle-8.14-all\c2qonpi39x1mddn7hk5gh9iqj\gradle-8.14\bin\gradle.bat

if exist "%GRADLE_BIN%" (
    call "%GRADLE_BIN%" --gradle-user-home D:\photo_app\.gradle %*
) else (
    echo Gradle binary not found at %GRADLE_BIN%
    exit /b 1
)

