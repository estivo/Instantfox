var Cc  = Components.classes;
var Ci  = Components.interfaces;
var Cr  = Components.results;
var Cu  = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

EXPORTED_SYMBOLS = ['InstantFoxModule'];

/**devel__(*********************************************/
function debug(aMessage) {
	try {
		var objects = [];
		objects.push.apply(objects, arguments);
		Firebug.Console.logFormatted(
			objects,
			TabWatcher.getContextByWindow(content.document.defaultView.wrappedJSObject)
		);
	}
	catch (e) {
	}

	var consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
	if (aMessage === "") consoleService.logStringMessage("(empty string)");
	else if (aMessage != null) consoleService.logStringMessage(aMessage.toString());
	else consoleService.logStringMessage("null");
}
function dump() {
	var aMessage = "aMessage: ";
	for (var i = 0; i < arguments.length; ++i) {
		var a = arguments[i];
		aMessage += (a && !a.toString ? "[object call]" : a) + " , ";
	}
	var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("" + aMessage);
}
try{
dump('old dump')
dump = Cu.import("resource://shadia/main.js").dump
dump('new dump')
}catch(e){}

/** devel__) **/
/*************************************************************************
 *    load and save customized plugins
 *    plugin={
 *        hideFromContextMenu:
 *        disableInstant:
 *        disableSuggest:
 *        disabled:
 *        key:
 *        url:
 *        json:
 *        domain:
 *        iconURI:
 *        type:
 *        name:
 *        id:
 *    }
 ***************/
