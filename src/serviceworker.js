function setTheme(theme) {
	const iconThemeKey = theme === 'dark' ? 'light' : 'dark'
	console.log('setTheme', theme, 'iconThemeKey', iconThemeKey)
	fetch(chrome.runtime.getURL('manifest.json')).then((res) => res.json()).then(function(manifest) {
		console.log('manifest', manifest)
		const theme_icons = manifest.action.theme_icons
		console.log('theme_icons', theme_icons)
		let iconPaths = {}
		for (const icon of theme_icons) {
			// console.log('icon', icon)
			const sizeStr = '' + icon.size
			iconPaths[sizeStr] = icon[iconThemeKey]
		}
		console.log('iconPaths', iconPaths)
		chrome.action.setIcon({
			path: iconPaths,
		})
	})
}

chrome.offscreen.createDocument({
	url: 'darkmodeicon.html',
	reasons: ['MATCH_MEDIA'],
	justification: 'Need to check for dark mode to update icons.',
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log('serviceworker.onMessage', request, sender)
	if (request.type === 'themeChange') {
		setTheme(request.theme)
	}
})
