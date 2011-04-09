//(function() {
  const InFoxPrefs    = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
        StringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService),
        LocaleService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService),
        StringBundle  = StringService.createBundle("chrome://instantfox/locale/instantfox.properties", LocaleService.getApplicationLocale()),
        I18n          = function(param) {
          return StringBundle.GetStringFromName(param);
        };

  InFoxPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  
	function print_r(x, max, sep, l) {
	
		l = l || 0;
		max = max || 10;
		sep = sep || ' ';
	
		if (l > max) {
			return "[WARNING: Too much recursion]\n";
		}
	
		var
			i,
			r = '',
			t = typeof x,
			tab = '';
	
		if (x === null) {
			r += "(null)\n";
		} else if (t == 'object') {
	
			l++;
	
			for (i = 0; i < l; i++) {
				tab += sep;
			}
	
			if (x && x.length) {
				t = 'array';
			}
	
			r += '(' + t + ") :\n";
	
			for (i in x) {
				try {
					r += tab + '[' + i + '] : ' + print_r(x[i], max, sep, (l + 1));
				} catch(e) {
					return "[ERROR: " + e + "]\n";
				}
			}
	
		} else {
	
			if (t == 'string') {
				if (x == '') {
					x = '(empty)';
				}
			}
	
			r += '(' + t + ') ' + x + "\n";
	
		}
	
		return r;
	
	};

  function debug(aMessage) {

		try {
			var objects = [];
			objects.push.apply(objects, arguments);
			Firebug.Console.logFormatted(objects,
			TabWatcher.getContextByWindow
			(content.document.defaultView.wrappedJSObject));
		}
		catch (e) {
		}
			
						var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService
			(Components.interfaces.nsIConsoleService);
						if (aMessage === "") consoleService.logStringMessage("(empty string)");
						else if (aMessage != null) consoleService.logStringMessage(aMessage.toString());
						else consoleService.logStringMessage("null");
  }
  XULBrowserWindow.InsertShaddowLink = function (b2tab, shaddow2dsp, query) { // b2tab = belong to tab
	// InstantFox._tab_status[b2tab]['right_shaddow']
	if(!HH._belong2tab(b2tab) && shaddow2dsp != ''){
		return false; // result is not for this tab!
	}
	if (gURLBar) {
		//debug(print_r(InstantFox._tab_status));
		if(shaddow2dsp != null && shaddow2dsp != '' && shaddow2dsp != query){
			gURLBar.InsertSpacerLink(gURLBar.value);
			var tmpshaddow = '';
			
			if(shaddow2dsp.toLowerCase().indexOf(query.toLowerCase()) == 0){
				// continue typing current keyword remove typed chars!
				if(query.length != shaddow2dsp.length){
					tmpshaddow = shaddow2dsp.substr(query.length, shaddow2dsp.length);
				}else{
					tmpshaddow = '';
				}
				//InstantFox.right_shaddow = tmpshaddow;
				InstantFox._tab_status[b2tab]['right_shaddow'] = tmpshaddow;
				gURLBar.InsertShaddowLink(tmpshaddow);
			}else{
				// keyword is new
				//InstantFox.right_shaddow = '';
				InstantFox._tab_status[b2tab]['right_shaddow'] = '';
				gURLBar.InsertShaddowLink('');
				//gURLBar.InsertShaddowLink(url);
			}
		}else{
			//InstantFox.right_shaddow = '';
			InstantFox._tab_status[b2tab]['right_shaddow'] = '';
			gURLBar.InsertSpacerLink('');
			gURLBar.InsertShaddowLink('');
		}
	}
  }
  var HH = {
	  
    _url: {
      hash: 'http://search.instantfox.net/#',
      host: 'search.instantfox.net',
      intn: 'chrome://instantfox/locale/index.html',
	  actp: '', // current shortcut in use
	  seralw: false, // search always on every key up!
	  abort: '', // abort request because enter pressed
	  ctabID: '' // used for tab handeling
    },
    
	_ctabID: null,	
    _isOwnQuery: false,

    // -- Helper Methods --
 
   	_tabSelect: function(event) {
	  //this._url.ctabID = gBrowser.mCurrentTab.linkedPanel;
	  //HH._url.ctabID = gBrowser.mCurrentTab.linkedPanel;
	  debug(HH._url.ctabID);
	  //debug( this._url.ctabID);
	  /*
	  var browser = gBrowser.selectedBrowser;
	  debug("TabSelect");
	  debug("TabID:");
	  debug(gBrowser.mCurrentTab.linkedPanel);
	  debug(gBrowser.getBrowserIndexForDocument(gBrowser.contentDocument));
	  var tabid = gBrowser.getBrowserIndexForDocument(gBrowser.contentDocument);
	  */
    },

    _belong2tab: function(tab2check) {
	  //debug(tab2check);
	  //debug(gBrowser.mCurrentTab.linkedPanel);
	  if(tab2check !=  gBrowser.mCurrentTab.linkedPanel){
		//debug("Tabcheck failed!");
		return false; // result is not for this tab!
	  }else{
	    return true;
	  }
	},
	
	_query: function(query, event) {
      // Query used to replace gURLBar.value onLocationChange
      HH._q = query || gURLBar.value;
      HH._cursorPosition = gURLBar.selectionStart || HH._q.length;
      
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
		  if (HH._state.id != HH._oldState.id) {
            content.document.location.replace(_location);
          } else {
            content.document.location.assign(_location);
          }
		}
      }, 200, event);
      
	  
    },
	
	_goto4comp: function(b2tab,url2go) {
		if(!HH._belong2tab(b2tab)) return false; // result is not for this tab!

		if(!this._url.seralw){ // go to first suggest if instant is disabled
			content.document.location.assign(url2go);
		}
		return true;
	},
    
    _init: function() {
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
    
    _focusPermission: function(access) {
      var permission = (access ? 'allAccess' : 'noAccess');
      InFoxPrefs.setCharPref('capability.policy.default.HTMLInputElement.focus',   permission);
      InFoxPrefs.setCharPref('capability.policy.default.HTMLAnchorElement.focus',  permission);
    },
    
	_showAutoCompletePopup: function(display) {
      InFoxPrefs.setBoolPref('browser.urlbar.autocomplete.enabled', !!display);
    },
	
    _observeURLBar: function() {
      gURLBar.addEventListener('blur', function() {
		//debug("blur event");
		// Return power to Site
		if (HH._isOwnQuery) {
			var taburl = gBrowser.selectedBrowser.currentURI.spec;
			if(taburl == 'about:blank'){
				taburl = '';
			}
			
			if(!HH._belong2tab(HH._url.ctabID)){
				debug("here");
				gURLBar.value = taburl;
				gBrowser.mCurrentBrowser.userTypedValue = taburl;
				
				InstantFox._tab_status[HH._url.ctabID]['urlbar_value'] = taburl;	
				HH._blankShaddow(gBrowser.mCurrentTab.linkedPanel);
			}else{
				// connect with tabs event listener!
				gURLBar.value   = content.document.location;
				gBrowser.mCurrentBrowser.userTypedValue =  content.document.location
				HH._blankShaddow(gBrowser.mCurrentTab.linkedPanel);
				HH._isOwnQuery  = false;
				HH._focusPermission(true);
			}
		}
      }, false);
    },
    
    _observe: {
      QueryInterface: function(aIID) {
       if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
           aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
           aIID.equals(Components.interfaces.nsISupports))
         return this;
       throw Components.results.NS_NOINTERFACE;
      },
      
      onLocationChange: function(a, b, c) {
        // replace location in URLBar with InstantFox-Query (if InstantFox)
		if (HH._isOwnQuery) {
          gURLBar.value = HH._location;
          gURLBar.setSelectionRange(HH._cursorPosition || HH._location.length, HH._cursorPosition || HH._location.length);
        }
      },
      
      onStateChange: function(aWebProgress, aRequest, aStatus, aMessage) {//function(a, b, flag, d) {
		if (aStatus & Components.interfaces.nsIWebProgressListener.STATE_START){//if (flag && StateStop) {
		  if (HH._isOwnQuery) {
			gURLBar.value = HH._location;
			gURLBar.setSelectionRange(HH._cursorPosition || HH._location.length, HH._cursorPosition || HH._location.length);
		  }
		}
		if (aStatus & Components.interfaces.nsIWebProgressListener.STATE_STOP){//if (flag && StateStop) {
          // on load
          if (HH._isInstantFox() && HH._state.id && HH._state.id != HH._oldState.id) {
            // Got a query hash - perform it ONCE on page load!
			if(content.document.location.hash.substr(1)) InstantFox.query(content.document.location.hash.substr(1));
          }
        }
      },
      
      onProgressChange: function(a, b, c, d, e, f) {},
      onStatusChange: function(a, b, c, d) {},
      onSecurityChange: function(a, b, c) {}
    },
    
    // The current content-window-location is the InstantFox Output-Site
    _isInstantFox: function(loc) {
      loc = loc || content.document.location;
      try { return loc.hostname ? loc.hostname.search(HH._url.host) > -1 : false; }
      catch(ex) { return false; }
    },
    
	_blankShaddow: function(tabID){
	  if(!InstantFox._tab_status[tabID] || typeof(InstantFox._tab_status[tabID]) === 'undefined'){
		InstantFox._tab_status[tabID] = new Array();
	  }
	  if(InstantFox._tab_status[tabID]['current_shaddow'] == '') return false;  
	  InstantFox._tab_status[tabID]['current_shaddow'] = '';
	  InstantFox._tab_status[tabID]['right_shaddow'] = '';
 	  //if(!InstantFox.current_shaddow) return false; 		// not needed already blank!
	  //InstantFox.current_shaddow = '';
	  //XULBrowserWindow.InsertShaddowLink('','');
	  
	  XULBrowserWindow.InsertShaddowLink(tabID,'','');
	},
	
    // Assuming that a space in the trimmed Urlbar indicates a InstantFox call
    _isQuery: function() {
	  this._url.ctabID =  gBrowser.mCurrentTab.linkedPanel;
	  if(!InstantFox._tab_status[this._url.ctabID] || typeof(InstantFox._tab_status[this._url.ctabID]) === 'undefined'){
		InstantFox._tab_status[this._url.ctabID] = new Array();
	  }  
	  
	  if (gURLBar.value.length < 3){
	    this._blankShaddow(this._url.ctabID);
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
	  	this._blankShaddow(this._url.ctabID);
		return false;
	  }
	  
	  
	  var query = gURLBar.value.substr((plugin.length+1),gURLBar.value.length); // plugin.length Shortkey + Space => length to cut off
	  //XULBrowserWindow.InsertShaddowLink(InstantFox.current_shaddow,query);
	  //debug(this._url.ctabID);
	  //debug(InstantFox._tab_status[this._url.ctabID]['current_shaddow']);
	  //debug(query);
	  XULBrowserWindow.InsertShaddowLink(this._url.ctabID,InstantFox._tab_status[this._url.ctabID]['current_shaddow'],query);
	  
	  return true;
	 // return (gURLBar.value.replace(/^\s+|\s+$/g, '').search(' ') > -1);
    }
  };
  /*
  function InstantFox_BarClick(){
	HH._url.clickres = true;
	//content.document.location = gURLBar.value;
	return true;
  }
  */
  var bindings = function(event) {
	// setup URLBar for components
	gURLBar.setAttribute('autocompletesearch',	'instantFoxAutoComplete');
	//gURLBar.setAttribute('onclick',				'InstantFox_BarClick();' + gURLBar.getAttribute('oninput'));
    // tell InstantFox which internationalization & URLBar to use
    InstantFox._i18n = I18n;
    
    gBrowser.addProgressListener(HH._observe, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
    
    // Prevent pressing enter from performing it's default behaviour
    var _keydown = function(event) {
 	  HH._url.abort=false;
	  if(HH._isQuery()){
        if ((event.keyCode ? event.keyCode : event.which) == 9) { // 9 == Tab
          if(InstantFox._tab_status[HH._url.ctabID]['right_shaddow'] != ''){//if(InstantFox.right_shaddow != ''){
		    gURLBar.value += InstantFox._tab_status[HH._url.ctabID]['right_shaddow'];//InstantFox.right_shaddow;
		    InstantFox._tab_status[HH._url.ctabID]['right_shaddow'] = '';//InstantFox.right_shaddow = '';
		  }
		  HH._url.abort=true;
		  event.preventDefault();
	    }
		
	    if (HH._isQuery() && (event.keyCode ? event.keyCode : event.which) == 13) { // 13 == ENTER
		  HH._url.abort=true;
		  //InstantFox.Plugins[InstantfoxHH._url.actp]; // improve it later!
		  
		  var tmp = InstantFox.query(gURLBar.value,event);
		  //content.document.location.assign(tmp['loc']);
		  
		  gURLBar.value = tmp['loc'];		
		  
		  if(content.document.location.href != tmp['loc']){
            content.document.location.assign(tmp['loc']);
			gBrowser.mCurrentBrowser.userTypedValue = tmp['loc'];
		  }
          event.preventDefault();
		  gURLBar.value = tmp['loc'];		

		  
	      HH._blankShaddow(HH._url.ctabID);
          HH._isOwnQuery  = false;
          HH._focusPermission(true);
		
		  gBrowser.selectedBrowser.focus();	
		  //gBrowser.selectedBrowser.focus();		
		  //gBrowser.mCurrentBrowser.focus();
		 //content.document.defaultView.focus();

        }
	  }
	  
    };
    
    // Perform query if space was detected
    var _input = function(event) {
      HH._url.abort=false;
	  HH._location = gURLBar.value;
      if (HH._isQuery()) {
        HH._observeURLBar();
        HH._query(gURLBar.value, event);
      }
      // show autocomplete popup when not InstantFox!
      else{
		  /*
		  		Needed due to execution of HH._showAutoCompletePopup(false);
				in app.js (query4comp) <- called by componente!
		  */
		  
		  HH._showAutoCompletePopup(true);
	  }
    };
    // Bind Events to URLBar
    switch(event.type) {
      case 'load':
        gURLBar.addEventListener('keydown', _keydown, false);
        gURLBar.addEventListener('input', _input, false);
		//gBrowser.tabContainer.addEventListener("TabSelect", HH._tabSelect, false);
        break;
        
      case 'unload':
	  	gURLBar.removeEventListener('keydown', _keydown, false);
		gURLBar.removeEventListener('input', _input, false);
		//gBrowser.tabContainer.removeEventListener("TabSelect", HH._tabSelect, false);
        break;
    }
    
    // init plugins
    gBrowser.addEventListener("load", function(event) {
      if (event.originalTarget instanceof HTMLDocument) {
        for(var plugin in InstantFox.Plugins) {
          try { InstantFox.Plugins[plugin].init(event.originalTarget.defaultView.wrappedJSObject); }
          catch(ex) {}
        }
      }
    }, true);
    HH._init();
  };
  

  
  // change the loader don't think that it would be supported in every version if you do it that way!
  window.addEventListener('load', bindings, true);
  window.addEventListener('unload', bindings, true);
  gBrowser.tabContainer.addEventListener("TabSelect", HH._tabSelect, false);
  
  
  /*
  
  var observerService = Components.classes["@mozilla.org/observer-service;1"]
                          .getService(Components.interfaces.nsIObserverService);
  var uninstallObserver = {
    observe: function observe(subject, topic, data) {
	  if (topic == "em-action-requested") {
		subject.QueryInterface(Components.interfaces.nsIUpdateItem);

		if (subject.id == "activities@kaply.com") {
		  alert(data);
		  if (data == "item-uninstalled") {
		  }
		}
	  }
    }
  }



   observerService.addObserver(uninstallObserver, "em-action-requested", false);  
 	*/
 /*
 
	InFoxPrefs.clearUserPref('browser.urlbar.autocomplete.enabled');
    InFoxPrefs.clearUserPref('capability.policy.default.HTMLInputElement.focus');
   	InFoxPrefs.clearUserPref('capability.policy.default.HTMLAnchorElement.focus');

  */
//})();