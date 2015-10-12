#!/usr/bin/env bash

# usage: ./run.sh {floor(number_of_requests_to_try/100)}
LOOPS=$1

# Assumes the redirect chain terminates in <300ms. Adjust depending on patience.
TIMEOUT="30"
# Check ulimit - n
BATCH_SIZE="100"

i="0"
while [ $i -lt $LOOPS ]
do
    # I am an osx user so this uses fake coreutils
    # TODO: Read the STS file once and cache it.
    gtimeout $TIMEOUT ./scrape.py "$(($i * $BATCH_SIZE))" $BATCH_SIZE
    i=$[$i+1]
done
