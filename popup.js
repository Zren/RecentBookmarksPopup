var el = function(html) {
	var e = document.createElement('div')
	e.innerHTML = html
	return e.removeChild(e.firstChild)
}

var encodeEntities = function(str) {
	var e = document.createElement('div')
	e.textContent = str
	return e.innerHTML
}

var randomPastelColor = function() {
	// Based on the Random Pastel code from StackOverflow
	// https://stackoverflow.com/a/43195379/947742
	return "hsl(" + 360 * Math.random() + ', ' + // Hue: Any
		(25 + 70 * Math.random()) + '%, ' + // Saturation: 25-95
		(40 + 30 * Math.random()) + '%)'; // Lightness: 40-70
}
var randomPastelHsl = function() {
	return {
		h: 360 * Math.random(), // Hue: Any
		s: (25 + 20 * Math.random()), // Saturation: 25-95
		l: (40 + 30 * Math.random()), // Lightness: 40-70
	}
}

var templates = document.getElementById('templates')
var template = function(templateSelector, kwargs) {
	var template = templates.querySelector(templateSelector)
	var templateHtml = template.innerHTML.trim()
	var mustacheRegex = /\{\{(\w+?)\}\}/g
	var mustacheReplacer = function(match, p1, offset, string) {
		return typeof kwargs[p1] !== "undefined" ? kwargs[p1] : match
	}
	var templateRendered = templateHtml.replace(mustacheRegex, mustacheReplacer)
	var cookedElement = el(templateRendered)
	return cookedElement
}

var defaultFaviconUrl = ''
var state = {
	mode: 'open',
	tagMap: {},
	tagColorMap: {},
	rootNode: {
		children: [],
	},
}



var updateParentFolderTagMap = function() {
	var parentIdList = []
	for (var i = 0; i < state.rootNode.children.length; i++) {
		var bookmarkTreeNode = state.rootNode.children[i]
		if (bookmarkTreeNode.parentId) {
			parentIdList.push(bookmarkTreeNode.parentId)
		}
	}
	chrome.bookmarks.get(parentIdList, function(bookmarkTreeNodes) {
		for (var i = 0; i < bookmarkTreeNodes.length; i++) {
			var bookmarkTreeNode = bookmarkTreeNodes[i]
			if (typeof state.tagMap[bookmarkTreeNode.id] === "undefined") {
				state.tagMap[bookmarkTreeNode.id] = bookmarkTreeNode.title
				state.tagColorMap[bookmarkTreeNode.id] = randomPastelHsl()
			}
		}
		render()
	})
}

var updateBookmarksList = function() {
	chrome.bookmarks.getRecent(20, function(bookmarkTreeNodes) {
		state.rootNode.children = bookmarkTreeNodes
		updateParentFolderTagMap()
		render()
	})
}

function adjustWindowSize() {
	document.documentElement.style.height = "34px"
	document.body.style.height = "34px"
}

function slideAndRemove(bookmarkListItem) {
	var duration = 400
	bookmarkListItem.style.overflow = "hidden"
	bookmarkListItem.style.height = getComputedStyle(bookmarkListItem).height
	bookmarkListItem.style.transition = "all " + duration + "ms ease-in-out"
	bookmarkListItem.style.left = "100%"
	setTimeout(function() {
		bookmarkListItem.style.height = "1px"
	}, duration/3)
	setTimeout(function() {
		bookmarkListItem.parentNode.removeChild(bookmarkListItem)
	}, duration)
	setTimeout(function() {
		adjustWindowSize()
	}, duration+1)
}

var onBookmarkItemClick = function(e) {
	var bookmarkId = this.getAttribute('data-id')
	if (state.mode == 'open') {
		chrome.tabs.create({
			url: this.href
		});
	} else if (state.mode == 'archive') {
		// chrome.bookmarks.move
	} else if (state.mode == 'delete') {
		var bookmarkListItem = this
		// chrome.bookmarks.remove(bookmarkId, function() {
		// 	slideAndRemove(bookmarkListItem)
		// })
		slideAndRemove(bookmarkListItem)
	} else {
		alert('unknown state.mode: ' + state.mode)
	}
}
var renderBookmarksList = function() {
	var bookmarkList = document.getElementById('bookmarkList')
	bookmarkList.innerHTML = '' // Clear children
	
	for (var i = 0; i < state.rootNode.children.length; i++) {
		var bookmarkTreeNode = state.rootNode.children[i]
		var url = new URL(bookmarkTreeNode.url)
		var hostFaviconUrl = ''
		if (url.host) {
			hostFaviconUrl = 'https://' + url.host + '/favicon.ico'
		}
		var tagColorStart = ''
		if (bookmarkTreeNode.parentId) {
			var c = state.tagColorMap[bookmarkTreeNode.parentId]
			if (c) {
				tagColorStart = 'hsl(' + c.h + ', ' + c.s + '%,'
			}
		}
		var e = template('#bookmarkListItem', {
			id: bookmarkTreeNode.id,
			title: encodeEntities(bookmarkTreeNode.title),
			url: bookmarkTreeNode.url,
			host: url.host,
			faviconUrl: hostFaviconUrl || defaultFaviconUrl,
			tag: state.tagMap[bookmarkTreeNode.parentId] || '',
			tagColorStart: tagColorStart,
		})
		e.addEventListener('click', onBookmarkItemClick)
		bookmarkList.appendChild(e)
	}
}

function setMode(nextMode) {
	for (var e of document.querySelectorAll('#toolbar .tab')) {
		e.classList.remove('current')
	}
	var e = document.querySelector('#toolbar .tab[data-mode="' + nextMode + '"]')
	e.classList.add('current')
	state.mode = nextMode
}

function setupToolbar() {
	for (var e of document.querySelectorAll('#toolbar .tab')) {
		e.addEventListener('click', function(e) {
			var nextMode = this.getAttribute('data-mode')
			setMode(nextMode)
		})
	}
}

var doRender = function() {
	console.log('doRender')
	renderBookmarksList()
}
var render = function() {
	console.log('render')
	// requestAnimationFrame(doRender)
	doRender()
}
var main = function() {
	updateBookmarksList()
	setupToolbar()
}
document.addEventListener('DOMContentLoaded', main);
