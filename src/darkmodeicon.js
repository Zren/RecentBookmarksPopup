var isFirefox = typeof browser !== 'undefined'
var isChrome = typeof browser === 'undefined'

// https://stackoverflow.com/questions/58880234/toggle-chrome-extension-icon-based-on-light-or-dark-mode-browser
// https://stackoverflow.com/questions/56393880/how-do-i-detect-dark-mode-using-javascript

// This media query is only dark if the GTK theme is dark. It will
// not detect a dark "custom color" theme in "customize profile".
// Notes:
// * addEventListener('change') doesn't seem to fire event in Chrome background script?!
// * So it only updates the icon when extension is loaded. So restart Chrome after changing OS theme.
if (isChrome) {
	const prefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)")
	function onThemeChange(e) {
		// console.log('prefersDarkQuery.change', prefersDarkQuery)
		chrome.runtime.sendMessage({
			type: 'themeChange',
			theme: prefersDarkQuery.matches ? 'dark' : 'light',
		})
	}
	prefersDarkQuery.addEventListener('change', onThemeChange)
	onThemeChange()
}
