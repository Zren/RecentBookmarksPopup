var isFirefox = typeof browser !== 'undefined'
var isChrome = typeof browser === 'undefined'

var randomPastelColor = function() {
	// Based on the Random Pastel code from StackOverflow
	// https://stackoverflow.com/a/43195379/947742
	return "hsl(" + 360 * Math.random() + ', ' + // Hue: Any
		(25 + 70 * Math.random()) + '%, ' + // Saturation: 25-95
		(40 + 30 * Math.random()) + '%)' // Lightness: 40-70
}
var randomPastelHsl = function() {
	return {
		h: 360 * Math.random(), // Hue: Any
		s: (25 + 20 * Math.random()), // Saturation: 25-95
		l: (40 + 30 * Math.random()), // Lightness: 40-70
	}
}

var currentColor = {
	h: 120, // green
	s: 30,
	l: 40,
}
var hueStep = 77
var nextPastelHsl = function() {
	var c = { // clone
		h: currentColor.h,
		s: currentColor.s,
		l: currentColor.l,
	}
	currentColor.h += hueStep
	return c
}

// https://stackoverflow.com/a/69122877/947742
function timeAgo(input) {
	const date = (input instanceof Date) ? input : new Date(input)
	const formatter = new Intl.RelativeTimeFormat()
	const ranges = {
		years: 3600 * 24 * 365,
		months: 3600 * 24 * 30,
		weeks: 3600 * 24 * 7,
		days: 3600 * 24,
		hours: 3600,
		minutes: 60,
		seconds: 1
	}
	const secondsElapsed = (date.getTime() - Date.now()) / 1000
	for (let key in ranges) {
		if (ranges[key] < Math.abs(secondsElapsed)) {
			const delta = secondsElapsed / ranges[key]
			return formatter.format(Math.round(delta), key)
		}
	}
}
function updateElement(el, propData) {
	for (const prop of propData) {
		const selector = prop[0]
		const key = prop[1]
		const value = prop[2]
		const target = el.matches(selector) ? el : el.querySelector(selector)
		if (key.startsWith('attributes.')) {
			const attrName = key.substr('attributes.'.length)
			target.setAttribute(attrName, value)
		} else {
			target[key] = value
		}
	}
}
function renderTemplate(templateSelector, propData) {
	const template = document.querySelector('template' + templateSelector)
	const el = template.content.firstElementChild.cloneNode(true)
	if (typeof propData !== 'undefined') {
		updateElement(el, propData)
	}
	return el
}

var cache = {
	faviconHostnameList: [],
}
var state = {
	mode: 'open',
	renderedBookmarkIndex: -1,
	numRecentBookmarks: 30, // 20 fits nicely without a scrollbar
	tagMap: {},
	tagColorMap: {},
	rootNode: {
		children: [],
	},
	fetchingBookmarks: false,
	reachedEnd: false,
}

const configDefaults = {
	groupBookmarksByDate: false,
	showRelativeDate: true,
	showActionToolbar: true,
}
let config = configDefaults
function loadConfig(callback) {
	chrome.storage.local.get(configDefaults, function(items) {
		config = items
		if (typeof callback === 'function') {
			callback()
		}
	})
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
				state.tagColorMap[bookmarkTreeNode.id] = nextPastelHsl()
			}
		}
		render()
	})
}

var loadBookmarksList = function(callback) {
	chrome.bookmarks.getRecent(state.numRecentBookmarks, function(bookmarkTreeNodes) {
		state.rootNode.children = bookmarkTreeNodes
		console.log('state.rootNode.children.length', state.rootNode.children.length, 'state.numRecentBookmarks', state.numRecentBookmarks, '<', state.rootNode.children.length < state.numRecentBookmarks)
		if (state.rootNode.children.length < state.numRecentBookmarks) {
			state.reachedEnd = true
		}
		updateParentFolderTagMap()
		render()
		if (isFirefox) {
			fetchFavicons()
		}
		if (typeof callback === 'function') {
			callback()
		}
	})
}

