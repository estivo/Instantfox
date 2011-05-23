//(function() {
var InFoxPrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

InFoxPrefs.QueryInterface(Ci.nsIPrefBranch2);

InstantFox = {
	get _ctabID() gBrowser.mCurrentTab.linkedPanel,
	_blankShaddow: function(){	
		if(!InstantFox.current_shaddow) return false; 		// not needed already blank!
		InstantFox.current_shaddow = '';
		XULBrowserWindow.InsertShaddowLink('','');
	},
	onEnter: function(value){
		HH._url.abort=true;
		//InstantFox.Plugins[InstantfoxHH._url.actp]; // improve it later!
	  
		var tmp = InstantFox.query(value);
	  	  
		if(content.document.location.href != tmp['loc']){
			this.loadPage(tmp['loc'])
			HH._url.hist_last = tmp['loc'];
			//content.document.location.assign(tmp['loc']);
		}
		gURLBar.value = tmp['loc'];
		gBrowser.userTypedValue = null;
	  
		HH._blankShaddow();
		HH._isOwnQuery  = false;
		HH._focusPermission(true);
	
		gBrowser.selectedBrowser.focus();		
	}
}
	

XULBrowserWindow.InsertShaddowLink = function (shaddow2dsp, query) {	
	if (gURLBar) {
		if(shaddow2dsp != '' && shaddow2dsp != query){
			gURLBar.InsertSpacerLink(gURLBar.value);
			var tmpshaddow = '';
			
			if(shaddow2dsp.toLowerCase().indexOf(query.toLowerCase()) == 0){
				// continue typing current keyword remove typed chars!
				if(query.length != shaddow2dsp.length){
					tmpshaddow = shaddow2dsp.substr(query.length, shaddow2dsp.length);
				}else{
					tmpshaddow = '';
				}
				InstantFox.right_shaddow = tmpshaddow;
				gURLBar.InsertShaddowLink(tmpshaddow);
			}else{
				// keyword is new
				InstantFox.right_shaddow = '';
				gURLBar.InsertShaddowLink('');
				//gURLBar.InsertShaddowLink(url);
			}
		}else{
			InstantFox.right_shaddow = '';
			gURLBar.InsertSpacerLink('');
			gURLBar.InsertShaddowLink('');
		}
	}
}
  


var HH = {
    _isOwnQuery: false,
    
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
	
	_goto4comp: function(url2go) {
		if(!this._url.seralw){
			if (HH._timeout) window.clearTimeout(HH._timeout);
			// add belong2tab check!
			HH._isOwnQuery = true;
			this.loadPage(url2go)
			HH._url.hist_last = url2go;
			//content.document.location.assign(url2go);
		}
		return true;
	},
	
	loadPage: function(url2go){
		// see load_flags at http://
		if(HH._overwriteHist()){
			getWebNavigation().loadURI(url2go, (nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY | nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY), null, null, null);
			//content.location.replace(url2go);
		}else{
			getWebNavigation().loadURI(url2go, (nsIWebNavigation.LOAD_FLAGS_NONE), null, null, null);
			//content.location.assign(url2go);
		}
	},
    
    _init: function() {
      /*if(!HH._os.set){
	    if(HH._os.name == 'Darwin'){ // MAC style adjustments returned Darwin
		  XULBrowserWindow.InsertShaddowStyle("-2px 0 0 0");
		  XULBrowserWindow.InsertShaddowStyleStart("1px");
	    }
	  }
	  HH._os.set = true;
	  // execute it only once browser sttarts
	  
	  /*
	  var _prefVersion = 'extensions.' + InstantFox._name + '.version';
      if (InFoxPrefs.getCharPref(_prefVersion) != InstantFox._version) {
          // open Locale Index and Help Document
          content.document.location = HH._url.intn;
          // set new Version
          InFoxPrefs.setCharPref(_prefVersion, InstantFox._version);
       }
	   */
    },
    	
    _observeURLBar: function() {
      
    },
    
    // The current content-window-location is the InstantFox Output-Site
    _isInstantFox: function(loc) {
      loc = loc || content.document.location;
      try { return loc.hostname ? loc.hostname.search(HH._url.host) > -1 : false; }
      catch(ex) { return false; }
    },
    
	
	
    // Assuming that a space in the trimmed Urlbar indicates a InstantFox call
    _isQuery: function() {
      if (gURLBar.value.length < 3){
	    this._blankShaddow();
		return false;
	  }
	  // match keywords here!
      var found = false;
	  for(var plugin in  InstantFox.Shortcuts) {
      	if(gURLBar.value.indexOf(plugin+' ') == 0){
			found = plugin; // set Shortkey
			this._url.actp = plugin;
			break;
		}
      }
	  if(!found){
	  	this._blankShaddow('','');
		return false;
	  }
	  
	  var query = gURLBar.value.substr((plugin.length+1),gURLBar.value.length); // plugin.length Shortkey + Space => length to cut off
	  XULBrowserWindow.InsertShaddowLink(InstantFox.current_shaddow,query);
	  
	  return true; //(gURLBar.value.replace(/^\s+|\s+$/g, '').search(' ') > -1);
    },
	

};
HH.openOptionsPopup = function(p){
	while(p.hasChildNodes())
		p.removeChild(p.firstChild)
	var i = document.createElement('iframe')
	i.setAttribute('src','chrome://instantfox/content/options.xul')
	p.appendChild(i)
	i.contentWindow.close=HH.closeOptionsPopup
	i.width=500
	i.height=500
}

