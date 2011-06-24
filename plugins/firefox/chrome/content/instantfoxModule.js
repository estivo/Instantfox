var Cc	= Components.classes;
var Ci	= Components.interfaces;
var Cr	= Components.results;
var Cu	= Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

EXPORTED_SYMBOLS = ['InstantFoxModule'];

/*****************************************************
 * debugging
 ***********/
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
function dump() {
    var aMessage = "aMessage: ";
    for (var i = 0; i < arguments.length; ++i) {
        var a = arguments[i];
        aMessage += (a && !a.toString ? "[object call]" : a) + " , ";
    }
    var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("" + aMessage);
}

/*************************************************************************
 *    load and save customized plugins
 *    plugin={
 *        hideFromContextMenu:
 *        disableInstant:
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
function fixupPlugin(p){
	domainRe = /:\/\/([^#?]*)/;
	if(p.url){
		var match = p.url.match(domainRe)
		p.domain = match?match[1]:''
		p.name = p.name||p.id
		p.id = p.id.toLowerCase()
		p.iconURI = p.iconURI || getFavicon(p.url);
	}
	if(!p.json)
		p.json = InstantFoxModule.Plugins.google.json
}
function cleanCopyPlugin(p){
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
	p.disabled &&(p1.disabled = true)
	p.disableInstant &&(p1.disableInstant = true)
	p.hideFromContextMenu &&(p1.hideFromContextMenu = true)
	return p1
}
var pluginLoader = {
	preprocessRawData: function (pluginData){
		var localeRe=/%l(?:s|l|d)/g,
			domainRe = /:\/\/([^#?]*)/;
		function replacer(m) pluginData.localeMap[m]
		
		var newPlugins = {}

		for(var i in pluginData.plugins){
			var p = pluginData.plugins[i];
			if(!p)
				continue

			if(p.url){
				p.url = p.url.replace(localeRe, replacer)
				p.domain = p.url.match(domainRe)[1]
				p.name = p.name||i
				p.id = i.toLowerCase()
				p.iconURI = p.iconURI || getFavicon(p.url);
			}

			if(p.json)
				p.json = p.json.replace(localeRe, replacer)
			else
				p.json = false
			
			p.type = 'default'
			
			newPlugins[p.id] = p
		}
		pluginData.plugins = newPlugins
		return pluginData
	},
	addPlugins: function(pluginData){
		InstantFoxModule.selectedLocale = pluginData.localeMap['%ll']
		for each(var p in pluginData.plugins){
			var id = p.id
			var mP = InstantFoxModule.Plugins[id]
			//copy user modified values
			if(mP){
				if('key' in mP)
					p.key = mP.key
				if('hideFromContextMenu' in mP)
					p.hideFromContextMenu = mP.hideFromContextMenu;
				if('disableInstant' in mP)
					p.disableInstant = mP.disableInstant;
				if('disabled' in mP)
					p.disabled = mP.disabled;
			}
			InstantFoxModule.Plugins[id] = p;
		}
		// remove default plugins from other locale
		for (var pn in InstantFoxModule.Plugins){
			var p = InstantFoxModule.Plugins[pn]
			dump(pn,p.type ,pluginData.plugins[pn])
			if (p.type == 'default' && !pluginData.plugins[pn])
				delete InstantFoxModule.Plugins[pn]
		}
		InstantFoxModule.defaultPlugin = InstantFoxModule.defaultPlugin||'google'
	},
	initShortcuts: function(){
		InstantFoxModule.Shortcuts = {}
		var conflicts={}
		
		for each(var  p in InstantFoxModule.Plugins){
			if(p.url && p.key && !p.disabled) {
				if(InstantFoxModule.Shortcuts[p.key])
					conflicts[InstantFoxModule.Plugins[InstantFoxModule.Shortcuts[p.key]].id] =
						conflicts[p.id] = true
					
				InstantFoxModule.Shortcuts[p.key] = p.id
			}
		}
		for each(var  p in InstantFoxModule.Plugins){
			if(p.disabled && InstantFoxModule.Shortcuts[p.key])
					conflicts[p.id] = 'maybe'
		}
		InstantFoxModule.ShortcutConflicts = conflicts
	},
	
	onRawPluginsLoaded: function(e){
		e.target.onload=null
		var js = e.target.responseText
		try{
			eval(js)
		}catch(e){
			Cu.reportError('malformed locale')
			Cu.reportError(e)
			return
		}
		this.preprocessRawData(rawPluginData)
		this.addPlugins(rawPluginData)
		// add data from browser searches
		var browserPlugins = Services.search.getEngines().map(pluginFromNsiSearch)
		for each(var p in browserPlugins){
			if(!InstantFoxModule.Plugins[p.id])
				InstantFoxModule.Plugins[p.id] = p
			else if(p.key)
				InstantFoxModule.Plugins[p.id].key = p.key
		}
		this.initShortcuts()
	},	
	onPluginsLoaded: function(e){
		e.target.onload=null
		var js = e.target.responseText
		try{
			var pluginData = JSON.parse(js)
		}catch(e){
			this.loadPlugins(true)
			return
		}
		InstantFoxModule.selectedLocale = pluginData.selectedLocale
		InstantFoxModule.defaultPlugin = pluginData.defaultPlugin
		for each(var p in pluginData.plugins){
			var id = p.id
			var mP = InstantFoxModule.Plugins[id]
			if(mP && mP.key)
				p.key = mP.key
			InstantFoxModule.Plugins[id] = p;
		}
		this.initShortcuts()
	},
	
	savePlugins: function(){
		var ob={}
		for each(var p in InstantFoxModule.Plugins)
			if(p.url)
				ob[p.id]=cleanCopyPlugin(p)
				
		var pluginData = {
			selectedLocale: InstantFoxModule.selectedLocale,
			defaultPlugin: InstantFoxModule.defaultPlugin,
			plugins: ob
		}

		var js = JSON.stringify(pluginData, null, 1)

		writeToFile(getUserFile('instantFoxPlugins.js'), js)
	},
	loadPlugins: function(locale, callback){
		if(this.req)
			this.req.abort()
		else
			this.req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();

		var file = getUserFile('instantFoxPlugins.js')
		if(!locale && file.exists()){
			var spec = Services.io.newFileURI(file).spec
			var onload = this.onPluginsLoaded.bind(this)
		}else{
			spec = 'chrome://instantfox/locale/plugins.js'
			if(typeof locale == 'string'){
				var upre=/\/[^\/]*$/
				spec = getFileUri('chrome://instantfox/locale/plugins.js').replace(upre,'').replace(upre,'')
				spec += '/'+ locale + '/plugins.js';
				dump(spec)
			}
			var onload = this.onRawPluginsLoaded.bind(this)
		}
		var self = this
		this.req.onload=function(e){
			this.onload = null;
			onload(e)
			callback&&callback()
		}
		callback
		this.req.overrideMimeType("text/plain");
		this.req.open("GET", spec, true);
		this.req.send(null)
	},
	
	getAvaliableLocales: function(callback){
		var upre=/\/[^\/]*$/
		var href = getFileUri('chrome://instantfox/locale/plugins.js').replace(upre,'').replace(upre,'') + '/'
		makeReqAsync(href, function(t){
			callback(t.match(/201\: [^ ]* /g).map(function(x)x.slice(5,-1).replace(/\/$/, '')))
		})
	},

}
 
function getFileUri(mPath) {
    var uri = Services.io.newURI(mPath, null, null), file;
	var gChromeReg = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry);
    while (uri.schemeIs("chrome")) {
        uri = gChromeReg.convertChromeURL(uri);
    }
	return uri.spec
}

function makeReqAsync(href,callback){
    var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
    req.open('GET', href, true);
	req.overrideMimeType('text/plain')

    req.onload = function() {
		callback(req.responseText);
	}

    req.send(null);
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

//************** favicon utils
var faviconService;
var tldService;
function makeURI(aURL, aOriginCharset, aBaseURI) {
    return Services.io.newURI(aURL, aOriginCharset, aBaseURI);
}

function getFavicon(url){
	faviconService = faviconService || Cc["@mozilla.org/browser/favicon-service;1"].getService(Ci.nsIFaviconService);
	tldService = tldService || Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
	try{
		var host = url.match(/^[a-z]*:\/\/([^\/#?]*)/)[1];
		var icon = faviconService.getFaviconImageForPage(makeURI('http://'+host)).spec
		if(icon != faviconService.defaultFavicon.spec)
			return icon
		var baseDomain = tldService.getBaseDomainFromHost(host)
		var icon = faviconService.getFaviconImageForPage(makeURI('http://'+baseDomain)).spec
		if(icon != faviconService.defaultFavicon.spec)
			return icon
		var icon = faviconService.getFaviconImageForPage(makeURI('http://www.'+baseDomain)).spec
		if(icon != faviconService.defaultFavicon.spec)
			return icon
	}catch(e){Components.utils.reportError(e)}	
		
	return 'http://g.etfv.co/http://'+host
}
/*************************************************************************
 *    search service
 ***************/
