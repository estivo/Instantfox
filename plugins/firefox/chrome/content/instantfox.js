//(function() {
var InFoxPrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

InFoxPrefs.QueryInterface(Ci.nsIPrefBranch2);


var HH = {

    // -- Helper Methods --
	_overwriteHist: function(){ // Used to decide if histroy should be overwritten or not (replace or assign)
		var currentTab = getWebNavigation().sessionHistory;
		if(currentTab.count <= 0){
		  return false;
		}else{
		  if(currentTab.getEntryAtIndex(currentTab.count-1, false).URI.spec == this._url.hist_last){ // maybe encoding needed?! check that later
		    return true; // got it last histroy entry is the same as this._url.hist_last so overwrite it!
		  }else{
		    return false; // not found in latest index of history
		  }
		}
		return false;
	},

    _query: function(query, event) {
      // Query used to replace gURLBar.value onLocationChange
      HH._q = query || gURLBar.value;
      HH._url._ctabID = HH._ctabID;

      if (HH._timeout) window.clearTimeout(HH._timeout);

      HH._timeout = window.setTimeout(function(e) {
        HH._oldState    = HH._state ? { loc: HH._state.loc, id: HH._state.id } : { loc: false, id: false };
        HH._state       = InstantFox.query(HH._q, e);
        HH._isOwnQuery  = true;
        HH._focusPermission(false);

        // load location or load InstantFox site
        var _location;

        if (typeof HH._state.loc == 'string') {
          _location = (HH._state.loc == InstantFox._name) ? HH._url.intn : HH._state.loc;
        } else {
          _location = HH._url.hash + HH._q;
        }

        // Don't spam the history!
       if(HH._url.seralw){
	     /*
		 if (HH._state.id != HH._oldState.id) {
           content.location.replace(_location);
	     } else {
		   content.document.location.assign(_location);
	     }
		 */
		this.loadPage(_location)
		 HH._url.hist_last = _location;
	   }
      }, 200, event);


    },

    // The current content-window-location is the InstantFox Output-Site
    _isInstantFox: function(loc) {
      loc = loc || content.document.location;
      try { return loc.hostname ? loc.hostname.search(HH._url.host) > -1 : false; }
      catch(ex) { return false; }
    },
};



var instantFoxLoad = function(event) {
	dump('instantFoxOnLoad')
	//window.removeEventListener('load', arguments.callee, true);
	// setup URLBar for components
	Cu.import('chrome://instantFox/content/instantFoxModule.js')

	gURLBar.setAttribute('autocompletesearch',	'instantFoxAutoComplete');

	// tell InstantFox which internationalization & URLBar to use
	InstantFox.HH = HH;
	//gBrowser.addProgressListener(HH._observe, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);

	gURLBar.addEventListener('keydown', _keydown, false);
	gURLBar.removeAttribute('oninput');
	gURLBar.addEventListener('input', _input, false);
	gURLBar.addEventListener('blur', HH.onblur, false);

}

var instantFoxUnload = function(event) {
	//dump('---***---',arguments.callee.caller)
	// todo: better cleanup
	gURLBar.removeEventListener('keydown', _keydown, false);
	gURLBar.removeEventListener('input', _input, false);
}

