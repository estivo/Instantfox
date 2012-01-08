/********************************************************************
 * http://dev.chromium.org/searchbox
 * http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2010-October/028818.html
 * http://src.chromium.org/svn/trunk/src/chrome/renderer/searchbox_extension.cc
 *
 */
InstantFox.searchBoxAPI = {
    setStatus: function(str){
		InstantFox.pageLoader.label.value = str;
	},
	getUrl: function(){
		return this.isSupported() && this.getWindow().location.href
	},
	getWindow: function(){
		return InstantFox.pageLoader.preview
			&& InstantFox.pageLoader.preview.contentWindow
			&& InstantFox.pageLoader.preview.contentWindow.wrappedJSObject
	},
	getSearchBox: function(){
		var w
		return (w = this.getWindow()) && (w = w.navigator) && (w = w.searchBox)
	},
	isSupported: function() {
		var sb = this.getSearchBox()
		dump(sb, sb&&sb.onchange)
		
		return sb
			&& !!(sb.onchange
			&& sb.onsubmit
			&& sb.oncancel
			&& sb.onresize) || null
	},
	urlRegexp:/#.*$/,
	canLoad: function(qUrl, url2go){
		/*dump(
			qUrl , url2go,
			qUrl && url2go && qUrl.replace(this.urlRegexp, "") == url2go.replace(this.urlRegexp, "")
		)*/
		return qUrl && url2go && qUrl.replace(this.urlRegexp, "") == url2go.replace(this.urlRegexp, "")
	},
	onInput: function(){
		var q = InstantFoxModule.currentQuery
		var text = q.shadow || q.query

		var sb = this.getSearchBox()
		if (sb) {
			sb.selectionEnd = sb.selectionStart = text.length
			sb.value = text
			sb.verbatim = false
			this.setStatus(text)
			this.call(sb, "onchange")
			this.call(sb, "onresize")
		}
	},
	setDimensions: function(){
		var sb = this.getSearchBox()
		if (!sb)
			return
		var browser = InstantFox.pageLoader.preview

		var zoom = browser.markupDocumentViewer.fullZoom;

		var r1 = gURLBar.popup.getBoundingClientRect()
		var r2 = InstantFox.pageLoader.preview.getBoundingClientRect()

		sb.x = (r1.left - r2.left) /zoom
		sb.y = (r1.top  - r2.top) /zoom
		sb.height = r1.height / zoom
		sb.width  = r1.width / zoom

		this.call(sb, "onresize")
	},
	onFinish: function(q){
		var sb = this.getSearchBox()
		if (!sb)
			return
		sb.value = q
		sb.verbatim = true
		this.call(sb, "onchange")
		this.call(sb, "onsubmit")
	},
	addToWindow: function(){
		var win = this.getWindow()
		win.navigator.searchBox = {
			value: '',
			verbatim: false,
			selectionStart: 0,
			selectionEnd: 0,
			x:0, y:0, width:0, height:0,
			setSuggestions: function(suggestions) {
				dump(JSON.stringify(suggestions))
			}
			/* onchange onsubmit oncancel onresize;*/
		}
	},
	call: function(sb, prop){
		dump(prop, sb[prop])
		sb[prop] && sb[prop]()
	},
	handleEvent: function(e){
		e.currentTarget.removeEventListener("DOMWindowCreated", this, false)
		this.addToWindow()
	},
	listen: function(el){
		el.addEventListener("DOMWindowCreated", this, false)
	}
}


