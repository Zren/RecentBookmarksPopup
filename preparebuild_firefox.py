#!/usr/bin/env python3

import json

# Overwrite with firefox changes
with open('./src/manifest.json', 'r') as fin:
	manifest = json.load(fin)

manifest['manifest_version'] = 2

manifest['background'] = {
	"scripts": [
		"faviconcacher.js"
	]
}

if 'favicon' in manifest['permissions']:
	manifest['permissions'].remove('favicon')

if 'offscreen' in manifest['permissions']:
	manifest['permissions'].remove('offscreen')

if 'storage' not in manifest['permissions']:
	manifest['permissions'].append('storage')

if 'tabs' not in manifest['permissions']:
	manifest['permissions'].append('tabs')


# v3 action => v2 browser_action
if 'action' in manifest:
	manifest['browser_action'] = manifest['action']
	del manifest['action']

# Icons
oldToken = '-chrome-'
newToken = '-firefox-'
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
