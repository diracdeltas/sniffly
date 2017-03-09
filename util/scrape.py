#!/usr/bin/env python
"""Scrapes sites for HSTS headers, following redirects."""
from twisted.python import failure
from twisted.web._newclient import ResponseFailed
from twisted.web import error
from twisted.python.log import err as logerr
from twisted.web.client import Agent, RedirectAgent
from twisted.internet import reactor
from twisted.web.http_headers import Headers
from itertools import islice
import sys
import re


class CustomRedirectAgent(RedirectAgent):
    """
    A custom redirect agent that dumps where redirects are occurring and stops
    redirecting as soon as an HSTS header is observed.
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
            """Chains responses"""
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
        # TODO: keep redirecting if STS max-age=0?
        if len(hsts_headers) > 0 and uri[:8] == 'https://':
            display(uri, response)
            return response
        elif response.code in self._redirectResponses:
            return self._handleRedirect(response, method, uri, headers,
                                        redirectCount)
        elif response.code in self._seeOtherResponses:
            return self._handleRedirect(response, 'GET', uri, headers,
                                        redirectCount)
        return response


def display(uri, response):
    """Prints the uri and HSTS header."""
    print {uri: list(response.headers.getRawHeaders(
        'Strict-Transport-Security', []))}


def main():
    """Main scrape loop."""
    max_req = int(sys.argv[2])
    max_redirect = 4
    agent = CustomRedirectAgent(Agent(reactor), max_redirect)
    i = 0
    start = int(sys.argv[1])

    # list of https hosts
    with open('strict-transport-security.txt') as stsfile:
        for line in islice(stsfile, start, start + max_req):
            i = i + 1
            if i > max_req:
                break
            domain = re.sub(r'^.+?\s+', '', line.strip())
            d = agent.request('GET', 'http://' + domain + '/',
                              Headers({'User-Agent': ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36']
                                    }))
            d.addErrback(logerr)
        reactor.run()


if __name__ == "__main__":
    main()
