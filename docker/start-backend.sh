#!/bin/bash

# Start SSH daemon
service ssh start

# Start the Node.js backend
exec node dist/server.js
