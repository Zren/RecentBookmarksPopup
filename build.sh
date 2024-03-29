#/usr/bin/env sh

projectName="RecentBookmarksPopup"

### Backup
cp ./src/manifest.json ./manifest.json


### Firefox
echo "[Firefox]"

# Modify
python3 ./preparebuild_firefox.py

# Zip
zipFilename="${projectName}-firefox.xpi"
if [ -f "$zipFilename" ]; then
	rm "$zipFilename"
fi
(cd ./src && zip \
	-x "darkmodeicon.html" \
	-x "darkmodeicon.js" \
	-x "serviceworker.js" \
	-x "icons/recentbookmarks-chrome*.png" \
	-x "icons/recentbookmarks-chrome*.svg" \
	-r \
	"./../${zipFilename}" \
	./* \
)


### Chrome
echo ""
echo "[Chrome]"

# Modify
python3 ./preparebuild_chrome.py

# Zip
zipFilename="${projectName}-chrome.zip"
if [ -f "$zipFilename" ]; then
	rm "$zipFilename"
fi
(cd ./src && zip \
	-x "faviconcacher.js" \
	-x "icons/recentbookmarks-firefox*.png" \
	-x "icons/recentbookmarks-firefox*.svg" \
	-r \
	"./../${zipFilename}" \
	./* \
)


### Restore
mv ./manifest.json ./src/manifest.json
