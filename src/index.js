/**
 * @fileoverview This file loads a bunch of domains and times how long it
 * takes for them to be redirected from HTTP to HTTPS. Based on that, it
 * decides whether the domain is a previously-noted HSTS domain or not.
 * @author yan <yan@mit.edu>
 * @license MIT
 * @version 0.1.0
 */

// Timing allowance for a synchronous image load, which we use to confirm
// positive results in Chrome.
var TIMING_CONFIRM_THRESHOLD = 100;

// Edit this based on scraper results.
var hosts = [
  'kruug.org',
  'www.google.com',
  'eecs388.org'
]

/**
 * Gets hostname from URL.
 */
function getHost_(url) {
  return url.replace('http://', '').split(/\/|\?/)[0];
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
function confirmVisited_(callback, finished) {
  var initial; // initial time
  var img = new Image();
  var timeouts = []; // array of timeout IDs
  var dummySrc = 'http://example.com/'; // URL for timer initialization
  function doNext_() {
    if (visited.length === 0) {
      finished();
      return;
    }
    // Shift instead of pop since we are pushing hosts into the array while
    // this is running
    var host = visited.shift();
    initial = new Date().getTime();
    var src = 'http://' + host + '/';
    img.src = src;
  }
  img.onerror = function() {
    if (this.src !== dummySrc) {
      var host = getHost_(this.src);
      callback(host, new Date().getTime() - initial);
    } else {
      console.log('initialized timer using', this.src);
    }
    doNext_();
  };
  img.onload = function() {
    // Should never happen but add a callback in case so it doesn't block the
    // rest of the image requests from being sent.
    console.log('UNEXPECTEDLY LOADED', this.src);
    doNext_();
  };
  // Set the image source initially to a dummy URL b/c the first load seems to
  // always take a long time no matter what.
  img.src = 'http://example.com/';
}

confirmVisited_(function(host, t) {
  if (t < TIMING_CONFIRM_THRESHOLD) {
    console.log('visited', host, t);
  } else {
    console.log('unvisited', host, t);
  }
}, function() {
  console.log('done!');
});