function hslFromHostname(urlHostname) {
	var hostname = urlHostname.replace(/^www\./, '')
	var aCode = 'a'.charCodeAt(0)
	var zCode = 'z'.charCodeAt(0)
	var hueRatio = (hostname.toLowerCase().charCodeAt(0) - aCode) / (zCode - aCode)
	var hue = Math.round(255 * hueRatio)
	var satRatio = (hostname.toLowerCase().charCodeAt(1) - aCode) / (zCode - aCode)
	var sat = 60 + Math.round(40 * satRatio)
	var ligRatio = (hostname.toLowerCase().charCodeAt(2) - aCode) / (zCode - aCode)
	var lig = 10 + Math.round(30 * satRatio)
	return 'hsl(' + hue + ', ' + sat + '%, ' + lig + '%)'
}

// We can't use @media (prefers-color-scheme: dark) CSS for some reason,
// so we use this JS media query and toggle body[lwt-newtab-brighttext] attribute.
// https://github.com/mozilla/gecko-dev/blob/master/browser/base/content/contentTheme.js
const prefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)")
chrome.runtime.sendMessage({
	type: 'themeChange',
	theme: prefersDarkQuery.matches ? 'dark' : 'light',
})

function fixDarkFavIcon(hostname, favIconUrl) {
	if (hostname == 'github.com') {
		var dataPrefix = 'data:image/svg+xml;base64,'
		if (favIconUrl.startsWith(dataPrefix)) {
			var dataStr = favIconUrl.substr(dataPrefix.length)
			var svgStr1 = atob(dataStr)
			var svgStr2 = svgStr1.replace(' fill="#24292E"', ' fill="#FFFFFF"')
			if (svgStr1 != svgStr2) {
				var newFavIconUrl = dataPrefix + btoa(svgStr2)
				return newFavIconUrl
			}
		}
	}
	return favIconUrl
}

function fetchFavicons(callback) {
	var hostnameList = document.querySelectorAll('.favicon[data-hostname]')
	hostnameList = Array.prototype.map.call(hostnameList, function(placeIcon) {
		return placeIcon.getAttribute('data-hostname')
	})
	var keys = {}
	for (var hostname of hostnameList) {
		if (!cache.faviconHostnameList.includes(hostname)) {
			var hostnameKey = 'favIconUrl-' + hostname
			keys[hostnameKey] = ''
			cache.faviconHostnameList.push(hostname)
		}
	}
	chrome.storage.local.get(keys, function(items){
		var keys = Object.keys(items)
		// console.log('fetchFavicons', keys)

		var style = document.querySelector('style#favicon-style')
		if (!style) {
			style = document.createElement('style')
			style.setAttribute('type', 'text/css')
			style.setAttribute('id', 'favicon-style')
			document.head.appendChild(style) // Must add to DOM before sheet property is available
		}
		var stylesheet = style.sheet
		for (var key of keys) {
			var hostname = key.substr('favIconUrl-'.length)
			var favIconUrl = items[key]
			if (favIconUrl) {
				if (prefersDarkQuery.matches) {
					favIconUrl = fixDarkFavIcon(hostname, favIconUrl)
				}
				var selector = '.favicon[data-hostname="' + hostname + '"]'
				var rule = selector + ' { background-image: url(' + favIconUrl + '); background-color: transparent !important; }'
				stylesheet.insertRule(rule, stylesheet.cssRules.length)
			}
		}
		if (typeof callback === 'function') {
			callback()
		}
	})
}

function adjustWindowSize() {
	document.documentElement.style.height = "34px"
	document.body.style.height = "34px"
}

function slideAndRemove(bookmarkListItem, callback) {
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
		if (typeof callback === 'function') {
			callback()
		}
	}, duration+1)
}

function getArchiveFolder(callback) {
	chrome.bookmarks.search('Archive', function(bookmarkTreeNodes) {
		for (var i = 0; i < bookmarkTreeNodes.length; i++) {
			var bookmarkTreeNode = bookmarkTreeNodes[i]
			if (!bookmarkTreeNode.url && bookmarkTreeNode.title == 'Archive') {
				console.log('archive', bookmarkTreeNode)
				callback(bookmarkTreeNode)
				return
			}
		}
		callback(null)
	})
}

