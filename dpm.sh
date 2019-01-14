#!/bin/sh

if [ -z "$NODE_VERSION" ]; then
  export NODE_VERSION=10
fi

if [ -f "docker-compose.yml" ]; then
  if [ "$1" = "start" ]; then
    docker-compose up
  else
    if [ -z "$1" ]; then
      echo "USAGE: dpm [COMMAND]"
      echo "\nExample: npm install --save intl-with-locale"
      echo "\nUse dpm just like you would like you would npm :)"
      exit 0
    fi
    docker-compose run --rm app npm $@
  fi
else
  if [ "$1" = "init" ]; then
    echo "Creating a \033[0m\033[4mdocker-compose.yml\033[m now..."
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
  exit 0
  fi
  echo "\033[31mError: \033[33mNo \033[0m\033[4mdocker-compose.yml\033[0m\033[33m was found.\033[m\nRun \033[32mdpm init\033[m to generate one."
  exit 1
fi

