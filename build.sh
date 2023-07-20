#/usr/bin/env sh

projectName="RecentBookmarksPopup"

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
	-x "darkmodeicon.js" \
	-x "icons/rating*.png" \
	-x "icons/rating*.svg" \
	-r "./../${zipFilename}" \
	./* \
)


### Chrome
echo ""
echo "[Chrome]"

# Modify
python3 ./preparebuild_chrome.py

# Zip
zipFilename="${projectName}-chrome.crx"
if [ -f "$zipFilename" ]; then
	rm "$zipFilename"
fi
(cd ./src && zip \
	-x "faviconcacher.js" \
	-x "icons/rating*.png" \
	-x "icons/rating*.svg" \
	-r "./../${zipFilename}" \
	./* \
)

git checkout src/manifest.json

