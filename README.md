# Sniffly

Sniffly is an attack that abuses HTTP Strict Transport Security and Content
Security Policy to allow arbitrary websites to sniff a user's browsing history.
It has been tested in Firefox and Chrome.


## How it works

I recommend reading the inline comments in `src/index.js` to understand
how Sniffly achieves a reliable timing attack in both FF and Chrome without
polluting the local HSTS store (turns out this is non-trivial). tl;dr version:

1. User visits Sniffly page
2. Browser attempts to load images from various HSTS domains over HTTP
3. Sniffly sets a CSP policy that restricts images to HTTP, so image sources
   are blocked before they are redirected to HTTPS. This is crucial! If the
   browser completes a request to the HTTPS site, then it will receive the HSTS
   pin, and the attack will no longer work when the user visits Sniffly.
4. When an image gets blocked by CSP, its `onerror` handler is called. In
   this case, the `onerror` handler does some fancy tricks to time how long it
   took for the image to be redirected from HTTP to HTTPS. If this time is on
   the order of a millisecond, it was an HSTS redirect (no network request was
   made), which means the user
   has visited the image's domain before. If it's on the order of 100
   milliseconds, then a network request probably occurred, meaning that the
   user hasn't visited the image's domain.


### Finding HSTS hosts

To scrape an included list of sites (`util/strict-transport-security.txt`, courtesy Scott Helme) to determine which hosts send HSTS headers, do:

```
$ cd util
$ ./run.sh <number_of_batches> > results.log
```

where 1 batch is 100 sites. You can override
`util/strict-transport-security.txt` with a different list, such as the full
Alexa Top 1M, if you want.

To process and sort the results by max-age, excluding ones with max-age less
than 1 day and ones that are preloaded:

```
$ cd util
$ ./process.py <results_file> > processed.log
```

Once that's done, you can copy the hosts from `processed.log` into
`src/index.js`.


### Running sploitz

Visiting `file:///path/to/sniffly/src/index.html` in Chrome should just work.
In Firefox, CSP headers using the <meta> tag are apparently not supported yet,
so you need to set up a local webserver to serve the CSP HTTP response
header. My Nginx server block looks something like this:

```
server {
    listen 8081;
    server_name localhost;
    location / {
        root /path/to/sniffly/src;
        add_header Content-Security-Policy "img-src http://*";
        index index.html;
    }
}
```


# Caveats

* Not supported yet in Safari or Chrome on iOS.
* Extensions such as HTTPS Everywhere will mess up results.
* Doesn't work reliably in Tor Browser since timings are rounded to the nearest
  100-millisecond.
* Users with a different HSTS preload list (ex: due to having an older browser)
  may not see accurate results.


# Acknowledgements

* Scott Helme for an initial list of HSTS hosts that he had found so I didn't
  have to scan the entire Alexa 1M.
* Chris Palmer for advising on how to file a privacy bug in Chrome.
* Dan Kaminsky and WhiteOps for sponsoring the ToorCon trip where this was
  presented.
* Jan Schaumann and Chris Palmer for being early testers.
* Everyone who let me sleep on their couch while I did this over my "vacation break". You know who you are!
