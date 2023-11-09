#!/usr/bin/env python3

import json

# Overwrite with chrome changes
with open('./src/manifest.json', 'r') as fin:
	manifest = json.load(fin)

manifest['manifest_version'] = 3

if 'background' in manifest:
	del manifest['background']
	# manifest['background'] = {
	# 	"scripts": [
	# 		"darkmodeicon.js"
	# 	]
	# }

if 'tabs' in manifest['permissions']:
	manifest['permissions'].remove('tabs')

if 'favicon' not in manifest['permissions']:
	manifest['permissions'].append('favicon')

# v2 browser_action => v3 action
if 'browser_action' in manifest:
	manifest['action'] = manifest['browser_action']
	del manifest['browser_action']

# Icons
oldToken = '-firefox-'
newToken = '-chrome-'
def replaceObjPropWith(obj, objKey, a, b):
	obj[objKey] = obj[objKey].replace(a, b)
replaceObjPropWith(manifest['action'], 'default_icon', oldToken, newToken)
for icon in manifest['action']['theme_icons']:
	replaceObjPropWith(icon, 'light', oldToken, newToken)
	replaceObjPropWith(icon, 'dark', oldToken, newToken)
for iconSize in manifest['icons'].keys():
	replaceObjPropWith(manifest['icons'], iconSize, oldToken, newToken)


with open('./src/manifest.json', 'w') as fout:
	json.dump(manifest, fout, indent='\t')
