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
var TIMING_CONFIRM_THRESHOLD = 10;

// Edit this based on scraper results.
var hosts = [
'http://kruug.org/',
'http://eecs388.org/',
'http://chase.com/',
'http://soundcloud.com/',
'http://wellsfargo.com/',
'http://salesforce.com/',
'http://washingtonpost.com/',
'http://www.bankofamerica.com/',
'http://mozilla.org/',
'http://americanexpress.com/',
'http://archive.org/',
'http://hootsuite.com/',
'http://wordpress.com/',
'http://www.usps.com/',
'http://www.capitalone.com/',
'http://rt.com/',
'http://scribd.com/',
'http://vid.me/',
'http://torrentz.eu/',
'http://pinimg.com/',
'http://citi.com/',
'http://fiverr.com/',
'http://disqus.com/',
'http://surveymonkey.com/',
'http://torrentz.in/',
'http://www.neobux.com/',
'http://www.exoclick.com/',
];

var visitedElem = document.getElementById('visited');
var notVisitedElem = document.getElementById('not_visited');

/**
 * Check whether a host has been visited, synchronously
 * @param {function(string, number)} callback Gets called when img error fires.
 * @param {function()} finished Called when all loads are done.
 * @private
 */
function confirmVisited_(callback, finished) {
  var initial; // initial time
  var img = new Image();
  var dummySrc = 'https://example.com/'; // URL for timer initialization
  function doNext_() {
    if (hosts.length === 0) {
      finished();
      return;
    }
    // Shift instead of pop since we are pushing hosts into the array while
    // this is running
    var host = hosts.shift();
    initial = new Date().getTime();
    img.src = host;
  }
  img.onerror = function() {
    if (this.src !== dummySrc) {
      callback(this.src, new Date().getTime() - initial);
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
  img.src = dummySrc;
}

confirmVisited_(function(host, t) {
  var li = document.createElement('li');
  li.appendChild(document.createTextNode(host));
  if (t < TIMING_CONFIRM_THRESHOLD) {
    console.log('visited', host, t);
    visitedElem.appendChild(li);
  } else {
    console.log('unvisited', host, t);
    notVisitedElem.appendChild(li);
  }
}, function() {
  console.log('done!');
});
