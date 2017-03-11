# Sniffly2

Sniffly2 is a variant of [Sniffly](http://github.com/diracdeltas/sniffly)
which abuses HTTP Strict Transport Security headers and the Performance Timing
API in order to sniff your browsing history in Chromium-based browsers.

## Demo

Visit http://diracdeltas.github.io/sniffly in Chrome/Chromium/Brave/etc. with HTTPS
Everywhere disabled. If you use an ad blocker, some advertising domains
will probably show up in the "Probably Visited" column (ignore them).

Note that this will not work over HTTPS because of mixed content blocking.

## Acknowledgements

* [crbug436451](https://bugs.chromium.org/p/chromium/issues/detail?id=436451), reported by `imfaster...@gmail.com`, for the idea of probing port 443 over HTTP
* Scott Helme for providing an initial list of HSTS hosts