// Prevent pressing enter from performing it's default behaviour
var _keydown = function(event) {
	var key = event.keyCode ? event.keyCode : event.which,
		alt = event.altKey, meta = event.metaKey,
		ctrl = event.ctrlKey, shift = event.shiftKey,
		simulateInput;

	if (InstantFoxModule.currentQuery) {
		if (key == 9 || (!ctrl && !shift && key == 39)) { // 9 == Tab
			if (InstantFox.rightShaddow != '') {
				gURLBar.value += InstantFox.rightShaddow;
				InstantFox.rightShaddow = '';
				simulateInput = true;
			}
		} else if (key == 39 && ctrl && !shift) { // 39 == RIGHT
			if (InstantFox.rightShaddow != '' && gURLBar.selectionEnd == gURLBar.value.length) {
				gURLBar.value += InstantFox.rightShaddow[0]
				simulateInput = true;
			}
		} else if (key == 13 && !meta && !ctrl) { // 13 == ENTER
			if(!alt)
				HH.onEnter(gURLBar.value)
			else {
				HH.openLoadedPageInNewTab()
			}
			event.preventDefault();
		} else if (!alt && !meta && !ctrl && [38,40,34,33].indexOf(key)!=-1) {//UP,DOWN,PAGE_UP,PAGE_DOWN
			if(!InstantFoxModule.currentQuery.plugin.disableInstant) {
				HH.schedulePreload()
				InstantFoxModule.currentQuery.shaddow = '';
			}
		}
	}
	
	if(key == 32 && ctrl) { // 32 == SPACE
		var origVal = gURLBar.value;
		var keyIndex = origVal.indexOf(' ')
		var key=origVal.substring(0,keyIndex)

		if(key in InstantFoxModule.Shortcuts){
		//gURLBar.value = '`'+origVal
			if (gURLBar.selectionStart<=keyIndex) {
				gURLBar.selectionStart = keyIndex+1
				gURLBar.selectionEnd = origVal.length
			} else {
				gURLBar.selectionStart=0
				gURLBar.selectionEnd=keyIndex
			}
			simulateInput=true
		}else{
			var val = InstantFoxModule.queryFromURL(origVal)
			if(val){
				gURLBar.value = val
			}else{
				gURLBar.selectionStart = 0
				gURLBar.selectionEnd = origVal.length
			}
		}
	}

	if(simulateInput){
		gURLBar.controller.handleText(true)
		_input()
		event.preventDefault();
	}
};

// Perform query if space was detected
var _input = function(event) {

	var val = gURLBar.value;
	gBrowser.userTypedValue = val;

	var q = HH.getQuery(val, InstantFoxModule.currentQuery)
	if (q) {
		InstantFoxModule.currentQuery = q;
		HH.updateShaddowLink(q);
	} else if (InstantFoxModule.currentQuery) {
		InstantFoxModule.currentQuery = null;
		HH.updateShaddowLink(q);
	}
};

