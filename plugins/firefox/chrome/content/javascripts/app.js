var HHExtClass = function(parent){  
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

InstantFox = new HHExtClass;

//(function() {
  InstantFox.extend({
    _name:    'instantfox',
    _version: '1.0.3',
    _xul:     'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
    _i18n:    undefined,
	
	// used to handle shaddow "caching"
	current_shaddow: '',
	right_shaddow:   '',
	previous_query:	 false,
	/*
		right_shaddow hint:
		only grey letters e.g
		g t: 
			current_shaddow = test
			right_shaddow = est
    */
	preprocessPlugins: function(){
      	this.localeMap = {
				'%ll': this._i18n('locale.long'),
      			'%ls': this._i18n('locale.short'),
      			'%ld': this._i18n('locale.domain')
			};
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
				p.name = i 
				p.id = i
			}
			
			if(p.json)
				p.json = p.json.replace(localeRe, replacer)
			else
				p.json = false
		}
		
	},
	
	imdburl: function(url2tidy){
		//if (url2tidy.length > 20) url2tidy = url2tidy.substr(0, 20);
		url2tidy = url2tidy.replace(/^\s*/, "").replace(/[ ]+/g, "_");
		url2tidy = url2tidy.replace(/[\u00e0\u00c0\u00e1\u00c1\u00e2\u00c2\u00e3\u00c3\u00e4\u00c4\u00e5\u00c5\u00e6\u00c6]/g, "a").replace(/[\u00e7\u00c7]/g, "c").replace(/[\u00e8\u00c8\u00e9\u00c9\u00ea\u00ca\u00eb\u00cb]/g, "e").replace(/[\u00ec\u00cd\u00ed\u00cd\u00ee\u00ce\u00ef\u00cf]/g, "i").replace(/[\u00f0\u00d0]/g, "d").replace(/[\u00f1\u00d1]/g, "n").replace(/[\u00f2\u00d2\u00f3\u00d3\u00f4\u00d4\u00f5\u00d5\u00f6\u00d6\u00f8\u00d8]/g, "o").replace(/[\u00f9\u00d9\u00fa\u00da\u00fb\u00db\u00fc\u00dc]/g, "u").replace(/[\u00fd\u00dd\u00ff]/g, "y").replace(/[\u00fe\u00de]/g, "t").replace(/[\u00df]/g, "ss");
		return url2tidy = url2tidy.replace(/[\W]/g, "")
	},
	
	query4comp: function(){
	  // this query is executed by component
	  
	  var q			= gURLBar.value;
	  var parsed    = this.parse(q.trimLeft());
      var shortcut  = this.Shortcuts[parsed.key];
	  var pq4use 	= this.previous_query;				 // pq = previous query 4 use 
	  // pq4use is used for handling imdb
	  
	  if (parsed.key && parsed.query && shortcut) {
		var resource = InstantFox.Plugins[shortcut];
						

		if(resource.json){
			// fq = first letter of query
			
			if(shortcut=="imdb"){
				var json	 = resource.json.replace('%q', this.imdburl(parsed.query.toLowerCase()));
				json = json.replace('%fq', this.imdburl(parsed.query.substr(0,1).toLowerCase()));
			}else{
				var json	 = resource.json.replace('%q', encodeURIComponent(parsed.query));
			}
		}
		var gotourl = false;
		if(resource.url){
			var gotourl = resource.url;//resource.url.replace('%q', query);
      		gotourl = gotourl.replace('%ll', this._i18n('locale.long'))
      		                 .replace('%ls', this._i18n('locale.short'))
      		                 .replace('%ld', this._i18n('locale.domain'));
		}
		this.previous_query = parsed.query;
		// may add additional replaces!
		return {'query': parsed.query, 'lastquery': pq4use, 'key':parsed.key, 'json':json, 'gotourl':gotourl};  
	  }else return false;
	},
	
	queryFromURL: function(url){
		if(!this.pluginsReady){
			this.preprocessPlugins();
			this.pluginsReady = true;
		}
		function escapeRegexp(text) {
			return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		}

		var match=false;
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
		if(!match){
			if(url.indexOf('.wikipedia.') > 0){
				var regexp=/\/([^\/#]*)(?:#|$)/
				p = InstantFox.Plugins.wikipedia
			}else if(url.indexOf('weather.instantfox.net') > 0){
				var regexp=/\/([^\/#]*)(?:#|$)/
				p = InstantFox.Plugins.weather
			}else 
				return null;
		}
		
		if(!regexp){
			var m = p.url.match(/(.[^&?#]*)%q(.?)/)
			regexp = RegExp(escapeRegexp(m[1])+'([^&]*)')
		}
		var queryString = (url.match(regexp)||{})[1]
		if(!queryString)
			return null;

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
      var src = resource.url.replace('%q', query), self = this;
      src = src.replace('%ll', this._i18n('locale.long'));
      src = src.replace('%ls', this._i18n('locale.short'));
      src = src.replace('%ld', this._i18n('locale.domain'));
      
      return { loc: src, id: false };
    },
    
    content: function(c) {
	  var container = content.document.getElementById('container');
	  if(!container){
		  // fixing of content.document.getElementById("container") is null
		  var div = content.document.createElement('div');
		  div.setAttribute("id", container);
		  div.innerHTML = c;
		  content.document.appendChild(div);
	  }else{
        content.document.getElementById('container').innerHTML = c;
	  }
	},
    
	attr_create: function(div_c, div_n, span_c, span_n){
	  var doc = content.document;//document.implementation.createDocument("", "", null);
	  var container = content.document.getElementById('container');  
	  if(container.firstChild) container.removeChild(container.firstChild);
  
	  var div = doc.createElement('div');
	  div.setAttribute("class", div_c);
	  div.appendChild( doc.createTextNode(div_n) );
	  //div.style.color = 'green';
	  
	  if(typeof span_c!='undefined'){
	  	var span = doc.createElement('span');
	    span.setAttribute("class", span_c);
	    span.appendChild( doc.createTextNode(span_n) );
		div.appendChild(span);
	  }
	  
	  container.appendChild(div);
	  
	},
	
	elem_create: function(tag, className, content){
	  var doc = content.document;//document.implementation.createDocument("", "", null);
  
	  var elem = doc.createElement(tag);
	  elem.setAttribute("class", className);
	  elem.appendChild( doc.createTextNode(content) );
	  //div.style.color = 'green';
	  
	  return elem;
	  
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

InstantFox.Plugins = new HHExtClass;