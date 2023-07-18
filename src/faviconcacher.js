// Version 1

var isFirefox = typeof browser !== 'undefined'
var browserAPI = chrome

function cacheFavicon(hostname, favIconUrl) {
	browserAPI.storage.local.get({
		'favIconHostList': [],
	}, function(items) {
		if (items.favIconHostList.indexOf(hostname) == -1) {
			var values = {}

			var newHostList = items.favIconHostList.slice()
			newHostList.push(hostname)
			values['favIconHostList'] = newHostList

			var hostnameKey = 'favIconUrl-' + hostname
			values[hostnameKey] = favIconUrl

			console.log('cacheFavicon', hostnameKey, favIconUrl)
			browserAPI.storage.local.set(values)
		}
	})
}

function deleteCachedFavicon(hostname) {
	browserAPI.storage.local.get({
		'favIconHostList': [],
	}, function(items) {
		var hostIndex = items.favIconHostList.indexOf(hostname)
		if (hostIndex != -1) {
			var values = {}

			var newHostList = items.favIconHostList.slice()
			newHostList.splice(hostIndex, 1) // remove
			values['favIconHostList'] = newHostList

			browserAPI.storage.local.set(values)

			var hostnameKey = 'favIconUrl-' + hostname
			console.log('deleteCachedFavicon', hostnameKey)
			browserAPI.storage.local.remove([hostnameKey])
		}
	})
}

function onTabUpdated(tabId, changeInfo, tabInfo) {
	if (changeInfo.favIconUrl) {
		// console.log("Tab: " + tabId + " URL changed to " + changeInfo.url)
		// console.log("    favIconUrl:", tabInfo.favIconUrl)
		// console.log("    changeInfo:", changeInfo)
		// console.log("    tabInfo:", tabInfo)

		var a = document.createElement('a')
		a.href = tabInfo.url

		cacheFavicon(a.hostname, changeInfo.favIconUrl)
	}
}


if (isFirefox) {
	var tabUpdateFilter = {
		properties: [
			'favIconUrl'
		],
	}
	browserAPI.tabs.onUpdated.addListener(onTabUpdated, tabUpdateFilter)
}
