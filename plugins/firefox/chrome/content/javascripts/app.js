var ExtClass = function(parent){  
  var result = function() {};

  result.fn = result.prototype;

  result.extend = function(obj){
    var extended = obj.extended;
    for(var i in obj){
      result[i] = obj[i];
    }
    if (extended) extended(result);
  };
  
  result.fn._class = result;

  return result;
};

/**
 * Actual InstantFox App ..
 * .. parses URLBar Input Value and calls matching Plugin
 */

InstantFox = new ExtClass;

//(function() {
  InstantFox.extend({
    _name:    'instantfox',
    _version: '1.0.3',
    _xul:     'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
    _i18n:    undefined,
	
	// used to handle shaddow "caching"
	current_shaddow: '',
	right_shaddow:   '',
	/*
		right_shaddow hint:
		only grey letters e.g
		g t: 
			current_shaddow = test
			right_shaddow = est
    */
	
	query4comp: function(){
	  // this query is executed by component
	  
	  var q			= gURLBar.value;
	  var parsed    = this.parse(q.trimLeft());
      var shortcut  = this.Shortcuts[parsed.key];
	  
	  if (parsed.key && parsed.query && shortcut) {
		var resource = InstantFox.Plugins[shortcut];
						

		if(resource.json){
			var json	 = resource.json.replace('%q', encodeURIComponent(parsed.query));
		}
		
		var gotourl = resource.url;//resource.url.replace('%q', query), self = this;
      	gotourl = gotourl.replace('%ll', this._i18n('locale.long'))
      	                 .replace('%ls', this._i18n('locale.short'))
      	                 .replace('%ld', this._i18n('locale.domain'));
			
		// may add additional replaces!
		return {'query': parsed.query, 'key':parsed.key, 'json':json, 'gotourl':gotourl};  
	  }else return false;
	},
	
	queryFromURL: function(){
		// todo: find a plugin key by url, for FS#79
		var gotourl = InstantFox.Plugins.googleFrame.url;
      	gotourl = gotourl.replace('%ll', this._i18n('locale.long'))
      	                 .replace('%ls', this._i18n('locale.short'))
      	                 .replace('%ld', this._i18n('locale.domain'));
		var i = gotourl.indexOf('%q')
		var queryString = gURLBar.value.slice(i, -gotourl.length+i+2)

		
		return 'g '+decodeURIComponent(queryString);
	},

	
    query: function(q, event) {
      // Stip Whitespaces from Query
      var parsed    = this.parse(q.toString().trimLeft());
      var shortcut  = this.Shortcuts[parsed.key];
	 
	  // Set in InstantFox_Vars for Component!
	  
      if (parsed.key && parsed.query && shortcut) {
        var resource = InstantFox.Plugins[shortcut];

        // Either call Plugin Script ..
        if (resource.script) {
          return resource.script(parsed.query);
        // .. or load location
        } else {
          return InstantFox.perform(resource, encodeURIComponent(parsed.query));
        }
      }
      
      return { loc: this._name, id: false };
    },
    
    parse: function(q) {
      // We assume that the sting before the space indicates a InstantFox-Plugin
      var index = q.indexOf(' ');
      return { key: q.substr(0, index), query: q.substr(index+1, q.length), keyindex: index, keylength: q.length };
    },
	
    // No Plugin-Script found, load given location
    perform: function(resource, query) {
      var src = resource.url.replace('%q', query), self = this;
      src = src.replace('%ll', this._i18n('locale.long'));
      src = src.replace('%ls', this._i18n('locale.short'));
      src = src.replace('%ld', this._i18n('locale.domain'));
      
      return { loc: src, id: false };
    },
  
    content: function(c) {
      content.document.getElementById('container').innerHTML = c;
    },
    
    title: function(t) {
      content.document.title = t + ' | InstantFox';
    },
  
    suggest: function() {
      // @TODO: Enable Suggestion Feature
      // document.getElementById("InstantFoxList").showPopup(gURLBar, -1, -1, "popup", "bottomleft", "topleft");
    },
    
    log: function(msg) {
      if(typeof Firebug != 'undefined') {
        Firebug.Console.log(msg);
      } else {
        Components.utils.reportError(msg);
      }
      return msg;
    }
  });
//})();

InstantFox.Plugins = new ExtClass;