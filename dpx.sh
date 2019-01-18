#!/bin/sh

if [ -z "$NODE_VERSION" ]; then
  export NODE_VERSION=10
fi

if [ -f "docker-compose.yml" ]; then
  docker-compose run --rm -it app npx $@
else
  echo "No docker-compose.yml was found."
  if [ "$1" = "init" ]; then
    echo "Creating one now..."
    cat << EOF > docker-compose.yml
version: '3'
services:
  app:
    image: mhart/alpine-node:\${NODE_VERSION}
    working_dir: /app
    volumes:
      - .:/app:cached
      - node_modules-vol:/app/node_modules
    command: npm start
    ports:
      # It's a good idea to only forward the ports you need. Add your own if required
      - "3000:3000"
      - "4000:4000"
      - "8000:8000"
      - "8080:8080"
volumes:
  node_modules-vol:
EOF
  fi
fi

