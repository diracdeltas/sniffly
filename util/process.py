#!/usr/bin/env python
"""Sorts results by max-age, ignoring preloaded entries."""
import sys
import json
import ast
from urlparse import urlparse
import re
import operator


def get_hsts_preloads():
    """Get the latest HSTS preloads in Chromium HEAD."""
    preloads = []
    # This is just the latest from
    # https://code.google.com/p/chromium/codesearch#chromium/src/net/http/transport_security_state_static.json
    # with comments removed. TODO: Script updating this.
    loaded = json.load(open('transport_security_state_static.json'))
    for entry in loaded['entries']:
        if entry.get('mode') == 'force-https':
            preloads.append(entry['name'])
    return preloads


def get_url_and_max_age(line):
    """
    Extracts a mapping from URL to max age of the HSTS entry. If there are
    multiple max ages, go with the lowest one.
    """
    parsed = ast.literal_eval(line)
    if not isinstance(parsed, dict):
        sys.stderr.write('Malformed entry, ignoring: ' + line + '\n')
        return {}
    # This is not very optimal; parsed should always have only one entry.
    return {k: get_max_age_(v) for k, v in parsed.iteritems()}


def get_max_age_(directives):
    """Gets the max age time of the HSTS directive."""
    max_ages = []
    max_age_re = re.compile(r'max-age=(\d+)')
    # TODO: Ignore the directive entirely if it is not valid RFC 6797 syntax.
    if not isinstance(directives, list):
        sys.stderr.write('Malformed directives, ignoring: ' + str(directives))
        return 0
    for directive in directives:
        ages = max_age_re.findall(directive)
        if len(ages) != 1:
            sys.stderr.write('Malformed directive, ignoring: ' + str(directive))
            return 0
        else:
            max_ages.append(int(ages[0]))
    # Per RFC6797, only the first directive is processed. Since we don't know
    # what order the UA will see them, pick the lowest one.
    return min(max_ages)


def main():
    """Process the scraped results, order by max-age."""
    results = sys.argv[1]
    preloads = get_hsts_preloads()
    results_dict = {}
    with open(results) as results_file:
        for line in results_file:
            results_dict.update(get_url_and_max_age(line))
    # Filter out preloaded entries
    filtered = {k: v for (k, v) in results_dict.iteritems()
                if not urlparse(k).hostname in preloads}
    # A list of tuples ordered from highest to lowest max-age
    final = sorted(filtered.items(), key=operator.itemgetter(1), reverse=True)
    for url, time in final:
        # Pick entries with 30 day max age or more; otherwise the pins might
        # expire before ToorCon :)
        if time >= 2592000:
            print '"' + url + '",'


if __name__ == "__main__":
    main()