var onBookmarkItemClick = function(e) {
	var bookmarkId = this.getAttribute('data-id')
	if (state.mode == 'open') {
		if (isFirefox) {
			// Firefox opens the link in a new tab so we don't need to do it manually.
			return
		} else { // isChrome
			// Chrome needs to create the tab
			chrome.tabs.create({
				url: this.href
			})
		}
	} else if (state.mode == 'archive') {
		getArchiveFolder(function(bookmarkTreeNode) {
			console.log('move', bookmarkId, bookmarkTreeNode.id)
			chrome.bookmarks.move(bookmarkId, {
				parentId: bookmarkTreeNode.id
			}, function(result) {
				console.log('move.result', result)
				loadBookmarksList()
			})
		})
		e.preventDefault()
		e.stopPropagation()()
	} else if (state.mode == 'delete') {
		var bookmarkListItem = this
		chrome.bookmarks.remove(bookmarkId, function() {
			slideAndRemove(bookmarkListItem, function() {
				loadBookmarksList()
			})
		})
		e.preventDefault()
		e.stopPropagation()()
	} else {
		alert('unknown state.mode: ' + state.mode)
	}
}

function getFaviconURL(url, size) {
	//--- Chrome Manifest v2
	// return 'chrome://favicon/size/16@1x/' + encodeURI(url)
	// return 'chrome://favicon/' + encodeURI(url)
	//--- Chrome Manifest v3
	// https://developer.chrome.com/docs/extensions/mv3/favicon/
	const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'))
	faviconUrl.searchParams.set('pageUrl', url)
	faviconUrl.searchParams.set('size', size || '32')
	return faviconUrl.toString()
}

function getFaviconImageSet(url) {
	return "-webkit-image-set(url('" + getFaviconURL(url, 16) + "') 1x, url('" + getFaviconURL(url, 32) + "') 2x)"
}

function onBookmarkSectionClick(e) {
	let bookmarkDateStr = this.getAttribute('data-date')
	if (this.classList.contains('expanded')) { // Collapse
		this.classList.replace('expanded', 'collapsed')
		let bookmarkItemList = document.querySelectorAll('.bookmarks-item[data-date="' + bookmarkDateStr + '"]')
		bookmarkItemList.forEach(function(bookmarkItem){
			bookmarkItem.classList.add('hidden')
		})
		checkBookmarkListScroll()
	} else { // Expand
		this.classList.replace('collapsed', 'expanded')
		let bookmarkItemList = document.querySelectorAll('.bookmarks-item[data-date="' + bookmarkDateStr + '"]')
		bookmarkItemList.forEach(function(bookmarkItem){
			bookmarkItem.classList.remove('hidden')
		})
	}
}

