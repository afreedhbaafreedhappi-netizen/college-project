@echo off
echo Starting MongoDB...
net start MongoDB 2>nul
if errorlevel 1 (
    echo Starting MongoDB manually...
    start mongod
)

echo Waiting for MongoDB...
timeout /t 3

echo Starting Node.js server...
node backend/server.js

pause