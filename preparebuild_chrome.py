#!/usr/bin/env python3

import json

# Overwrite with chrome changes
with open('./src/manifest.json', 'r') as fin:
	manifest = json.load(fin)

manifest['background'] = {
	"scripts": [
		"darkmodeicon.js"
	]
}

if 'tabs' in manifest['permissions']:
	manifest['permissions'].remove('tabs')

if 'chrome://favicon/' not in manifest['permissions']:
	manifest['permissions'].append('chrome://favicon/')


# Icons
oldToken = '-firefox-'
newToken = '-chrome-'
def replaceObjPropWith(obj, objKey, a, b):
	obj[objKey] = obj[objKey].replace(a, b)
replaceObjPropWith(manifest['browser_action'], 'default_icon', oldToken, newToken)
for icon in manifest['browser_action']['theme_icons']:
	replaceObjPropWith(icon, 'light', oldToken, newToken)
	replaceObjPropWith(icon, 'dark', oldToken, newToken)
for iconSize in manifest['icons'].keys():
	replaceObjPropWith(manifest['icons'], iconSize, oldToken, newToken)


with open('./src/manifest.json', 'w') as fout:
	json.dump(manifest, fout, indent='\t')
