#!/usr/bin/env python3

import json

# Overwrite with chrome changes
with open('./src/manifest.json', 'r') as fin:
	manifest = json.load(fin)

del manifest['background']
manifest['background'] = {
	"scripts": [
		"faviconcacher.js"
	]
}

if 'chrome://favicon/' in manifest['permissions']:
	manifest['permissions'].remove('chrome://favicon/')

if 'tabs' not in manifest['permissions']:
	manifest['permissions'].append('tabs')

with open('./src/manifest.json', 'w') as fout:
	json.dump(manifest, fout, indent='\t')
