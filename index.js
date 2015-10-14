// Timing in milliseconds above which a network request probably occurred.
// TODO: Determine this dynamically from the distribution of response times.
var TIMING_THRESHOLD = 10;

// You should edit this based on scraper results.
var hosts = [
'http://www.npmjs.com/',
'http://www.xoom.com/',
'http://atom.io/',
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

var timings = {};  // (URL, load time) key-value pairs
var start = 0;  // Init global timer

var img = document.getElementById('fingerprint_hosts');
img.onerror = function() {
  var time = new Date().getTime();
  // Note how long it took for the error to fire.
  timings[this.src] = time - start;
  doNext();
};
img.onload = function() {
  // Log that the URL happens to be a valid image; otherwise
  // ignore it for now because I'm not sure how this affects timing.
  console.log('LOADED', this.src);
  doNext();
};

/**
 * The main state machine loop. Records load time for each host.
 */
function doNext() {
  if (hosts.length === 0) {
    done();
    return;
  }
  var host = hosts.pop();
  // Reset the global timer
  start = new Date().getTime();
  // Add nonce to src to force a non-cached response
  img.src = host + '?foobar' + start.toString();
}

/**
 * All hosts have been loaded. Display the results.
 */
function done() {
  console.log(timings);
  var visited = document.getElementById('visited');
  var notVisited = document.getElementById('not_visited');
  var li, url, host;
  for (url in timings) {
    li = document.createElement('li');
    host = url.replace('http://', '').split('/')[0];
    li.appendChild(document.createTextNode(host));
    if (timings[url] < TIMING_THRESHOLD) {
      visited.appendChild(li);
    } else {
      notVisited.appendChild(li);
    }
  }
}

doNext();
