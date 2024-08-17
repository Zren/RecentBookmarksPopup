const configDefaults = {
	groupBookmarksByDate: false,
	showRelativeDate: true,
	showActionToolbar: true,
}
// let config = configDefaults
// function loadConfig() {
// 	chrome.storage.local.get(configDefaults, function(items) {
// 		config = items
// 	})
// }

function restoreOptions() {
	document.querySelectorAll('input[data-config-key]').forEach(function(input){
		var configKey = input.getAttribute('data-config-key')
		var defaultValue = configDefaults[configKey]
		var keyDefaults = {}
		keyDefaults[configKey] = defaultValue
		chrome.storage.local.get(keyDefaults, function(items){
			var configValue = items[configKey]
			input.checked = configValue
		})
	})
}

function onOptionCheckboxChanged(event) {
	var input = event.target
	var configKey = input.getAttribute('data-config-key')
	var newValue = input.checked
	var keyValues = {}
	keyValues[configKey] = newValue
	chrome.storage.local.set(keyValues, function(){})
}

function bindOptionInputs() {
	document.querySelectorAll('input[data-config-key]').forEach(function(input){
		input.addEventListener('change', onOptionCheckboxChanged)
	})
}

function onLoad() {
	restoreOptions()
	bindOptionInputs()
}


document.addEventListener('DOMContentLoaded', onLoad)
