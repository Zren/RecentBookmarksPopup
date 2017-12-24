var el = function(html) {
	var e = document.createElement('div')
	e.innerHTML = html
	return e.removeChild(e.firstChild)
}

function encodeEntities(str) {
	var e = document.createElement('div')
	e.textContent = str
	return e.innerHTML
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
			state.tagMap[bookmarkTreeNode.id] = bookmarkTreeNode.title
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
		var e = template('#bookmarkListItem', {
			title: encodeEntities(bookmarkTreeNode.title),
			url: bookmarkTreeNode.url,
			host: url.host,
			faviconUrl: hostFaviconUrl || defaultFaviconUrl,
			tag: state.tagMap[bookmarkTreeNode.parentId] || '',
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
