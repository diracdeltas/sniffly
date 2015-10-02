from twisted.python.log import err as logerr
from twisted.python import failure
from twisted.web._newclient import ResponseFailed
from twisted.web import error
from twisted.web.client import Agent, RedirectAgent
from twisted.internet import reactor
from twisted.web.http_headers import Headers
import pprint


class CustomRedirectAgent(RedirectAgent):
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
        locationHeaders = response.headers.getRawHeaders('location', [])
        if not locationHeaders:
            err = error.RedirectWithNoLocation(
                response.code, 'No location header field', uri)
            raise ResponseFailed([failure.Failure(err)], response)
        location = self._resolveLocation(uri, locationHeaders[0])
        deferred = self._agent.request(method, location, headers)
        def _chainResponse(newResponse):
            newResponse.setPreviousResponse(response)
            return newResponse
        deferred.addCallback(_chainResponse)
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
    print "RESPONSE " + domain
    print pprint.pformat(list(response.headers.getRawHeaders(
        'Strict-Transport-Security', [])))


def displaySuccess(domain, response):
    print "SUCCESS " + domain


def main():
    max_req = 10

    with open('strict-transport-security.txt') as stsfile:
        domains = stsfile.readlines()

    agent = CustomRedirectAgent(Agent(reactor), 5)
    i = 0

    for domain in domains:
        i = i + 1
        if i > max_req:
            break
        domain = domain.strip()
        req = agent.request('GET', 'http://' + domain + '/',
                            Headers({'User-Agent':
                                     ['Mozilla/5.0 (Macintosh; Intel Mac OS X '+
                                      '10_10_4) AppleWebKit/537.36 '+
                                      '(KHTML, like Gecko) '+
                                      'Chrome/45.0.2454.99 Safari/537.36']}))
        req.addCallbacks(lambda r, d=domain: displaySuccess(d, r), logerr)

    reactor.run()

if __name__ == "__main__":
    main()
