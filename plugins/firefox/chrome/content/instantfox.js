(function() {
  const Prefs         = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
        StringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService),
        LocaleService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService),
        StringBundle  = StringService.createBundle("chrome://instantfox/locale/instantfox.properties", LocaleService.getApplicationLocale()),
        StateStop     = Components.interfaces.nsIWebProgressListener.STATE_STOP,
        I18n          = function(param) {
          return StringBundle.GetStringFromName(param);
        };
  
  Prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  
  var HH = {
    _url: {
      hash: 'http://search.instantfox.net/#',
      host: 'search.instantfox.net',
      intn: 'chrome://instantfox/locale/index.html'
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
      
      // hide autocomplete popup to prevent content from beeing overlapped
      HH._showAutoCompletePopup(false);
    },
    
    _init: function() {
      var _prefVersion = 'extensions.' + InstantFox._name + '.version';
      
      if (Prefs.getCharPref(_prefVersion) != InstantFox._version) {
          // open Locale Index and Help Document
          content.document.location = HH._url.intn;
          // set new Version
          Prefs.setCharPref(_prefVersion, InstantFox._version);
       }
    },
    
    _focusPermission: function(access) {
      var permission = (access ? 'allAccess' : 'noAccess');
      Prefs.setCharPref('capability.policy.default.HTMLInputElement.focus',   permission);
      Prefs.setCharPref('capability.policy.default.HTMLAnchorElement.focus',  permission);
    },
    
    _showAutoCompletePopup: function(display) {
      Prefs.setBoolPref('browser.urlbar.autocomplete.enabled', !!display);
    },
    
    _observeURLBar: function() {
      gURLBar.addEventListener('blur', function() {
        // Return power to Site
        if (HH._isOwnQuery) {
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
    
    // Assuming that a space in the trimmed Urlbar indicates a InstantFox call
    _isQuery: function() {
      if (gURLBar.value.length < 3) return false;
      return (gURLBar.value.replace(/^\s+|\s+$/g, '').search(' ') > -1);
    }
  };
  
  var bindings = function(event) {
    // tell InstantFox which internationalization & URLBar to use
    InstantFox._i18n = I18n;
    
    gBrowser.addProgressListener(HH._observe, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
    
    // Prevent pressing enter from performing it's default behaviour
    var _keydown = function(event) {
      if (HH._isQuery() && (event.keyCode ? event.keyCode : event.which) == 13) {
        event.preventDefault();
      }
    };
    
    // Perform query if space was detected
    var _input = function(event) {
      HH._location = gURLBar.value;
      
      if (HH._isQuery()) {
        HH._observeURLBar();
        HH._query(gURLBar.value, event);
      }
      // show autocomplete popup when not InstantFox!
      else HH._showAutoCompletePopup(true);
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
  
  window.addEventListener('load', bindings, true);
  
})();