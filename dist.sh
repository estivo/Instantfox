#!/bin/bash
archive="InstantFox"

echo "Change to Plugin Folder .."

cd ./plugins/firefox

echo "Done."
echo "----------"


echo "Trying to compress Extension files .."
echo "Target: $archive.zip"

zip -vr $archive * -x "*.DS_Store"

echo "Done."
echo "----------"


echo "Renaming $archive.zip to $archive.xpi .."

mv $archive.zip ../../$archive.xpi

echo "Done."
