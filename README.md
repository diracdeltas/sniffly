# Sniffly2

Sniffly2 is a variant of [Sniffly](https://github.com/diracdeltas/sniffly)
which abuses HTTP Strict Transport Security headers in order to sniff your
browsing history.

## Demo

Visit https://diracdeltas.github.io/sniffly in Firefox/Chrome/Opera/Brave/etc. with HTTPS
Everywhere disabled. If you use an ad blocker, a bunch of advertising domains
will probably show up in the "Probably Visited" column (ignore them).

## Caveats

* Not supported yet in Safari, IE, or Chrome on iOS.
* Extensions such as HTTPS Everywhere will mess up results.
* Doesn't work reliably in Tor Browser since timings are rounded to the nearest
  100-millisecond.
* Users with a different HSTS preload list (ex: due to having an older browser)
  may not see accurate results.


## Acknowledgements

* [crbug436451](https://bugs.chromium.org/p/chromium/issues/detail?id=436451), reported by `imfaster...@gmail.com`
* Scott Helme for providing an initial list of HSTS hosts
