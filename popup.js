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

var onBookmarkItemClick = function(e) {
	chrome.tabs.create({
		url: this.href
	});
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
}
document.addEventListener('DOMContentLoaded', main);
