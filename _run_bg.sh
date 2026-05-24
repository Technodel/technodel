#!/bin/bash
pkill -f fast.py 2>/dev/null
sleep 1
nohup python3 /tmp/fast.py > /tmp/fast.log 2>&1 &
echo "Started PID $!"