function pluginFromNsiSearch(bp){
	var url = bp.getSubmission('%qqq',"text/html")
	var domainRe = /:\/\/([^#?]*)/;
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
		domain: url.match(domainRe)[1],
		disabled:true,
		key: bp.alias,
		type:'browserSearch'
	}	
}


/*****************************************************
 * main object
 ***********/
InstantFoxModule = {
    _version: '1.0.3',
	helpURL: 'i.am.a.helpful.url',

	initialize: function(){
		this.pluginLoader.loadPlugins()
		this.initialize=function(){}
	},
	queryFromURL: function(url){
		function escapeRegexp(text) {
			return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		}

		var match=false;
		for(var key in this.Shortcuts){
			var i = this.Shortcuts[key]
			var p = this.Plugins[i]
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
				p = this.Plugins.wikipedia
			}else if(url.indexOf('weather.instantfox.net') > 0){
				var regexp=/\/([^\/#]*)(?:#|$)/
				p = this.Plugins.weather
			}else
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

		return p.key + ' ' + decodeURIComponent(queryString);
	},
	URLFromQuery: function(q) {
		//todo
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
		return filter(InstantFoxModule.Plugins, key)[0]||this.Plugins[this.defaultPlugin]
	}
}

/*******************************************************
 *  json handlers
 *************/
var parseSimpleJson = function(json, key, splitSpace){
	try{
		var xhrReturn = JSON.parse(json)[1];
	}catch(e){
		return
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
var getMatchingPlugins = function(key, tail){
	var results=[];
	var plugins = filter(InstantFoxModule.Plugins, key)
	for each(var p in plugins){
		if(p.disabled)
			continue
		results.push({
			icon: p.iconURI,
			title: p.name,
			url: '`' + p.name + tail
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
	jsonUrl.replace('%q', q2tidy).replace('%fq', q2tidy[0]);
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
			icon: '',
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
/*************************************************************************
 *    search component
 ***************/
function SimpleAutoCompleteResult(list, searchString, defaultIndex) {
	this._searchString = searchString;
	this._defaultIndex = defaultIndex || 0;
	if (list){
		this._searchResult = (list.length?'SUCCESS':'NOMATCH')
		this.list = list;
	} else
		this._searchResult = 'FAILURE';

	this._searchResult = Ci.nsIAutoCompleteResult['RESULT_' + this._searchResult]
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

	get searchResult() this._searchResult,
	get searchString() this._searchString,
	get defaultIndex() this._defaultIndex,
	get errorDescription() this._errorDescription,
	get matchCount() this.list.length,

	getCommentAt: function(index) this.list[index].title,//title attribute on richlistitem in popup
	getLabelAt: function(index) this.list[index].url,//url attribute on richlistitem in popup
	getValueAt: function(index) this.list[index].url,//displayed in urlbar
	getImageAt: function(index) this.list[index].icon,
	getStyleAt: function(index) "InstantFoxSuggest",

	removeValueAt: function(index, removeFromDb) {
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
	historyAutoComplete: null,
	classID: Components.ID("c541b971-0729-4f5d-a5c4-1f4dadef365e"),
	contractID: "@mozilla.org/autocomplete/search;1?name=instantFoxAutoComplete",
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIAutoCompleteSearch]),

	startSearch: function(searchString, searchParam, previousResult, listener) {
		//win = Services.wm.getMostRecentWindow("navigator:browser");
		var self = this
		if(!InstantFoxModule.currentQuery){
			//Search user's history
			this.historyAutoComplete = this.historyAutoComplete ||
					Cc["@mozilla.org/autocomplete/search;1?name=history"].getService(Ci.nsIAutoCompleteSearch);
			this.$searchingHistory = true
			this.historyAutoComplete.startSearch(searchString, searchParam, previousResult, {
				onSearchResult: function(search, result) {
					self.$searchingHistory = false;
					listener.onSearchResult(self, result)
				}
			});
			return
		} else if(this.$searchingHistory)
			this.historyAutoComplete.stopSearch()
		var api = InstantFoxModule.currentQuery.plugin

		if (api.suggestPlugins) {
			var plugins = getMatchingPlugins(api.key, api.tail)
			dump(plugins)
			var newResult = new SimpleAutoCompleteResult(plugins, searchString);
			listener.onSearchResult(self, newResult);
			//InstantFoxModule.currentQuery.onSearchReady()
			return true;
		}

		if(!api.json){
			var newResult = new SimpleAutoCompleteResult(null, searchString);
			listener.onSearchResult(self, newResult);
			InstantFoxModule.currentQuery.onSearchReady()
			return true;
		}

		this.listener = listener;
		dump(api['json'])
		this.startReq()
	},

	stopSearch: function(){
		if(this.historyAutoComplete) this.historyAutoComplete.stopSearch();
		if(this._req)
			this._req.abort();

		this.listener = null;
	},

	onSearchReady: function(e){dump(e)
		var json = e.target.responseText;
		var q = InstantFoxModule.currentQuery
		var key = q.plugin.key
		
		if(q.plugin.json.indexOf('http://maps.google') == 0)
			q.results = parseMapsJson(json, key, q.splitSpace)
		else
			q.results = parseSimpleJson(json, key, q.splitSpace)

		var newResult = new SimpleAutoCompleteResult(q.results, q.value);

		this.listener.onSearchResult(this, newResult);
		this.listener = null;
		
		q.onSearchReady()
	},

	startReq: function(){
		if(this._req)
			this._req.abort()
		else{
			this._req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
			this._req.onload = this.onSearchReady.bind(this)
		}
		var q = InstantFoxModule.currentQuery
		var url = q.plugin.json.replace('%q', q.query)
		this._req.open("GET", url, true);

		this._req.send(null);
	}
};

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