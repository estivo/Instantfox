//(function() {
  const InFoxPrefs    = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
        StringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService),
        LocaleService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService),
        StringBundle  = StringService.createBundle("chrome://instantfox/locale/instantfox.properties", LocaleService.getApplicationLocale()),
        StateStop     = Components.interfaces.nsIWebProgressListener.STATE_STOP,
        I18n          = function(param) {
          return StringBundle.GetStringFromName(param);
        };

  InFoxPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  
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
				gURLBar.InsertShaddowLink(tmpshaddow);
			}else{
				// keyword is new
				gURLBar.InsertShaddowLink('');
				//gURLBar.InsertShaddowLink(url);
			}
		}else{
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
	  actp: '' // current shortcut in use
    },
    
    _isOwnQuery: false,
    
    // -- Helper Methods --
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
        if (HH._state.id != HH._oldState.id) {
          content.document.location.replace(_location);
        } else {
          content.document.location.assign(_location);
        }
      }, 200, event);
      
	  
    },
    
    _init: function() {
      var _prefVersion = 'extensions.' + InstantFox._name + '.version';
      debug(_prefVersion);
      if (InFoxPrefs.getCharPref(_prefVersion) != InstantFox._version) {
          // open Locale Index and Help Document
          content.document.location = HH._url.intn;
          // set new Version
          InFoxPrefs.setCharPref(_prefVersion, InstantFox._version);
       }
    },
    
    _focusPermission: function(access) {
      var permission = (access ? 'allAccess' : 'noAccess');
      //InFoxPrefs.setCharPref('capability.policy.default.HTMLInputElement.focus',   permission);
      //InFoxPrefs.setCharPref('capability.policy.default.HTMLAnchorElement.focus',  permission);
    },
    
	_showAutoCompletePopup: function(display) {
      InFoxPrefs.setBoolPref('browser.urlbar.autocomplete.enabled', !!display);
    },
	
    _observeURLBar: function() {
      gURLBar.addEventListener('blur', function() {
		// Return power to Site
        if (HH._isOwnQuery) {
		  HH._blankShaddow();
          gURLBar.value   = content.document.location;
          HH._isOwnQuery  = false;
          HH._focusPermission(true);
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
      
      onStateChange: function(a, b, flag, d) {
        if (flag && StateStop) {
          // on load
          if (HH._isInstantFox() && HH._state.id && HH._state.id != HH._oldState.id) {
            // Got a query hash - perform it ONCE on page load!
            InstantFox.query(content.document.location.hash.substr(1));
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
    
	_blankShaddow: function(){	
	  if(!InstantFox.current_shaddow) return false; 		// not needed already blank!
	  InstantFox.current_shaddow = '';
	  XULBrowserWindow.InsertShaddowLink('','');
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
	  
	  return (gURLBar.value.replace(/^\s+|\s+$/g, '').search(' ') > -1);
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
      if (HH._isQuery() && (event.keyCode ? event.keyCode : event.which) == 13) {
		//InstantFox.Plugins[InstantfoxHH._url.actp]; // improve it later!
		
        event.preventDefault();

	    HH._blankShaddow();
        HH._isOwnQuery  = false;
        HH._focusPermission(true);
		var tmp = InstantFox.query(gURLBar.value,event);
		//content.document.location.assign(tmp['loc']);
        gURLBar.value = tmp['loc'];
      }
    };
    
    // Perform query if space was detected
    var _input = function(event) {
      HH._location = gURLBar.value;
	  debug("input");
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
        gURLBar.addEventListener('keydown', _keydown, true);
        gURLBar.addEventListener('input', _input, true);
        break;
        
      case 'unload':
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
  
//})();