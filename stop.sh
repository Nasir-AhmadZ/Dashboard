#!/bin/bash

echo "Stopping dashboard services..."

pkill -f camera_server_verified.py
pkill -f "node server.js"
pkill -f "node sync_score.js"
pkill -f "next dev"

echo "Done."
