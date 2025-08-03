#!/bin/bash
cd /home/kavia/workspace/code-generation/bright-snakes-and-ladders-137158-137167/snakes_and_ladders_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

