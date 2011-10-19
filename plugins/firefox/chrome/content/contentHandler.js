InstantFox.contentHandlers = {
	"google":{
		onLoad: function(q){
			this.checkPreview(800)
		},
		// workaround for google bug
		gre: /[&?#]q=([^&]*)/,
		checkPreview: function(delay){
			var q = InstantFoxModule.currentQuery
			if(!q)
				return

			var self = InstantFox.contentHandlers.google
			if(delay){
				if(self.timeout)
					clearTimeout(self.timeout)

				self.timeout = setTimeout(self.checkPreview, delay, 0)
				return
			}

			self.timeout = null

			var url = InstantFox.pageLoader.preview.contentDocument.location.href
			var m1 = url.match(self.gre), m2 = q.preloadURL.match(self.gre)
			dump('***************', url, q.preloadURL)
			dump('***************', m1, m2, self.gre)
			if(!m1 || !m2 || m1[1] != m2[1]){
				Cu.reportError(url + "\n!=\n" + q.preloadURL)
				InstantFox.pageLoader.addPreview(InstantFoxModule.currentQuery.preloadURL)
				self.checkPreview(800)
			}
		},
	},
	"google":{
		onLoad: function(q, samePage){
			var win = InstantFox.pageLoader.previewIsActive ? InstantFox.pageLoader.preview.contentWindow : content
			var el = win.document.getElementById("lst-ib")
			if(!el)
				return false
			el.value = q.query;
			var e = document.createEvent('UIEvent')
			e.initUIEvent('input',true, true, win, 1)
			el.dispatchEvent(e)
			
			return true
		},
		hideItems: function(doc){
			doc.getElementById("lst-ib").value='opera ';
			doc.getElementById("gac_scont").style.display='none';
			doc.getElementById("gray").style.display='none';
		},
		finishSearch: function(){
			content.document.getElementById("gac_scont").style.display='';
			content.document.getElementById("gray").style.display=''
		},
	}
}

InstantFox.pageLoader = {
	get isActive(){
		return this.preview && this.preview.parentNode
	},
	preview: null,
	previewIsActive: false,
    removePreview: function() {
		if(this.previewIsActive)
			this.previewIsActive = false
        if (this.preview != null && this.preview.parentNode) {
            this.preview.parentNode.removeChild(this.preview);
            this.removeProgressListener(this.preview);
        }
    },

    // Provide a way to replace the current tab with the preview
    persistPreview: function(tab, inBackground) {
		if (!this.previewIsActive)
			return;
		gURLBar.blur()
		if(tab == 'new'){
			tab = gBrowser.selectedTab
			if(!isTabEmpty(tab)){
				gBrowser._lastRelatedTab = null
                var relatedToCurrent = Services.prefs.getBoolPref("browser.tabs.insertRelatedAfterCurrent")
				var tab = gBrowser.addTab('', {relatedToCurrent:relatedToCurrent, skipAnimation:true})
				gBrowser.selectedTab = tab;
			}
		}
		var browser = this.swapBrowsers(tab)
		browser.userTypedValue = null;

		// Move focus out of the preview to the tab's browser before removing it

		this.preview.blur();
        inBackground || browser.focus();
        this.removePreview();
	},
	swapBrowsers: function(tab) {
		let preview = this.preview

        // Mostly copied from tabbrowser.xml swapBrowsersAndCloseOther
        let browser = window.gBrowser;
		let selectedTab = tab || browser.selectedTab;
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
        if (entry != null)
			history.addEntry(entry, true);

        // Swap the docshells then fix up various properties
        selectedBrowser.swapDocShells(preview);
        selectedBrowser.attachFormFill();
        browser.setTabTitle(selectedTab);
        browser.updateCurrentBrowser(true);
        browser.useDefaultIcon(selectedTab);
        gURLBar.value = (selectedBrowser.currentURI.spec != "about:blank") ? selectedBrowser.currentURI.spec : preview.getAttribute("src");

        // Restore the progress listener
        tabListener = browser.mTabProgressListener(selectedTab, selectedBrowser, tabListenerBlank);
        browser.mTabListeners[selectedIndex] = tabListener;
        filter.addProgressListener(tabListener, Ci.nsIWebProgress.NOTIFY_ALL);
        selectedBrowser.webProgress.addProgressListener(filter, Ci.nsIWebProgress.NOTIFY_ALL);

		// rstore history
		preview.docShell.useGlobalHistory = false

		return selectedBrowser
    },

	onfocus: function(e){
		this.persistPreview()
	},
	onTitleChanged: function(e){
		dump(e.target.title)
		if(e.target == InstantFox.pageLoader.preview.contentDocument)
			InstantFox.pageLoader.label.value = e.target.title;
		e.stopPropagation()
	},

    addPreview: function(url) {
        // Only auto-load some types of uris
        //let url = result.getAttribute("url");
        /* if (url.search(/^(data|ftp|https?):/) == -1) {
            this.removePreview();
            return;
        } */
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
            preview.addEventListener("DOMTitleChanged", this.onTitleChanged, true);

            // The user clicking or tabbinb to the content should indicate persist
            preview.addEventListener("focus", this.onfocus.bind(this), true);
			this.preview = preview
        }

        // Move the preview to the current tab if switched
        let selectedStack = browser.selectedBrowser.parentNode;
        if (selectedStack != preview.parentNode){
			selectedStack.appendChild(preview);
			this.addProgressListener(preview)

			// set urlbaricon
			// todo: handle this elsewhere
			PageProxySetIcon('chrome://instantfox/content/skin/button-logo.png')
			gIdentityHandler.setMode(gIdentityHandler.IDENTITY_MODE_UNKNOWN)
		}
		this.previewIsActive = true
		// disable history
		preview.docShell.useGlobalHistory = false


        // Load the url i
        preview.webNavigation.loadURI(url, nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE, null, null, null);
    },

	//
	addProgressListener: function(browser) {
        // Listen for webpage loads
		if(!this.a){
			//InstantFox.pageLoader.preview.addProgressListener(this);
			this.a = true
		}

		if(!this.image){
			var image = window.document.createElement("image");
			image.setAttribute('src', 'chrome://instantfox/content/skin/ajax-loader.gif')

			var imagebox = window.document.createElement("vbox");
			imagebox.appendChild(image)
			imagebox.setAttribute('align', 'center')

			var box = window.document.createElement("hbox");
			box.setAttribute('bottom',0)
			box.setAttribute('pack', 'center')
			box.setAttribute('align', 'center')

			var label = window.document.createElement("label");
			label.setAttribute('value','debug')

			box.appendChild(label)
			box.appendChild(imagebox)

			this.label = label
			this.image = image
			this.box = box

			label.style.background = 'white'
			label.style.color = 'black'
			box.style.pointerEvents = 'none'
			box.style.opacity = '0.7'
			box.style.width = '100%'

		}

		browser.parentNode.appendChild(this.box)
    },

    removeProgressListener: function(browser) {
		this.box.parentNode.removeChild(this.box);
    },
};



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