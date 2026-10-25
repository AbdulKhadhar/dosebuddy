@echo off
title DoseBuddy
cd /d "%~dp0"
set PYTHONPATH=%~dp0src
set PY=
where py >nul 2>nul && set PY=py -3
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY (
  echo Python is not installed yet.
  echo Opening the download page. Install it, tick "Add python.exe to PATH",
  echo then double-click this file again.
  start https://www.python.org/downloads/
  pause
  exit /b 1
)
%PY% -m dosebuddy
pause