InstantFox = HH = {
	_isOwnQuery: false,
	
	get _ctabID() gBrowser.mCurrentTab.linkedPanel,
	get _url() InstantFoxModule.currentQuery,
	
	getQuery: function(val, oldQ){
		if(val[0]=='`'){
			
			
		}
			
		var i = val.indexOf(' ');
		if (i == -1)
			return false

		var plugin = InstantFoxModule.Shortcuts[val.substr(0, i)]
		if (!plugin)
			return
		plugin = InstantFoxModule.Plugins[plugin]
		
		var j = val.substr(i).match(/^\s*/)[0].length
		if (!oldQ) {
			oldQ = {
				browserText: nsContextMenu.prototype.getSelectedText().substr(0, 50),
				tabId: gBrowser.mCurrentTab.linkedPanel,
				onSearchReady: this.onSearchReady,
				shaddow: ''
			}
		}
		oldQ.plugin = plugin
		oldQ.query = val.substr(i+j)
		oldQ.splitSpace = val.substr(i,j)
		oldQ.value = val
		return oldQ
	},
	onSearchReady: function(){
		var q = this;//
		//XULBrowserWindow.InsertShaddowLink(q.shaddow||"", q.value||"");
		HH.findBestShaddow(q)
		HH.updateShaddowLink(q)
		if(!q.plugin.disableInstant)
			q.shaddow ? HH.doPreload(q):HH.schedulePreload(100)
	},
	findBestShaddow: function(q){
		q.shaddow = ''
		for each(var i in q.results) {
			if (i.title == q.query) {
				q.shaddow = i.title
				break
			}
			if (!q.shaddow && i.title.indexOf(q.query)==0)
				q.shaddow = i.title
		}
		
	},
	updateShaddowLink: function(q){
		//var q = InstantFoxModule.currentQuery;
		if(!q) {
			if(!gURLBar.currentShaddow)
				return
			gURLBar.currentShaddow = null;
			gURLBar.instantFoxKeyNode.textContent = 
			gURLBar.instantFoxSpacerNode.textContent = 
			gURLBar.instantFoxShaddowNode.textContent = '';
			gURLBar.tip.hidden=true;
			this.rightShaddow = ''
			return
		}
		var key = q.plugin.key;
		var l = 1
		var s = {
			key: key,
			spacer: q.value.substr(key.length).replace(' ', '\u00a0', 'g'),
			shaddow: q.shaddow.substr(q.query.length)
		}
		gURLBar.instantFoxKeyNode.textContent = s.key;
		gURLBar.instantFoxSpacerNode.textContent = s.spacer
		gURLBar.instantFoxShaddowNode.textContent = s.shaddow;
		gURLBar.currentShaddow = s		
		this.rightShaddow = s.shaddow // fixme
		gURLBar.tip.hidden = false;		
		gURLBar.showTip('hello')
	},
	
	doPreload: function(q){
		if(this.timeout)
			this._timeout = clearTimeout(this._timeout)

		if(!q.query)
			return
		var url2go = q.plugin.url;
		url2go = url2go.replace('%q', q.shaddow || q.query);
		
		if(url2go == q.preloadURL)
			return url2go
			
		q.preloadURL = url2go
		
		// see load_flags at http://mxr.mozilla.org/mozilla-central/source/docshell/base/nsIWebNavigation.idl#149
		if(HH._isOwnQuery){
			getWebNavigation().loadURI(url2go, (nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY | nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY), null, null, null);
			//content.location.replace(url2go);
		}else{
			getWebNavigation().loadURI(url2go, (nsIWebNavigation.LOAD_FLAGS_NONE), null, null, null);
			//content.location.assign(url2go);
			HH._isOwnQuery = true;
		}
		return url2go
	},
	
	schedulePreload: function(delay){
		if (this._timeout)
			return

		this._timeout = setTimeout(function(self){
			self._timeout = null
			self.doPreload(InstantFoxModule.currentQuery)
		}, delay||200, this)
	},
	
	onblur: function(e) {
		// Return power to Site if urlbar really lost focus
        if (HH._isOwnQuery && !gURLBar.mIgnoreFocus && e.originalTarget == gURLBar.mInputField) {
			gURLBar.value = content.document.location;
			gBrowser.userTypedValue = null;
			HH.finishSearch();
        }
    },
	
	finishSearch: function() {
		this._isOwnQuery = false
		this.updateShaddowLink(null) //
		InstantFoxModule.currentQuery = null;
		if(this.timeout)
			this._timeout = clearTimeout(this._timeout)
	},
	
	onEnter: function(value){
		InstantFoxModule.previousQuery = InstantFoxModule.currentQuery	

		var tmp = this.doPreload(InstantFoxModule.currentQuery)
		gURLBar.value = tmp;
		gBrowser.userTypedValue = null;

		this.finishSearch()
		
		InstantFoxModule.currentQuery=null;

		gBrowser.selectedBrowser.focus();
	},
	
	openLoadedPageInNewTab: function(){
		var tab=gBrowser.mCurrentTab;
		var newTab = Cc['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore).duplicateTab(window, tab, -1);
		gBrowser.moveTabTo(tab,tab._tPos+1)
	},
	
}

//************************************************************************
// experimental options popup
HH.openOptionsPopup = function(p){
	while(p.hasChildNodes())
		p.removeChild(p.firstChild)
	var i = document.createElement('iframe')
	i.setAttribute('src','chrome://instantfox/content/options.xul')
	p.appendChild(i)
	i.contentWindow.close=HH.closeOptionsPopup
	i.width=250
	i.height=500
}

HH.closeOptionsPopup = function(p){
	p =p || document.getElementById('instantFox-options').firstChild
	p.hidePopup()
}

//************************************************************************
window.addEventListener('load', instantFoxLoad, true);
//window.addEventListener('unload', instantFoxUnload, true);

//})();

// modify URLBarSetURI defined in browser.js
function URLBarSetURI(aURI) {
	// var HH = InstantFox.HH;
	// auri is null if URLBarSetURI is called from urlbar.handleRevert
	if (HH._isOwnQuery) {
		if (InstantFoxModule.currentQuery.tabId == HH._ctabID){
			return;
		} else { //hide shadow if user switched tabs
			HH.finishSearch();
		}
	}
    var value = gBrowser.userTypedValue;
    var valid = false;
    if (value == null) {
        let uri = aURI || getWebNavigation().currentURI;
        if (gInitialPages.indexOf(uri.spec) != -1) {
            value = content.opener ? uri.spec : "";
        } else {
            value = losslessDecodeURI(uri);
        }
        valid = uri.spec != "about:blank";
		// do not allow "about:blank"
		if(!valid) value = '';
    }
    gURLBar.value = value;
    SetPageProxyState(valid ? "valid" : "invalid");
}

/*********************************************************
 * contextMenu
 *******/
nsContextMenu.prototype.getSelectedText = function() {
	var selectedText = getBrowserSelection();

    if (selectedText)
		return selectedText
	try{
		var editor = content.document.activeElement
			.QueryInterface(Ci.nsIDOMNSEditableElement).editor
	}catch(e){
		try{
			var editor = document.popupNode
				.QueryInterface(Ci.nsIDOMNSEditableElement).editor
		}catch(e){}
	}
	try{
		return editor.selection.toString()
	}catch(e){}
	return ''
}
nsContextMenu.prototype.isTextSelection = function() {
	var menu = document.getElementById("context-searchselect")

    var selectedText = this.getSelectedText()

	if (!selectedText){
		menu.hidden = true
		return false;
	}

    if (selectedText.length > 15)
      selectedText = selectedText.substr(0,15) + this.ellipsis;

    // Use the current engine if the search bar is visible, the default
    // engine otherwise.
    var engine = Services.search[isElementVisible(BrowserSearch.searchBar)?
												"currentEngine": "defaultEngine"];

    // format "Search <engine> for <selection>" string to show in menu
    var menuLabel = gNavigatorBundle.getFormattedString("contextMenuSearchText",
                                                        [engine.name, selectedText]);
	if(menu){
		menu.label = menuLabel;
		menu.image = engine.iconURI.spec
		menu.item.setAttribute('name', engine.name)
		menu.accessKey = gNavigatorBundle.getString("contextMenuSearchText.accesskey");
		menu.hidden = false
	}

    return true;
}
nsContextMenu.prototype.fillSearchSubmenu=function(popup){
	var menu
	while(menu = popup.firstChild)
		popup.removeChild(menu)
	Services.search.getVisibleEngines().forEach(function(engine){
		menu = document.createElement('menuitem')
		menu.setAttribute('name', engine.name)
		menu.setAttribute('label', engine.name)
		menu.setAttribute('image', engine.iconURI.spec)
		menu.setAttribute('class', "menuitem-iconic")
		popup.appendChild(menu)
	})
}
nsContextMenu.prototype.doSearch=function(e){
	var name = e.originalTarget.getAttribute('name')
	if(!name)
		return
	var selectedText = this.getSelectedText()
	if(name == 'open as link')
		openLinkIn(selectedText, e.button!=0?"current":"tab", {relatedToCurrent: true});
    var engine = Services.search.getEngineByName(name);
    var submission = engine.getSubmission(selectedText);
    if (!submission) {
        return;
    }
    openLinkIn(submission.uri.spec, e.button!=0?"current":"tab", {postData: submission.postData, relatedToCurrent: true});
}