InstantFox.contentHandlers = {
	"__default__":{
		isSame: function(q, url2go){
			return q.query && q.preloadURL && url2go.toLowerCase() == q.preloadURL.toLowerCase()
		}
	},
	"google":{
		isSame: function(q, url2go){
			if (!q.query || !q.preloadURL)
				return false
			if (url2go.toLowerCase() == q.preloadURL.toLowerCase())
				return true

			var m1 = url2go.match(this.qRe), m2 = q.preloadURL.match(this.qRe)
			return (!m1 && !m2) || (m1 && m2 && m1[1].toLowerCase() == m2[1].toLowerCase())
		},
		transformURL: function(q, url2go) {
			try{
				var url = InstantFox.pageLoader.preview.contentDocument.location.href;
				//
				var gDomain = url.match(/https?:\/\/((www|encrypted)\.)?google.([a-z\.]*)[^#]*/i)
				if (!gDomain)
					return url2go
				var query = url2go.match(/#.*/)
				if (!query)
					return url2go
				return gDomain[0] + query[0]
			}catch(e){
				Cu.reportError(e)
				return url2go
			}
		},
		onLoad: function(q){
			this.checkPreview(800)
		},
		// workaround for google bug
		qRe: /[&?#]q=([^&]*)/,
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
			if (url == "about:blank")
				return;

			if (!self.isSame(q, url)) {
				Cu.reportError(url + "\n!=\n" + q.preloadURL)
				InstantFox.pageLoader.addPreview(q.preloadURL)
				self.checkPreview(800)
			}
		}
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
		if(tab == 'new' || (tab == undefined && InstantFoxModule.openSearchInNewTab)){
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
	// Mostly copied from mozillaLabs instantPreview
	swapBrowsers: function(tab) {
    	var origin = this.preview;

        // Mostly copied from tabbrowser.xml swapBrowsersAndCloseOther
        var gBrowser = window.gBrowser;
		var targetTab = tab || gBrowser.selectedTab;
        var targetBrowser = targetTab.linkedBrowser;
        targetBrowser.stop();

        // Unhook progress listener
        var targetPos = targetTab._tPos;
		var filter = gBrowser.mTabFilters[targetPos];
		targetBrowser.webProgress.removeProgressListener(filter);
		var tabListener = gBrowser.mTabListeners[targetPos]
        filter.removeProgressListener(tabListener);
		tabListener.destroy();
        var tabListenerBlank = tabListener.mBlank;

        var openPage = gBrowser._placesAutocomplete;

        // Restore current registered open URI.
        if (targetBrowser.registeredOpenURI) {
            openPage.unregisterOpenPage(targetBrowser.registeredOpenURI);
            delete targetBrowser.registeredOpenURI;
        }
        openPage.registerOpenPage(origin.currentURI);
        targetBrowser.registeredOpenURI = origin.currentURI;

        // Save the last history entry from the preview if it has loaded
        var history = origin.sessionHistory.QueryInterface(Ci.nsISHistoryInternal);
        var entry;
        if (history.count > 0) {
            entry = history.getEntryAtIndex(history.index, false);
            history.PurgeHistory(history.count);
        }

        // Copy over the history from the current tab if it's not empty
        var origHistory = targetBrowser.sessionHistory;
        for (var i = 0; i <= origHistory.index; i++) {
            var origEntry = origHistory.getEntryAtIndex(i, false);
            if (origEntry.URI.spec != "about:blank") history.addEntry(origEntry, true);
        }

        // Add the last entry from the preview; in-progress preview will add itself
        if (entry != null)
			history.addEntry(entry, true);

        // Swap the docshells then fix up various properties
        targetBrowser.swapDocShells(origin);
        targetBrowser.attachFormFill();
        gBrowser.setTabTitle(targetTab);
        gBrowser.updateCurrentBrowser(true);
        gBrowser.useDefaultIcon(targetTab);
        gURLBar.value = (targetBrowser.currentURI.spec != "about:blank") ? targetBrowser.currentURI.spec : origin.getAttribute("src");

        // Restore the progress listener
        tabListener = gBrowser.mTabProgressListener(targetTab, targetBrowser, tabListenerBlank);
        gBrowser.mTabListeners[targetPos] = tabListener;
        filter.addProgressListener(tabListener, Ci.nsIWebProgress.NOTIFY_ALL);
        targetBrowser.webProgress.addProgressListener(filter, Ci.nsIWebProgress.NOTIFY_ALL);

		// restore history
		targetBrowser.docShell.useGlobalHistory = true

		return targetBrowser
    },

	onfocus: function(e){
		this.persistPreview()
	},
	onTitleChanged: function(e){
		if(e.target == InstantFox.pageLoader.preview.contentDocument)
			InstantFox.pageLoader.label.value = e.target.title;
		e.stopPropagation()
	},

    addPreview: function(url) {
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

		InstantFox.searchBoxAPI.listen(preview)
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

