@echo off
cd C:\Users\admin\Desktop\math-wizard-unleashed\math-wizard-unleashed

REM Start Redis if not running
docker start math-wizard-redis || docker run --name math-wizard-redis -p 6379:6379 -d redis

REM Start the server in WSL
wsl -d Ubuntu -e bash -ic "cd /mnt/c/Users/admin/Desktop/math-wizard-unleashed/math-wizard-unleashed && ts-node server.ts"

REM Start the frontend
start cmd /k "cd C:\Users\admin\Desktop\math-wizard-unleashed\math-wizard-unleashed && npm start" 