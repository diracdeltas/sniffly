/**
 * @fileoverview This file uses HSTS window.performance reporting to tell
* whether a domain has been visited.
 * @author yan <yan@mit.edu>
 * @license MIT
 * @version 0.4.0
 */

// redirect to HTTP to avoid mixed content blocking :(
if (window.location.protocol === 'https:') {
  window.alert('This site does not work over HTTPS due to mixed content blocking. Please disable HTTPS Everywhere.')
  setTimeout(() => {
    window.location.assign(window.location.href.replace('https:', 'http:'))
  }, 5000)
}

const visited = {}

/**
 * Display the results.
 * @param {string} url The url to display
 * @param {Element} elem
 */
function display (url, elem) {
  const li = document.createElement('li')
  const host = url.replace('http://', '').replace(':443', '').split('/')[0]
  li.appendChild(document.createTextNode(host))
  elem.appendChild(li)
}

function test () {
  const button = document.querySelector('button')
  const visitedElem = document.getElementById('visited')
  const notVisitedElem = document.getElementById('not_visited')
  button.onclick = () => {
    window.location.hash = '#start'
    window.location.reload(true)
  }
  if (!window.fetch || !window.performance) {
    window.alert('please try a newer browser.')
  }
  document.querySelectorAll('h3').forEach((node) => {
    node.style.display = 'block'
  })
  document.getElementById('disclaimer').style.display = 'block'
  window.performance.setResourceTimingBufferSize(1000)
  window.HOSTS.forEach(function (url, i) {
    if (window.BLACKLIST_HOSTS.includes(url) || url.length > 33) {
      // These hosts are too flakey or obscure
      return
    }
    window.fetch(url, {mode: 'no-cors'}).then(() => {
      display(url, notVisitedElem)
    }).catch(() => {
      display(url, notVisitedElem)
    })
  })
  const intervalId = setInterval(() => {
    const timings = window.performance.getEntriesByType('resource')
    timings.forEach((timing) => {
      let url = timing.name
      if (url.includes(':443') && !visited[url]) {
        display(url, visitedElem)
        visited[url] = true
      }
    })
  }, 666)
  setTimeout(() => {
    console.log('timing out')
    clearInterval(intervalId)
  }, 300000)
}

window.onload = function () {
  if (window.location.hash === '#start') {
    test()
  } else {
    document.querySelector('button').onclick = test
  }
}
