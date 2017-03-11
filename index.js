/**
 * @fileoverview This file uses crbug436451 to tell whether the domain is in
 * HSTS by looking at the onload/onerror events.
 * @author yan <yan@mit.edu>
 * @license MIT
 * @version 0.4.0
 */

// redirect to HTTP to avoid mixed content blocking :(
if (window.location.protocol === 'https:') {
  window.location.protocol === 'http:'
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
    window.location.reload()
  }
  if (!window.fetch || !window.performance) {
    window.alert('please try a newer browser.')
  }
  document.querySelectorAll('h3').forEach((node) => {
    node.style.display = 'block'
  })
  document.getElementById('disclaimer').style.display = 'block'
  window.HOSTS.forEach(function (url, i) {
    if (window.BLACKLIST_HOSTS.includes(url) || url.includes('airbnb')) {
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
