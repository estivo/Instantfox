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

/*****************************************************
 * main object
 ***********/
InstantFoxModule = {
    _version: '1.0.3',
	initialize: function(){
		loadCustomizedPlugins()
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
	Plugins:{},
	Shortcuts:{},

}


/*************************************************************************
 *    load and save customized plugins
 ***************/
var pluginLoader = {
	preprocessRawData: function (pluginData){
		var localeRe=/%l(?:s|l|d)/g,
			domainRe = /:\/\/([^#?]*)/;
		function replacer(m) pluginData.localeMap[m]

		for(var i in pluginData.plugins){
			var p = pluginData.plugins[i];
			if(!p)
				continue
			var key = p.key

			if(p.url){
				p.url = p.url.replace(localeRe, replacer)
				p.domain = p.url.match(domainRe)[1]
				p.key = key
				p.name = i
				p.id = i.toLowerCase()
			}

			if(p.json)
				p.json = p.json.replace(localeRe, replacer)
			else
				p.json = false
			
			p.type = 'default'
		}
		return pluginData
	},
	addPlugins: function(pluginData){
		InstantFoxModule.selectedLocale = pluginData.localeMap['%ll']
		for each(var p in pluginData.plugins){
			var id = p.id
			var mP = InstantFoxModule.Plugins[id]
			if(mP && mP.key)
				p.key = mP.key
			InstantFoxModule.Plugins[id] = p;
		}
	},
	initShortcuts: function(){
		InstantFoxModule.Shortcuts = {}
		
		for each(var  p in InstantFoxModule.Plugins){
			if(p.url && p.key)
				InstantFoxModule.Shortcuts[p.key] = p.id
		}
	},
	
	onRawPluginsLoaded: function(e){
		e.target.onload=null
		var js = e.target.responseText
		eval(js)
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
		var pluginData = JSON.parse(js)
		InstantFoxModule.selectedLocale = pluginData.selectedLocale
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
		for each(var i in InstantFoxModule.Plugins)
			if(i.url)
				ob[i.id]=i
				
		var pluginData = {
			selectedLocale: InstantFoxModule.selectedLocale,
			plugins: ob
		}

		var js = JSON.stringify(pluginData).replace(',','\n,','g')

		writeToFile(HH.getUserFile('instantFoxPlugins.js'), js)
	},	
	getAvaliableLocales: function(callback){
		var upre=/\/[^\/]*$/
		var href = getFileUri('chrome://instantfox/locale/plugins.js').replace(upre,'').replace(upre,'')
		makeReqAsync(href, function(t){
			callback(t.match(/201\: [^ ]* /g).map(function(x)x.slice(5,-1)))			
		})
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
		disabled:true,
		key: bp.alias,
		type:'browserSearch'
	}	
}


function loadCustomizedPlugins(){
	var file = getUserFile('instantFoxPlugins.js')
	var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
	if(file.exists()){
		var spec = Services.io.newFileURI(file).spec
		req.onload=pluginLoader.onPluginsLoaded.bind(pluginLoader)
	}else{
		spec = 'chrome://instantfox/locale/plugins.js'
		req.onload=pluginLoader.onRawPluginsLoaded.bind(pluginLoader)
	}
	req.overrideMimeType("text/plain");
	req.open("GET", spec, true);
	req.send(null)
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

	getCommentAt: function(index) this.list[index].title,//displayed in popup
	getValueAt: function(index) this.list[index].url,//displayed in urlbar
	getImageAt: function(index) this.list[index].url,
	getLabelAt: function(index) this.list[index].url,
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
		dump(searchString, 'InstantFoxSearch-**-')
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
/*******************************************************
 *  register component
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