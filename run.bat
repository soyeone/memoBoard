@echo off
title 데스크톱 메모보드 실행기
chcp 65001 > nul

if exist "dist\win-unpacked\MemoBoard.exe" (
    start "" "dist\win-unpacked\MemoBoard.exe"
    exit
)

if exist "dist\MemoBoard-Portable.exe" (
    start "" "dist\MemoBoard-Portable.exe"
    exit
)

npm start
if %errorlevel% neq 0 (
    start "" "index.html"
)
