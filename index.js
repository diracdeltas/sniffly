/**
 * @fileoverview This file uses crbug436451 to tell whether the domain is in
 * HSTS by looking at the onload/onerror events.
 * @author yan <yan@mit.edu>
 * @license MIT
 * @version 0.4.0
 */

var visitedElem = document.getElementById('visited')
var notVisitedElem = document.getElementById('not_visited')

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

window.onload = function () {
  const button = document.querySelector('button')
  button.onclick = function () {
    button.style.display = 'none'
    document.querySelectorAll('h3').forEach((node) => {
      node.style.display = 'block'
    })
    window.HOSTS.forEach(function (url) {
      if (window.BLACKLIST_HOSTS.includes(url)) {
        return
      }
      var img = new window.Image()
      img.src = url
      img.onerror = display.bind(this, url, false)
      img.onload = display.bind(this, url, true)
    })
  }
}
