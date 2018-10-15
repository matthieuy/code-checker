#!/bin/bash

DIR=$(echo "$(pwd)/$(dirname $0)")

echo "=> Update composer"
cd $DIR/codechecker/phar
composer install -o -q

echo "=> Create codechecker.phar"
cd $DIR/codechecker
php create-phar.php

echo "=> Update yarn"
cd $DIR/../
yarn install -s

if [ $# -eq 1 ]; then
  case $1 in
    linux)
      yarn build:linux
      ;;

    win)
      yarn build:win
      ;;

    all)
      yarn build
      ;;

    *)
      echo "Parameters : linux, win, all"
      ;;
  esac
else
  echo "== OK =="
fi
