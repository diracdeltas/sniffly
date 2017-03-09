#!/usr/bin/env bash

# usage: ./run.sh {floor(number_of_requests_to_try/BATCH_SIZE)}
LOOPS=$1

# Assumes the redirect chain terminates in <300ms. Adjust depending on patience.
TIMEOUT="30"
# This is limited by system max open file descriptors. (ulimit -n)
BATCH_SIZE="200"

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
    # TODO: Read the STS file once and cache it.
    $CMD $TIMEOUT ./scrape.py "$(($i * $BATCH_SIZE))" $BATCH_SIZE
    i=$[$i+1]
done
