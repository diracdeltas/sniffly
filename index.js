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

var visitedElem = document.getElementById('visited')
var notVisitedElem = document.getElementById('not_visited')

/**
 * Gets favicon on port 443 URL from URL.
 * @param {string} url
 */
function getFaviconPort443_ (url) {
  var host = url.split('/')[2]
  return 'http://' + host + ':443/favicon.ico'
}

/**
 * Display the results.
 * @param {string} url The url to display
 * @param {boolean} visited Whether the site was visited
 */
function display (url, visited) {
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
  var img = new window.Image()
  img.onerror = display.bind(this, url, false)
  img.onload = display.bind(this, url, true)
  img.src = url
})
