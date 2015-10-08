#!/usr/bin/env python
"""Scrapes sites for HSTS headers."""
from twisted.python import failure
from twisted.web._newclient import ResponseFailed
from twisted.web import error
from twisted.web.client import Agent, RedirectAgent
from twisted.internet import reactor
from twisted.web.http_headers import Headers
import pprint
from itertools import islice
import sys


class CustomRedirectAgent(RedirectAgent):
    """
    A custom redirect agent that dumps where redirects are occurring.
    """
    def _handleRedirect(self, response, method, uri, headers, redirectCount):
        """
        Handle a redirect response, checking the number of redirects already
        followed, and extracting the location header fields.
        """
        if redirectCount >= self._redirectLimit:
            err = error.InfiniteRedirection(
                response.code,
                'Infinite redirection detected',
                location=uri)
            raise ResponseFailed([failure.Failure(err)], response)
        location_headers = response.headers.getRawHeaders('location', [])
        if not location_headers:
            err = error.RedirectWithNoLocation(
                response.code, 'No location header field', uri)
            raise ResponseFailed([failure.Failure(err)], response)
        location = self._resolveLocation(uri, location_headers[0])
        deferred = self._agent.request(method, location, headers)

        def chain_response_(new_response):
            new_response.setPreviousResponse(response)
            return new_response
        deferred.addCallback(chain_response_)
        return deferred.addCallback(
            self._handleResponse, method, location, headers, redirectCount + 1)

    def _handleResponse(self, response, method, uri, headers, redirectCount):
        """
        Handle the response, making another request if it indicates a redirect.
        If an HSTS header is found, abort early.
        """
        hsts_headers = response.headers.getRawHeaders(
            'Strict-Transport-Security', [])
        if len(hsts_headers) > 0:
            display(uri, response)
            return response
        if response.code in self._redirectResponses:
            if method not in ('GET', 'HEAD'):
                err = error.PageRedirect(response.code, location=uri)
                raise ResponseFailed([failure.Failure(err)], response)
            return self._handleRedirect(response, method, uri, headers,
                                        redirectCount)
        elif response.code in self._seeOtherResponses:
            return self._handleRedirect(response, 'GET', uri, headers,
                                        redirectCount)
        return response


def display(domain, response):
    """Prints the domain and HSTS header."""
    print domain
    print pprint.pformat(list(response.headers.getRawHeaders(
        'Strict-Transport-Security', [])))


def main():
    """Main scrape loop."""
    max_req = int(sys.argv[2]) # limited by system max files open
    max_redirect = 5
    agent = CustomRedirectAgent(Agent(reactor), max_redirect)
    i = 0
    start = int(sys.argv[1])

    with open('strict-transport-security.txt') as stsfile:
        for line in islice(stsfile, start, start + max_req):
            i = i + 1
            if i > max_req:
                break
            domain = line.strip()
            agent.request('GET', 'http://' + domain + '/',
                          Headers({'User-Agent':
                                   ['Mozilla/5.0 (Macintosh; Intel Mac OS X' +
                                    ' 10_10_4) AppleWebKit/537.36 ' +
                                    '(KHTML, like Gecko) ' +
                                    'Chrome/45.0.2454.99 Safari/537.36']}))
        reactor.run()


if __name__ == "__main__":
    main()
