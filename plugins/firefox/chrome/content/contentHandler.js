InstantFox.contentHandler = {
	setGoogleLocation: function(){
		content.document.getElementById("lst-ib").value='opera ';
		content.document.getElementById("gac_scont").style.display='none';
		content.document.getElementById("gray").style.display='none';	
	},
	finishGoogleLocation: function(){
		content.document.getElementById("gac_scont").style.display='';
		content.document.getElementById("gray").style.display=''
	}
	
	
	
}

InstantFox.pageLoader = {
	preview: null,
    removePreview: function() {
        if (this.preview != null) {
            this.preview.parentNode.removeChild(this.preview);
            this.preview = null;
        }
    },

    // Provide a way to replace the current tab with the preview
    persistPreview: function() {
		let preview = this.preview
        if (preview == null)
			return;

        // Mostly copied from tabbrowser.xml swapBrowsersAndCloseOther
        let selectedTab = browser.selectedTab;
        let selectedBrowser = selectedTab.linkedBrowser;
        selectedBrowser.stop();

        // Unhook our progress listener
        let selectedIndex = selectedTab._tPos;
        const filter = browser.mTabFilters[selectedIndex];
        let tabListener = browser.mTabListeners[selectedIndex];
        selectedBrowser.webProgress.removeProgressListener(filter);
        filter.removeProgressListener(tabListener);
        let tabListenerBlank = tabListener.mBlank;

        // Pick out the correct interface for before/after Firefox 4b8pre
        let openPage = browser.mBrowserHistory || browser._placesAutocomplete;

        // Restore current registered open URI.
        if (selectedBrowser.registeredOpenURI) {
            openPage.unregisterOpenPage(selectedBrowser.registeredOpenURI);
            delete selectedBrowser.registeredOpenURI;
        }
        openPage.registerOpenPage(preview.currentURI);
        selectedBrowser.registeredOpenURI = preview.currentURI;

        // Save the last history entry from the preview if it has loaded
        let history = preview.sessionHistory.QueryInterface(Ci.nsISHistoryInternal);
        let entry;
        if (history.count > 0) {
            entry = history.getEntryAtIndex(history.index, false);
            history.PurgeHistory(history.count);
        }

        // Copy over the history from the current tab if it's not empty
        let origHistory = selectedBrowser.sessionHistory;
        for (let i = 0; i <= origHistory.index; i++) {
            let origEntry = origHistory.getEntryAtIndex(i, false);
            if (origEntry.URI.spec != "about:blank") history.addEntry(origEntry, true);
        }

        // Add the last entry from the preview; in-progress preview will add itself
        if (entry != null) history.addEntry(entry, true);

        // Swap the docshells then fix up various properties
        selectedBrowser.swapDocShells(preview);
        selectedBrowser.attachFormFill();
        browser.setTabTitle(selectedTab);
        browser.updateCurrentBrowser(true);
        browser.useDefaultIcon(selectedTab);
        urlBar.value = (selectedBrowser.currentURI.spec != "about:blank") ? selectedBrowser.currentURI.spec : preview.getAttribute("src");

        // Restore the progress listener
        tabListener = browser.mTabProgressListener(selectedTab, selectedBrowser, tabListenerBlank);
        browser.mTabListeners[selectedIndex] = tabListener;
        filter.addProgressListener(tabListener, Ci.nsIWebProgress.NOTIFY_ALL);
        selectedBrowser.webProgress.addProgressListener(filter, Ci.nsIWebProgress.NOTIFY_ALL);

        // Move focus out of the preview to the tab's browser before removing it
        preview.blur();
        selectedBrowser.focus();
        this.removePreview();
    },

    addPreview: function(url) {
        // Only auto-load some types of uris
        //let url = result.getAttribute("url");
        if (url.search(/^(data|ftp|https?):/) == -1) {
            this.removePreview();
            return;
        }
		let preview = this.preview
		let browser = window.gBrowser;
        // Create the preview if it's missing
        if (preview == null) {
            preview = window.document.createElement("browser");
            preview.setAttribute("type", "content");

            // Copy some inherit properties of normal tabbrowsers
            preview.setAttribute("autocompletepopup", browser.getAttribute("autocompletepopup"));
            preview.setAttribute("contextmenu", browser.getAttribute("contentcontextmenu"));
            preview.setAttribute("tooltip", browser.getAttribute("contenttooltip"));

            // Prevent title changes from showing during a preview
            preview.addEventListener("DOMTitleChanged", function(e) e.stopPropagation(), true);

            // The user clicking or tabbinb to the content should indicate persist
            preview.addEventListener("focus", persistPreview, true);
        }

        // Move the preview to the current tab if switched
        let selectedStack = browser.selectedBrowser.parentNode;
        if (selectedStack != preview.parentNode)
			selectedStack.appendChild(preview);

        // Load the url i
        preview.webNavigation.loadURI(url, nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE, null, null, null);
    }
}


// google test
/*p=document.getElementById("grey")//.value
p=document.getElementById("lst-ib")//.value

#>>
document.activeElement

#>>
yui=['hys','hystot','hysoiy','hystr','hystt opi']
i=0
cont = true
function x(){
    p.value =yui[i]
    i++
    if(i>=yui.length)
        i=0
    cont && setTimeout(x, 100)
	console.log(p.value)
}
x()
#>>
*/