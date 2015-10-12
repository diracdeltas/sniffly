#!/usr/bin/env bash

# usage: ./run.sh {floor(number_of_requests_to_try/100)}
LOOPS=$1

# Assumes the redirect chain terminates in <300ms. Adjust depending on patience.
TIMEOUT="30"
# This is limited by system max open file descriptors. (ulimit -n)
BATCH_SIZE="100"

if hash timeout 2>/dev/null; then
    CMD="timeout"
elif hash gtimeout 2>/dev/null; then
    CMD="gtimeout"
else
     echo >&2 "please install timeout or gtimeout. aborting."
     exit 1
fi

i="0"
while [ $i -lt $LOOPS ]
do
    # I am an osx user so this uses fake coreutils
    # TODO: use timeout instead of gtimeout if it exists
    # TODO: Read the STS file once and cache it.
    $CMD $TIMEOUT ./scrape.py "$(($i * $BATCH_SIZE))" $BATCH_SIZE
    i=$[$i+1]
done
