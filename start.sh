#!/bin/bash

cd "$(dirname "$0")"

source ../env/bin/activate
python camera_server_verified.py &
node server.js &
node sync_score.js &
npm run dev &

wait
