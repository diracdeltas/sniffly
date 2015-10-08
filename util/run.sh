#!/usr/bin/env bash

i="0"

while [ $i -lt 2 ]
do
    # I am an osx user so this uses fake coreutils
    gtimeout 3 ./scrape.py "$(($i * 5))" 5
    i=$[$i+1]
done
