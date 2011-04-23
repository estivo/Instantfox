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
	preprocessPlugins: function(){
		var localeRe=/%l(?:s|l|d)/g,
			domainRe = /:\/\/([^#?]*)/;
		function replacer(m) InstantFox.localeMap[m]
		
		for(var key in InstantFox.Shortcuts){
			var i = InstantFox.Shortcuts[key]
			var p = InstantFox.Plugins[i]
			if(!p)
				continue
			
			if(p.url){
				p.url = p.url.replace(localeRe, replacer)
				p.domain = p.url.match(domainRe)[1]
				p.key = key
			}
			
			if(p.json)
				p.json = p.json.replace(localeRe, replacer)
			else
				p.json = false
		}
		
	},
	
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
		var gotourl = false;
		if(resource.url){
			var gotourl = resource.url;//resource.url.replace('%q', query);
		}
		// may add additional replaces!
		return {'query': parsed.query, 'key':parsed.key, 'json':json, 'gotourl':gotourl};  
	  }else return false;
	},
	
	queryFromURL: function(){
		function escapeRegexp(text) {
			return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		}

		var url=gURLBar.value, match=false;
		for(var key in InstantFox.Shortcuts){
			var i = InstantFox.Shortcuts[key]
			var p = InstantFox.Plugins[i]
			if(p && p.url){
				if(url.indexOf(p.domain)!=-1){
					match=true;
					break;
				}
			}
		}
		if(!match)
			return '';

		var m = p.url.match(/(.[^&?#]*)%q(.?)/)
		var re = RegExp(escapeRexp(m[1])+'([^&]*)')
		var queryString = (url.match(re)||{})[1]
		
		return p.key + ' ' + decodeURIComponent(queryString);
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
      var src = resource.url.replace('%q', query);
      
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