// used for new plugins only
function fixupPlugin(p){
	if(p.url){
		p.domain = pluginLoader.extendedDomainFromURL(p.url)

		p.id = p.id.toLowerCase()
		p.iconURI = p.iconURI || getFavicon(p.url);

		if(!p.name){
			try{
				p.name = Services.io.newURI(p.url,null,null).host
			}catch(e){}
			p.name = p.name || p.id
		}
	}
	// try to find best matching json`  FS#156 - Wikipedia - Suggest Rules
	if(!p.json && p.domain){
		var jRe = p.domain.split(/[\/\.\?#]/)
		jRe.shift()
		jRe = jRe.filter(function(x)x)
		var ans = []
		for each(var plugin in InstantFoxModule.Plugins){
			if(!plugin.json)
				continue
			var match = 0, count = 0
			for each(var i in jRe){
				if(plugin.domain.indexOf(i)>0){
					match += i.length * i.length
					count++
				}
			}
			if(match >= 9)
				ans.push({match:match, D:plugin.domain, json:plugin.json})
		}
		ans.sort(function(a, b) b.match-a.match)

		if(ans[0])
			p.json = ans[0].json
	}
	// in case nothing better is found use google
	if(!p.json)
		p.json = InstantFoxModule.Plugins.google.json
}

var pluginLoader = {
	// properties with default values
	defPropNames: ['key','url','name','json'],

	addDefaultPlugins: function(pluginData){
		InstantFoxModule.selectedLocale = pluginData.localeMap['%ll']
		var newPlugins = {}, oldPlugins = InstantFoxModule.Plugins;
		for each(var p in pluginData.plugins){
			var id = p.id
			var mP = oldPlugins[id]
			//copy user modified values
			if(mP){
				// add properties
				['hideFromContextMenu', 'disableInstant',
					'disableSuggest', 'disabled'].forEach(function(n){
					if(n in mP)
						p[n] = mP[n]
				});
				// add this properties if user modified them
				this.defPropNames.forEach(function(propName){
					if(mP['def_'+propName] != null && mP['def_'+propName] != mP[propName])
						p[propName] = mP[propName]
				});
				// change iconURI to match url
				if(p.url != p.def_url)
					p.iconURI = getFavicon(p.url);
			}
			newPlugins[id] = p;
		}
		// remove default plugins from other locale
		for each(var p in oldPlugins) {
			if (newPlugins[p.id])
				continue
			if (p.type != 'default' || this.isUserModified(p))
				newPlugins[p.id] = p
		}
		
		InstantFoxModule.Plugins = newPlugins;
		
		InstantFoxModule.defaultPlugin = InstantFoxModule.defaultPlugin||'google'
		//---------
		var p = pluginData.autoSearch;

		if(!InstantFoxModule.autoSearch)
			InstantFoxModule.autoSearch = p

		InstantFoxModule.autoSearch.def_json = p.json
		InstantFoxModule.autoSearch.def_url = p.url
	},

	initShortcuts: function(){
		InstantFoxModule.Shortcuts = {}
		var conflicts={}

		for each (var  p in InstantFoxModule.Plugins) {
			if (p.url && p.key && !p.disabled) {
				var keys = p.key.split(/\s+/)
				for each (var k in keys) {
					if (!k)
						continue
						
					if (InstantFoxModule.Shortcuts[k])
						conflicts[InstantFoxModule.Plugins[InstantFoxModule.Shortcuts[k]].id] =
							conflicts[p.id] = true

					InstantFoxModule.Shortcuts[k] = p.id
				}
			}
		}

		InstantFoxModule.ShortcutConflicts = conflicts
	},

	addDefaultPluginData: function(pluginData){
		this.addDefaultPlugins(pluginData)
		// add data from browser search engines
		importBrowserPlugins(true)		
	},
	addFromUserString: function(jsonString){
		try{
			var pluginData = JSON.parse(jsonString)
		}catch(e){			
			return false
		}

		for each(var p in pluginData.plugins){
			var id = p.id
			var mP = InstantFoxModule.Plugins[id]
			if(mP && mP.key)
				p.key = mP.key
			InstantFoxModule.Plugins[id] = p;
		}
		// add data from browser search engines
		importBrowserPlugins(false)

		InstantFoxModule.selectedLocale = pluginData.selectedLocale
		InstantFoxModule.defaultPlugin = pluginData.defaultPlugin

		if(pluginData.autoSearch)
			InstantFoxModule.autoSearch = pluginData.autoSearch
		else 
			return false

		return true;
	},

	getPluginString: function(forUser){
		var ob={}
		for each(var p in InstantFoxModule.Plugins)
			if(p.url)
				ob[p.id] = this.cleanCopyPlugin(p, forUser)

		var pluginData = {
			selectedLocale: InstantFoxModule.selectedLocale,
			defaultPlugin: InstantFoxModule.defaultPlugin,
			autoSearch: InstantFoxModule.autoSearch,
			version: Services.prefs.getCharPref("extensions.instantfox.version"),
			plugins: ob
		}

		return JSON.stringify(pluginData, null, forUser?4:1)
	},
	savePlugins: function(){
		var js = this.getPluginString(false)

		writeToFile(getUserFile('instantFoxPlugins.js'), js)
	},
	loadPlugins: function(locale, callback){
		var file = getUserFile('instantFoxPlugins.js')
		if (!locale && file.exists()) {
			var spec = Services.io.newFileURI(file).spec
			var onload = [			
				(function(str){
					try{
						if(!this.addFromUserString(str))
							throw("error")
					}catch(e){
						// settings in user profile were corrupted, load default plugins
						this.loadPlugins(true)
					}
					delete this.req
				}).bind(this),
				this.initShortcuts.bind(this),
				callback
			];
			if(this.req)
				this.req.abort()
			this.req = fetchAsync(spec, onload)
			return
		}
		var defList = Cu.import("chrome://instantfox/content/defaultPluginList.js")
		
		if (typeof locale == "string")
			InstantFoxModule.selectedLocale = locale
		var data = defList.getData(InstantFoxModule)
		this.addDefaultPluginData(data)
		this.initShortcuts()
		
		callback && callback()
	},

	getAvaliableLocales: function(callback){
		// keep in sync with default plugin list
		var a = [
			"de-DE","de-AT","de-CH",
			"en-US","en-AU","en-CA","en-GB",
			"es-ES","es-AR","es-MX","es-CL",
			"fr-FR","it-IT","nl","pl","pt","pt-BR","ru","tr","ja","zh-CN","sv-SE"
		]
		callback && callback(a)
		return a
	},
	getPluginFileSpec: function(locale){
		var spec = 'chrome://instantfox/locale/plugins.json'
		if (typeof locale == 'string') {
			var upre=/\/[^\/]*$/
			spec = getFileUri(spec).replace(upre,'').replace(upre,'')
			spec += '/'+ locale + '/plugins.json';
		}
		return spec
	},
	isUserModified: function(plugin){
		for each(var i in this.defPropNames){
			if(plugin['def_'+i] != null && plugin['def_'+i] != plugin[i])
				return true
		}
		return false
	},

	// utils
	cleanCopyPlugin: function(p, forUser){
		var p1 = {}
		p1.url = p.url;
		p1.json = p.json;
		p1.domain = p.domain;
		//
		p1.iconURI = p.iconURI;
		p1.type = p.type;
		p1.name = p.name;
		p1.id = p.id;
		p1.key = p.key
		//
		p.disabled && (p1.disabled = true)
		p.disableInstant && (p1.disableInstant = true)
		p.disableSuggest && (p1.disableSuggest = true)
		p.hideFromContextMenu && (p1.hideFromContextMenu = true)
		//
		if(p.type=='default' || p.type == 'browserSearch'){
			for each(var i in this.defPropNames){
				var prop = 'def_'+i
				p[prop] != null && (p1[prop] = p[prop])
			}
		}
		return p1
	},
	// add new plugins when instantfox is updated
	onInstantfoxUpdate: function() {
		this.loadPlugins(InstantFoxModule.selectedLocale||true, this.savePlugins.bind(this))
	},

	extendedDomainFromURL: function(url){
		var match = url.match(/\w+:\/\/[^#?]*/);
		return match ? match[0].replace(/\/?[^\/]*?%q.*$/,'').replace(/\/$/, '') :'';
	},
	//************** favicon utils
	getFavicon: function(url){
		if (!this.faviconService)
			this.faviconService = Cc["@mozilla.org/browser/favicon-service;1"].getService(Ci.nsIFaviconService);
		try{
			var host = url.match(/^[a-z]*:\/\/([^\/#?]*)/)[1];
			var icon = this.faviconService.getFaviconImageForPage(makeURI('http://'+host)).spec
			if(icon != this.faviconService.defaultFavicon.spec)
				return icon
		}catch(e){}
		return 'http://g.etfv.co/http://'+host
	}
	
}


function getFileUri(mPath) {
	var uri = Services.io.newURI(mPath, null, null), file;
	var gChromeReg = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry);
	while (uri.schemeIs("chrome")) {
		uri = gChromeReg.convertChromeURL(uri);
	}
	return uri.spec
}
function fetchAsync(href, callback){
	var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
	req.overrideMimeType('text/plain')
	req.open('GET', href, true);

	req.addEventListener('load', function() {
		req.removeEventListener('load', arguments.callee, false)
		var reqText = req = req.responseText
		
		if(typeof callback == 'function')
			callback(reqText);
		else for each(var func in callback)
			if (typeof func == 'function') try {
				func(reqText);
			} catch(e){Cu.reportError(e)}	
	}, false)

	req.send(null);
	return req
}
function getUserFile(name, dir){
	var file = Services.dirsvc.get(dir||"ProfD", Ci.nsIFile);
	file.append(name)
	return file
}
function writeToFile(file, text){
	var ostream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
	ostream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);

	var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
	converter.init(ostream, "UTF-8", 4096, 0x0000);
	converter.writeString(text);
	converter.close();
}
function makeURI(aURL, aOriginCharset, aBaseURI) {
	return Services.io.newURI(aURL, aOriginCharset, aBaseURI);
}


/*************************************************************************
 *    search service
 ***************/
function pluginFromNsiSearch(bp){
	var url = bp.getSubmission('%qqq',"text/html")
	if(!url)
		return
	url = url.uri.spec.replace('%25qqq','%q')

	var json = bp.getSubmission('%qqq',"application/x-suggestions+json")
	if(json)
		json = json.uri.spec.replace('%25qqq','%q')
	else
		json = false

	var name = bp.name
	var iconURI = bp.iconURI && bp.iconURI.spec
	return {
		json:json,
		url:url,
		iconURI:iconURI,
		name:name,
		id:name.toLowerCase(),
		domain: extendedDomainFromURL(url),
		disabled:false,
		key: bp.alias,
		type:'browserSearch'
	}
}
function importBrowserPlugins(importKeys) {
	try{
		var browserPlugins = Services.search.getEngines().map(pluginFromNsiSearch)
		for each(var p in browserPlugins){
			if(!InstantFoxModule.Plugins[p.id])
				InstantFoxModule.Plugins[p.id] = p
			else if(importKeys && p.key)
				InstantFoxModule.Plugins[p.id].key = p.key

			// handle default plugins
			var p1 = InstantFoxModule.Plugins[p.id]
			if(p1.type == 'browserSearch')
				pluginLoader.defPropNames.forEach(function(propName){
					p1['def_'+propName] = p[propName]
				})
		}
	}catch(e){
	}
}

searchEngineObserver = {
	observe: function(subject, topic, j){
		dump(subject, topic,'+++++++++++++**********+++++++',j)
		importBrowserPlugins(false)
		if(this.$listener){
			this.$listener.get()()
		}
	},
	addListener: function(w){
		this.$listener = Components.utils.getWeakReference(w)
	},
	QueryInterface: function() this
}
Services.obs.addObserver(searchEngineObserver, "engine-added", true)
Services.obs.addObserver(searchEngineObserver, "engine-loaded", true)
Services.obs.addObserver(searchEngineObserver, "engine-removed", true)
Services.obs.addObserver(searchEngineObserver, "browser-search-engine-modified", true)

/*****************************************************
 * main object
 ***********/
InstantFoxModule = {
	helpURL: 'http://www.instantfox.net/help/',
	editingHelpURL: 'http://www.instantfox.net/help/#add-plugin',
	uninstallURL: 'http://www.instantfox.net/uninstall',

	bp: this,

	//
	get openSearchInNewTab(){
		delete this.openSearchInNewTab
		this.openSearchInNewTab = Services.prefs.getBoolPref("browser.search.openintab")
		return this.openSearchInNewTab
	},

	initialize: function(){
		this.pluginLoader.loadPlugins()
		this.initialize=function(){}
	},
	queryFromURL: function(url){
		function escapeRegexp(text) {
			return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		}

		var match=false, localizedMatchingPlugin;
		for(var key in this.Shortcuts){
			var i = this.Shortcuts[key]
			var p = this.Plugins[i]
			if(p && p.url){
				var dom = p.domain.replace(/\w+\:\/\/(www\.)?/, '')
				if(url.indexOf(dom)!=-1){
					match=true;
					break;
				}
				dom = dom.replace(/\.\w{1,3}(\.\w{1,3})?\//, '.@@@@/')
				if(dom == '.')
					continue
				// test in other locales
				dom = escapeRegexp(dom).replace('@@@@','\\w{1,3}(?:\.\\w{1,3})?')
				if(RegExp(dom).test(url))
					localizedMatchingPlugin = p
			}
		}
		if(!match){
			if(url.indexOf('.wikipedia.') > 0){
				var regexp=/\/([^\/#]*)(?:#|$)/
				p = this.Plugins.wikipedia
			}else if(url.indexOf('weather.instantfox.net') != -1){
				var regexp=/\/([^\/#]*)(?:#|$)/
				p = this.Plugins.weather
			}else if(localizedMatchingPlugin)
				p = localizedMatchingPlugin
			else
				return null;
		}

		if(!regexp){
			var m = p.url.match(/.([^&?#]*)%q(.?)/)
			regexp = escapeRegexp(m[1])
			regexp = RegExp('[&?#]'+regexp+'([^&]*)')
		}
		var queryString = (url.match(regexp)||{})[1]
		if(!queryString)
			return null;

		return p.key.replace(/ .*/, "") + ' ' + decodeURIComponent(queryString);
	},
	urlFromQuery: function(plugin, query) {
		if (typeof plugin == 'string') {
			plugin = InstantFoxModule.Plugins[plugin]
		} else if (plugin.plugin){
			var q = plugin
			plugin = q.plugin
			query = q.shadow || q.query //ignoreShadow
		}


		if (!query && q) {
			var url2go = q.plugin.domain || ''
			return url2go
		}

		// encode query
		if (plugin.id == 'imdb')
			query = escape(query.replace(/ /g, '+'));
		else
			query = encodeURIComponent(query);

		return plugin.url.replace('%q', query);
	},
	parse: function(q) {
		// We assume that the sting before the space indicates a InstantFox-Plugin
		var index = q.indexOf(' ');
		return {
			key: q.substr(0, index),
			query: q.substr(index+1, q.length),
			keyindex: index,
			keylength: q.length
		};
	},
	Plugins: {},
	Shortcuts: {},
	pluginLoader: pluginLoader,

	getBestPluginMatch: function(key){
		if(!key)
			return this.Plugins[this.defaultPlugin]
		return filter(InstantFoxModule.Plugins, key.replace('\xB7', ' ', 'g'))[0]||this.Plugins[this.defaultPlugin]
	},
	setAutoSearch: function(val){
		// todo
		this.autoSearch = val
	},
	modifyContextMenu: function(val){
		var e = Services.wm.getEnumerator("navigator:browser")
		while(e.hasMoreElements()){
			e.getNext().InstantFox.modifyContextMenu(val)
		}
	}

}

/*******************************************************
 *  json handlers
 *************/
var parseSimpleJson = function(json, key, splitSpace){
	try{
		var xhrReturn = JSON.parse(json)[1];
	}catch(e){
		Cu.reportError(e);
		try{
			xhrReturn = json.substring(json.indexOf("[\"")+2,json.lastIndexOf("\"]")).split('","')
		}catch(e){
			Cu.reportError(e)
			return
		}
	}
	if(!xhrReturn)
		return

	var results=[]
	for(var i = 0; i < xhrReturn.length; i++){
		var result = xhrReturn[i];
		results.push({
			icon: '',
			title: result,
			url: key + splitSpace + result
		})
	}
	return results
}
var parseMapsJson = function(json, key, splitSpace){
	var xhrReturn = json.match(/query:"[^"]*/g);
	if(!xhrReturn.length)
		return

	var results=[];
	for(var i = 0; i < xhrReturn.length; i++){
		var result = xhrReturn[i].substr(7);
		results.push({
			icon: '',
			title: result,
			url: key + splitSpace + result
		})
	}
	return results
}
var parseGeoJson = function(json, key, splitSpace){
	var city = json.match(/"city":"(.*?)"/)
	// sometimes city can be '(null)': why?
	if (!city || /\(?null\)?/.test())
		return
	var result = city[1]
	// side effect
	return InstantFoxModule.geoResult = [{
		icon: '',
		title: result,
		url: key + splitSpace + result
	}]
}
var getMatchingPlugins = function(key, tail){
	var results=[];
	var plugins = filter(InstantFoxModule.Plugins, key)
	for each(var p in plugins){
		if(p.disabled)
			continue
		// todo: always use unbreakable space in plugin names?
		results.push({
			icon: p.iconURI,
			title: p.name,
			url: '`' + p.name.replace(' ', '\xB7', 'g') + tail
		})
	}
	return results
}

var imdbJsonUrl = function(q2tidy, jsonUrl) {
	if (q2tidy.length > 20)
		q2tidy = q2tidy.substr(0, 20);
	q2tidy = q2tidy.replace(/^\s*/, "")
				.replace(/[ ]+/g, "_")
				.replace(/[\u00e0\u00c0\u00e1\u00c1\u00e2\u00c2\u00e3\u00c3\u00e4\u00c4\u00e5\u00c5\u00e6\u00c6]/g, "a")
				.replace(/[\u00e7\u00c7]/g, "c")
				.replace(/[\u00e8\u00c8\u00e9\u00c9\u00ea\u00ca\u00eb\u00cb]/g, "e")
				.replace(/[\u00ec\u00cd\u00ed\u00cd\u00ee\u00ce\u00ef\u00cf]/g, "i")
				.replace(/[\u00f0\u00d0]/g, "d")
				.replace(/[\u00f1\u00d1]/g, "n")
				.replace(/[\u00f2\u00d2\u00f3\u00d3\u00f4\u00d4\u00f5\u00d5\u00f6\u00d6\u00f8\u00d8]/g, "o")
				.replace(/[\u00f9\u00d9\u00fa\u00da\u00fb\u00db\u00fc\u00dc]/g, "u")
				.replace(/[\u00fd\u00dd\u00ff]/g, "y")
				.replace(/[\u00fe\u00de]/g, "t")
				.replace(/[\u00df]/g, "ss")
				.replace(/[\W]/g, "")
				.toLowerCase()
	return jsonUrl.replace('%q', q2tidy).replace('%fq', q2tidy[0]);
}
var parseImdbJson = function(json, key, splitSpace){
	try{
		json = json.substring(json.indexOf('{'), json.lastIndexOf('}')+1)
		var xhrReturn = JSON.parse(json).d;
	}catch(e){
		return InstantFoxModule.currentQuery.results
	}
	if(!xhrReturn)
		return

	var results=[]
	for(var i = 0; i < xhrReturn.length; i++){
		var result = xhrReturn[i];
		results.push({
			icon: '',//result.i||'http://i.media-imdb.com/images/mobile/film-40x54.png',
			title: result.l,
			url: key + splitSpace + result.l,
			comment: result.s
		})
	}
	return results
}

function filter(data, text) {
	var table = [];
	if (!text) {
		for each(var p in data)
			table.push(p);
		return table;
	}
	var filterText = text.toLowerCase();
	var filterTextCase = text;

	//*******/
	function computeSpringyIndex(val) {
		var lowName = val.name.toLowerCase();
		var priority = 0;
		var lastI = 0;
		var ind1 = 0;
		if (val.name.indexOf(filterTextCase) === 0) {
			val.priority = -2;
			table.push(val);
			return;//exact match
		}
		for(var j = 0, ftLen = filterText.length; j < ftLen; j++) {
			lastI = lowName.indexOf(filterText[j],ind1);
			if (lastI === -1)
				break; //doesn't match
			priority += lastI - ind1;
			ind1 = lastI+1;
		}
		if (lastI != -1) {
			val.priority = priority;
			table.push(val);
		}
	}
	var sortVals = ["priority", "name"];

	for each(var p in data)
		computeSpringyIndex(p);
	table.sort(function (a, b) {
		for each(var i in sortVals) {
		  if (a[i] < b[i])
			  return -1;
		  if (a[i] > b[i])
			  return 1;
		}
		return 0;
	});
	return table;
}

function getAboutUrls(){
	var l="@mozilla.org/network/protocol/about;1?what=", ans=[];
	for(var i in Cc)
		if(i.indexOf(l)==0){
			var name = i.substr(l.length)
			ans.push({
				url: 'about:'+ name,
				title: 'about:'+ name,
				name: name
			})
		}
	return ans.sort()
}
/*************************************************************************
 *    search component
 ***************/
function AutoCompleteResultToArray(r){
	var ans = [];
	for(var i = 0;i<r.matchCount;i++)
		ans.push({
			icon: r.getImageAt(i),
			type: r.getStyleAt(i),
			comment: r.getCommentAt(i),
			label: r.getLabelAt(i),
			url: r.getValueAt(i),
			origIndex: i
		})
	return ans
}
function SimpleAutoCompleteResult(list, searchString, defaultIndex) {
	this._searchString = searchString;
	this._defaultIndex = defaultIndex || 0;
	if (list){
		var status = (list.length?'SUCCESS':'NOMATCH')
		this.list = list;
	} else
		var status = 'FAILURE';

	this._searchResult = Ci.nsIAutoCompleteResult['RESULT_' + status];
}
SimpleAutoCompleteResult.prototype = {
	/**
	 * The result code of this result object, either:
	 *         RESULT_IGNORED   (invalid searchString)
	 *         RESULT_FAILURE   (failure)
	 *         RESULT_NOMATCH   (no matches found)
	 *         RESULT_SUCCESS   (matches found)
	 */
	_searchResult: 0,
	_searchString: "",
	_defaultIndex: 0,
	_errorDescription: "",
	list: [],
	setSearchResult: function(val) this._searchResult = val,
	setDefaultIndex: function(val) this._defaultIndex = val,

	get searchResult() this._searchResult,
	get searchString() this._searchString,
	get defaultIndex() this._defaultIndex,
	get errorDescription() this._errorDescription,
	get matchCount() this.list.length,

	getCommentAt: function(index) 
		this.list[index] && this.list[index].title || "",//title attribute on richlistitem in popup
	getLabelAt: function(index) 
		this.list[index] && this.list[index].url || "",//url attribute on richlistitem in popup
	getValueAt: function(index) 
		this.list[index] && this.list[index].url || "",//displayed in urlbar
	getImageAt: function(index) 
		this.list[index] && this.list[index].icon || "",// "chrome://instantfox/content/skin/button-logo.png", //pin-icon.png", 
	getStyleAt: function(index) 
		this.list[index] && this.list[index].type || "InstantFoxSuggest",

	removeValueAt: function(index, removeFromDb) {
		dump(index, removeFromDb)
		this.list.splice(index, 1);
	},
	QueryInterface: function(aIID) {
		if (!aIID.equals(Ci.nsIAutoCompleteResult) && !aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};


function InstantFoxSearch(){}
InstantFoxSearch.prototype = {
	classDescription: "Autocomplete 4 InstantFox",
	classID: Components.ID("c541b971-0729-4f5d-a5c4-1f4dadef365e"),
	contractID: "@mozilla.org/autocomplete/search;1?name=instantFoxAutoComplete",
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch]),

	// implement searchListener for historyAutoComplete
	onSearchResult: function(search, result) {
		this.listener.onSearchResult(this, result)
	},

	// implement nsIAutoCompleteSearch
	startSearch: function(searchString, searchParam, previousResult, listener) {
		if (searchString.slice(0, 6) == 'about:'){
			searchString = searchString.substr(6)
			var results = filter(getAboutUrls(), searchString)
			if(results && results.length){
				var newResult = new SimpleAutoCompleteResult(results, searchString);
				listener.onSearchResult(this, newResult);
				return
			}
		}
		if (!InstantFoxModule.currentQuery) {
			//Search user's history
			this.$searchingHistory = true
			this.listener = listener;
			this.searchString = searchString;
			dump(searchParam)
			this.historyAutoComplete.startSearch(searchString, "", previousResult, this);
			return
		} else if(this.$searchingHistory)
			this.historyAutoComplete.stopSearch()

		var q = InstantFoxModule.currentQuery
		var plugin = q.plugin
		var results, url, callOnSearchReady;

		var isMaps = plugin && plugin.json && plugin.json.indexOf('http://maps.google') == 0

		if (plugin.suggestPlugins) {
			// handle ` searches
			var results = getMatchingPlugins(plugin.key, plugin.tail)
		} else if (!plugin.json || plugin.disableSuggest){
			// suggest is dissabled
			url = null
			callOnSearchReady = true
		} else if(!q.query) {
			// in some cases we can provide suggestions even before user started typing
			if (isMaps) {
				if (!InstantFoxModule.geoResult){
					url = 'http://geoiplookup.wikia.com/'
					this.parser = parseGeoJson
				} else {
					url = null
					results = InstantFoxModule.geoResult
					callOnSearchReady = true
				}
			} else {
				// nop
			}
		} else if (plugin.id == 'imdb') {
			// imdb needs special handling
			url = imdbJsonUrl(q.query, plugin.json)
			this.parser = parseImdbJson
		} else {
			// **********************
			url = plugin.json.replace('%q', encodeURIComponent(q.query))
			this.parser = isMaps ? parseMapsJson : parseSimpleJson
		}


		if (url) {
			this.listener = listener;
			this.startReq(url)
		} else { // no need for xhr
			q.results = results;
			var newResult = new SimpleAutoCompleteResult(results, searchString);
			listener.onSearchResult(this, newResult);
			if (callOnSearchReady)
				InstantFoxModule.currentQuery.onSearchReady()
			return true;
		}
	},

	stopSearch: function(){
		if(this.historyAutoComplete)
			this.historyAutoComplete.stopSearch();
		//stopping _req here leads to slow suggestions

		this.listener = null;
	},

	// handle xhr
	startReq: function(url){
		if(!this._reqList){
			this._reqList = []
			this.onSearchReady = this.onSearchReady.bind(this)
		}

		var _req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
		_req.addEventListener("load", this.onSearchReady, false);

		this._reqList.push(_req)

		_req.open("GET", url, true);
		_req.send(null);
	},

	onSearchReady: function(e){
		dump('end',e.target.channel.name, this._reqList[0] == e.target)
		if(!this.listener)
			return
		// don't let older requests completing later mess with suggestions
		this.stopOldRequests(e.target)

		var json = e.target.responseText;

		var q = InstantFoxModule.currentQuery
		if(q){
			var key = q.key || q.plugin.key
			q.results = this.parser(json, key, q.splitSpace)
			var newResult = new SimpleAutoCompleteResult(q.results, q.value);
			this.listener.onSearchResult(this, newResult);
			q.onSearchReady()
		}
	},

	stopOldRequests: function(req){
		var i = this._reqList.indexOf(req)
		if(i==-1)
			return

		while(i--)
			this._reqList.shift().abort()

		this._reqList.shift()
	}
};
XPCOMUtils.defineLazyServiceGetter(InstantFoxSearch.prototype, "historyAutoComplete",
					"@mozilla.org/autocomplete/search;1?name=history", "nsIAutoCompleteSearch")


/*******************************************************
 *  component registration
 *************/
;(function(component){
	var reg = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
	var CONTRACT_ID = component.prototype.contractID
	try{
		reg.unregisterFactory(
			reg.contractIDToCID(CONTRACT_ID),
			reg.getClassObjectByContractID(CONTRACT_ID, Ci.nsISupports)
		)
	}catch(e){}
	var cp = component.prototype;
	var factory = XPCOMUtils.generateNSGetFactory([component])(cp.classID);
	reg.registerFactory(cp.classID, cp.classDescription, cp.contractID, factory);
})(InstantFoxSearch);

InstantFoxModule.initialize()


/***************************************************
 * uninstall listener
 * see https://developer.mozilla.org/en/Addons/Add-on_Manager/AddonListener
 * todo: will not be needed for restartless addon
 ***********************/
var addonListener = addonListener || {
	onUninstalling: function(addon){
		if(addon.id=='searchy@searchy'){
			var iFox = Services.wm.getMostRecentWindow('navigator:browser').InstantFox
			iFox.addTab(InstantFoxModule.uninstallURL + '?version=' + addon.version + '&face=:(')
			// open page only once
			Cu.import('resource://gre/modules/AddonManager.jsm', {}).AddonManager.removeAddonListener(this)
			// restore searchbar
			iFox.updateToolbarItems(false, false);
		}
	}
	// onDisabled
}

Cu.import('resource://gre/modules/AddonManager.jsm', {}).AddonManager.addAddonListener(addonListener)

