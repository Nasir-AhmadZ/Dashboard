#!/bin/bash

cd "$(dirname "$0")"

source ../env/bin/activate
python camera_server_verified.py &
node server.js &
npm run dev &

wait