var renderBookmarksList = function() {
	var bookmarkList = document.getElementById('bookmarkList')

	// bookmarkList.innerHTML = '' // Clear children
	// state.renderedBookmarkIndex = 0

	let lastDateStr = ''
	for (var i = 0; i < state.rootNode.children.length; i++) {
		var bookmarkTreeNode = state.rootNode.children[i]
		var url = new URL(bookmarkTreeNode.url)

		const isAlreadyRendered = i <= state.renderedBookmarkIndex

		const bookmarkDate = new Date(bookmarkTreeNode.dateAdded)
		const bookmarkDateStr = bookmarkDate.toISOString().substr(0, 10)
		if (!isAlreadyRendered && bookmarkDateStr != lastDateStr) {
			let sectionTitle = bookmarkDateStr
			if (config.showRelativeDate) {
				sectionTitle = timeAgo(bookmarkDateStr)
			}
			let section = renderTemplate('#bookmarkListSection', [
				['.bookmarks-section', 'attributes.data-date', bookmarkDateStr],
				['.bookmarks-section', 'attributes.aria-label', sectionTitle],
				['.section-title', 'textContent', sectionTitle],
				['.section-title', 'attributes.title', bookmarkDateStr],
			])
			section.addEventListener('click', onBookmarkSectionClick)
			bookmarkList.appendChild(section)
		}
		lastDateStr = bookmarkDateStr

		var tagColorStart = ''
		let tagHue = '0'
		let tagSaturation = '0'
		if (bookmarkTreeNode.parentId) {
			var c = state.tagColorMap[bookmarkTreeNode.parentId]
			if (c) {
				tagHue = c.h
				tagSaturation = c.s + '%'
			}
		}
		const tagStyle = '--tagHue: ' + tagHue + '; --tagSaturation: ' + tagSaturation + ';'
		const tag = state.tagMap[bookmarkTreeNode.parentId] || ''

		let e
		if (isAlreadyRendered) {
			e = bookmarkList.querySelector('.bookmarks-item[data-id="' + bookmarkTreeNode.id + '"')
		} else {
			e = renderTemplate('#bookmarkListItem')
		}

		updateElement(e, [
			['.bookmarks-item', 'attributes.data-id', bookmarkTreeNode.id],
			['.bookmarks-item', 'attributes.data-date', bookmarkDateStr],
			['.bookmarks-item', 'attributes.href', bookmarkTreeNode.url],
			['.bookmarks-item', 'attributes.aria-label', bookmarkTreeNode.title],
			['.website-title', 'textContent', bookmarkTreeNode.title],
			['.website-title', 'attributes.title', bookmarkTreeNode.title + '\n' + bookmarkTreeNode.url],
			['.bookmark-tag', 'textContent', tag],
			['.bookmark-tag', 'attributes.aria-label', tag],
			['.bookmark-tag', 'attributes.style', tagStyle],
		])

		var favicon = e.querySelector('.favicon')
		if (isChrome) {
			favicon.style.backgroundImage = getFaviconImageSet(bookmarkTreeNode.url)
		} else { // isFirefox
			var iconBgColor = hslFromHostname(url.hostname)
			favicon.style.backgroundColor = iconBgColor
			favicon.classList.add('icon-bookmark-overlay')
			favicon.setAttribute('data-hostname', url.hostname)
		}
		if (!isAlreadyRendered) {
			e.addEventListener('click', onBookmarkItemClick)
			bookmarkList.appendChild(e)
		}
		if (i > state.renderedBookmarkIndex) {
			state.renderedBookmarkIndex = i
		}
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

function fetchMoreBookmarks() {
	// console.log('fetchMoreBookmarks', 'state.fetchingBookmarks', state.fetchingBookmarks)
	if (state.fetchingBookmarks || state.reachedEnd) {
		return
	}
	state.fetchingBookmarks = true
	state.numRecentBookmarks += 100
	loadBookmarksList(function(){
		state.fetchingBookmarks = false
	})
}

function updateBookmarksList() {
	document.body.classList.toggle('bookmarks-section-hidden', !config.groupBookmarksByDate)
}
function updateToolbar() {
	document.body.classList.toggle('toolbar-hidden', !config.showActionToolbar)
}
function setupToolbar() {
	for (var e of document.querySelectorAll('#toolbar .tab[data-mode]')) {
		e.addEventListener('click', function(e) {
			var nextMode = this.getAttribute('data-mode')
			setMode(nextMode)
		})
	}
	getArchiveFolder(function(archiveTreeNode){
		if (archiveTreeNode == null) {
			var archiveModeBtn = document.querySelector('#toolbar .tab[data-mode="archive"]')
			archiveModeBtn.setAttribute('disabled', '')
			archiveModeBtn.setAttribute('title', 'Create a folder named \"Archive\".')
		}
	})
	updateToolbar()
}
function checkBookmarkListScroll() {
	const viewportHeight = bookmarkList.clientHeight
	const scrollBottomY = bookmarkList.scrollTop + viewportHeight
	const scrollThreshold = bookmarkList.scrollHeight - viewportHeight * 0.25
	if (scrollBottomY >= scrollThreshold) {
		fetchMoreBookmarks()
	}
}
function setupBookmarkList() {
	var bookmarkList = document.getElementById('bookmarkList')
	bookmarkList.addEventListener('scroll', function(e){
		// console.log(e)
		checkBookmarkListScroll()
	})
}
function openOptionsPage() {
	chrome.runtime.openOptionsPage()
	window.close()
}

var doRender = function() {
	// console.log('doRender')
	renderBookmarksList()
}
var render = function() {
	// console.log('render')
	// requestAnimationFrame(doRender)
	doRender()
}
var main = function() {
	loadBookmarksList()
	setupToolbar()
	setupBookmarkList()
	loadConfig(function(){
		updateBookmarksList()
		updateToolbar()
	})

	const openOptionsPageButton = document.querySelector('button#open-options-page')
	openOptionsPageButton.addEventListener('click', openOptionsPage)
}
document.addEventListener('DOMContentLoaded', main)
