#!/bin/bash

node dist/command.js seed-addresses & pm2-runtime dist/main.js
