#!/bin/bash

# svgtopng functions from:
# https://github.com/Zren/dotfiles/blob/master/Scripts/svgtopng
if ! type "inkscape" > /dev/null; then
	echo "inkscape is required"
	exit 1
fi
function svgToPngScript () {
	filepath="$1"
	shift

	if [ ! -f "$filepath" ]; then
		echo "Needs a file"
		exit 1
	fi

	args=""
	if [ ! -z "${OUTSIZE}" ]; then
		args="--export-width=${OUTSIZE} --export-height=${OUTSIZE}"
		if [ ! -z "$SUFFIX" ]; then
			suffix="-${OUTSIZE}"
		fi
	fi
	suffix="${SUFFIX}"
	if [ -z "$suffix" ]; then
		suffix="-${OUTSIZE}"
	fi

	dirpath=`dirname "$filepath"`
	filename=`basename -- "$filepath"`
	extension="${filename##*.}"
	filename="${filename%.*}"
	outFilename="${filename}${suffix}.png"
	outFilepath="${dirpath}/${outFilename}"

	echo "File: \"${filepath}\" => \"${outFilename}\""
	inkscape "$filepath" --export-type="png" $args --export-filename="$outFilepath"
}

function renderIcon() {
	filename="$1"
	filepath="src/icons/${filename}"
	svgToPngScript "$filepath"
}

OUTSIZE=16 SUFFIX="-${OUTSIZE}px" renderIcon "rating.svg"
OUTSIZE=32 SUFFIX="-${OUTSIZE}px" renderIcon "rating.svg"
OUTSIZE=48 SUFFIX="-${OUTSIZE}px" renderIcon "rating.svg"
OUTSIZE=64 SUFFIX="-${OUTSIZE}px" renderIcon "rating.svg"
OUTSIZE=96 SUFFIX="-${OUTSIZE}px" renderIcon "rating.svg"
OUTSIZE=128 SUFFIX="-${OUTSIZE}px" renderIcon "rating.svg"

OUTSIZE=16 SUFFIX="-${OUTSIZE}px" renderIcon "rating-dark.svg"
OUTSIZE=32 SUFFIX="-${OUTSIZE}px" renderIcon "rating-dark.svg"
OUTSIZE=48 SUFFIX="-${OUTSIZE}px" renderIcon "rating-dark.svg"
OUTSIZE=64 SUFFIX="-${OUTSIZE}px" renderIcon "rating-dark.svg"
OUTSIZE=96 SUFFIX="-${OUTSIZE}px" renderIcon "rating-dark.svg"
OUTSIZE=128 SUFFIX="-${OUTSIZE}px" renderIcon "rating-dark.svg"

OUTSIZE=16 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks.svg"
OUTSIZE=32 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks.svg"
OUTSIZE=48 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks.svg"
OUTSIZE=64 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks.svg"
OUTSIZE=96 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks.svg"
OUTSIZE=128 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks.svg"

OUTSIZE=16 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks-dark.svg"
OUTSIZE=32 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks-dark.svg"
OUTSIZE=48 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks-dark.svg"
OUTSIZE=64 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks-dark.svg"
OUTSIZE=96 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks-dark.svg"
OUTSIZE=128 SUFFIX="-${OUTSIZE}px" renderIcon "recentbookmarks-dark.svg"