HH.closeOptionsPopup = function(p){
	p =p || document.getElementById('instantFox-options').firstChild
	p.hidePopup()
}

  
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
	gURLBar.addEventListener('blur', function(e) {
		// Return power to Site if urlbar really lost focus
        if (HH._isOwnQuery && !gURLBar.mIgnoreFocus && e.originalTarget == gURLBar.mInputField) {
			InstantFox._blankShaddow();
			gURLBar.value = content.document.location;
			gBrowser.userTypedValue = null;
			HH._isOwnQuery = false;
        }
    }, false);

}
  
var instantFoxUnload = function(event) {
	//dump('---***---',arguments.callee.caller)
	// todo: better cleanup
	//gURLBar.removeEventListener('keydown', _keydown, false);
	//gURLBar.removeEventListener('input', _input, false);	
}
    
// Prevent pressing enter from performing it's default behaviour
var _keydown = function(event) {return
	HH._url.abort=false;
	var key = event.keyCode ? event.keyCode : event.which,
		alt = event.altKey, meta = event.metaKey, ctrl = event.ctrlKey, shift = event.shiftKey;
	if(HH._isQuery()){
		if (key == 9 || (!ctrl && !shift && key == 39)) { // 9 == Tab 
			if(InstantFox.right_shaddow != ''){
				gURLBar.value += InstantFox.right_shaddow;
				InstantFox.right_shaddow = '';
				//gURLBar.controller.handleText(true)
				_input()
				HH._url.abort=true;
				event.preventDefault();
			}
		} else if (key == 39 && ctrl && !shift) { // 39 == RIGHT
			if(InstantFox.right_shaddow != '' && gURLBar.selectionEnd==gURLBar.value.length){
				/* window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils)
					.sendNativeKeyEvent(0, 0, 0, InstantFox.right_shaddow[0], ''); */			
				gURLBar.value += InstantFox.right_shaddow[0]
				gURLBar.controller.handleText(true)
				_input()
				event.preventDefault();
			}
		} else if (key == 13 && !alt && !meta && !ctrl) { // 13 == ENTER
			HH.onEnter(gURLBar.value)
			event.preventDefault();
		} 
	}
	if(key == 32 && ctrl) { // 32 == SPACE
		var origVal = gURLBar.value, simulateInput
		var keyIndex = origVal.indexOf(' ')
		var key=origVal.substring(0,keyIndex)
	
		if(key in InstantFox.Shortcuts){
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
			var val = InstantFox.queryFromURL(origVal)
			if(val){
				gURLBar.value = val		
			}else{
				gURLBar.selectionStart = 0
				gURLBar.selectionEnd = origVal.length
			}
		}
		
		if(simulateInput){
			gURLBar.controller.handleText(true)
			_input()
			event.preventDefault();	
		}
	}
};

// Perform query if space was detected
var _input = function(event) {
	var val = gURLBar.value;
	gBrowser.userTypedValue = val;

	var q	
	if (q = HH.getQuery(val, InstantFoxModule.currentQuery)) {
		InstantFoxModule.currentQuery = q;
	} else if (InstantFoxModule.currentQuery) {
		InstantFoxModule.currentQuery = null;
		InstantFox._blankShaddow();
	}
};
 
HH = {
	getQuery: function(val, oldQ){
		var i = val.indexOf(' ');
		if (i == -1)
			return false
		
		var plugin = InstantFoxModule.Shortcuts[val.substr(0, i)]
		if (!plugin)
			return
		plugin = InstantFoxModule.Plugins[plugin]
		if (oldQ) {
			oldQ.plugin = plugin
			oldQ.query = val.substr(i)
			oldQ.value = val			
			return oldQ
		}

		return {
			plugin: plugin,
			query: val.substr(i),
			value: val,
			browserText: nsContextMenu.prototype.getSelectedText().substr(0, 50),
			tabId: gBrowser.mCurrentTab.linkedPanel
		}
	}

}

 
window.addEventListener('load', instantFoxLoad, true);
//window.addEventListener('unload', instantFoxUnload, true);

//})();

// modify URLBarSetURI defined in browser.js
function URLBarSetURI(aURI) {
	var HH = InstantFox.HH;
	// auri is null if URLBarSetURI is called from urlbar.handleRevert
	if (HH._isOwnQuery) {
		if (aURI && HH._url._ctabID == HH._ctabID){
			return;
		} else { //hide shadow if user switched tabs
			HH._blankShaddow();
			HH._isOwnQuery  = false;
			HH._focusPermission(true);
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

