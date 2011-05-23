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
			var m = p.url.match(/.([^&?#]*)%q(.?)/)
			regexp = escapeRegexp(m[1])
			regexp = RegExp('[&?#]'+regexp+'([^&]*)')
		}
		dump(regexp, p.url)
		var queryString = (url.match(regexp)||{})[1]
		if(!queryString)
			return null;

		return p.key + ' ' + decodeURIComponent(queryString);
	},
	URLFromQuery: function(q) {
		var q			= gURLBar.value;
		var parsed    = this.parse(q.trimLeft());
		var shortcut  = InstantFox.Shortcuts[parsed.key];

		if (parsed.key && parsed.query && shortcut) {
			var resource = InstantFox.Plugins[shortcut];

			if(resource.json){
				var json	 = resource.json.replace('%q', encodeURIComponent(parsed.query));
			}
			var gotourl = false;
			if(resource.url){
				var gotourl = resource.url.replace('%q', parsed.query);
			}
			return {'query': parsed.query, 'key':parsed.key, 'json':json, 'gotourl':gotourl};
		}else return false;
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
	

}

InstantFox={
	Plugins:{},
	Shortcuts:{},
	onPluginsLoaded:function(){
		InstantFoxModule.Plugins=this.Plugins
		InstantFoxModule.Shortcuts=this.Shortcuts
	}
}

/*************************************************************************
 *    load and save customized plugins
 ***************/
function savePlugins(){
	var ob={}
	for each(var i in InstantFox.Plugins)
		if(i.url)
			ob[i.name]=i

	var js = JSON.stringify(ob).replace(',','\n,','g')

	writeToFile(HH.getPluginFile(),js)
}

function loadCustomizedPlugins(){
	var file = getPluginFile()
	var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
	if(file.exists()){
		var spec = Services.io.newFileURI(file).spec
		req.onload=onPluginsLoaded
	}else{
		spec = 'chrome://instantfox/locale/plugins.js'
		req.onload=onRawPluginsLoaded
	}
	req.overrideMimeType("text/plain");
	req.open("GET", spec, true);
	req.send(null)
}

function onPluginsLoaded(e){
	e.target.onload=null
	var js = e.target.responseText
	var plugins = JSON.parse(js)
	InstantFox.Shortcuts={}
	InstantFox.Plugins={}
	for each (var i in plugins)
		if(i.key){
			InstantFox.Shortcuts[i.key] = i.name
			InstantFox.Plugins[i.name] = i
		}
	InstantFox.onPluginsLoaded()
}

function getPluginFile(){
	var file = Services.dirsvc.get("ProfD", Ci.nsIFile);
	file.append('instantFoxPlugins.js')
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
 *    load default plugins from locale file
 ***************/
preprocessPlugins = function(){
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
}

onRawPluginsLoaded=function(){
	e.target.onload=null
	var js = e.target.responseText
	eval(js)
	preprocessPlugins()
	InstantFox.onPluginsLoaded()
}

/*************************************************************************
 *    search component
 ***************/
function SimpleAutoCompleteResult(searchString, searchResult,
        defaultIndex, errorDescription, list) {
	this._searchString = searchString;
	this._searchResult = searchResult;
	this._defaultIndex = defaultIndex;
	this._errorDescription = errorDescription;
	if(list) this.list = list;
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
	list: [{}],


	get searchResult() this._searchResult,
	get searchString() this._searchString,
	get defaultIndex() this._defaultIndex,
	get errorDescription() this._errorDescription,
	get matchCount() this.list.length,

	getValueAt: function(index) { return this.list[index].url;},
	getCommentAt: function(index) { return this.list[index].url;},
	getImageAt: function(index) { return this.list[index].url;},
	getLabelAt: function(index) { return this.list[index].url; },
	getStyleAt: function(index) { return "InstantFoxSuggest"},

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
		dump(searchString, searchParam, previousResult, listener)
		//win = Services.wm.getMostRecentWindow("navigator:browser");
bb=this
		var self = this
		if(!InstantFoxModule.currentQuery){
			//Search user's history
			this.historyAutoComplete = this.historyAutoComplete ||
					Cc["@mozilla.org/autocomplete/search;1?name=history"]
									.getService(Ci.nsIAutoCompleteSearch);
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
		


		/* if(InstantFox_Comp.Wnd.InstantFox.HH._url.abort){
			this.historyAutoComplete&&this.historyAutoComplete.stopSearch();
			var newResult = new SimpleAutoCompleteResult(
					searchString, Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
					0, "",
					internal_results
				);
			listener.onSearchResult(self, newResult);
			return false;
		} */
		var api = InstantFoxModule.currentQuery.plugin
dump(api)
		if(!api['json']){
			var newResult = new SimpleAutoCompleteResult(
				searchString, Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
					0, "",
					null
				);
			listener.onSearchResult(self, newResult);
			//InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = true;
			return true;
		}
		
		this.listener = listener;
		dump(api['json'])
		this.startReq()		
	},

	stopSearch: function(){
		if(this.historyAutoComplete) this.historyAutoComplete.stopSearch();
		if(this._req){
			this._req.abort();
		}
		this.listener = null;
	},
	
	onSearchReady: function(e){dump(e)
		var json = e.target.responseText;
		var key = InstantFoxModule.currentQuery.plugin.key
		var results = parseSimpleJson(json, key)
		if(results){
			var newResult = new SimpleAutoCompleteResult(
				InstantFoxModule.currentQuery.value, Ci.nsIAutoCompleteResult.RESULT_SUCCESS,
				0, "",
				results
			);
		}else{
			var newResult = new SimpleAutoCompleteResult(
				InstantFoxModule.currentQuery.value, Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
				0, "",
				results
			);
		}
		dump(this.listener,newResult,results)
		this.listener.onSearchResult(this, newResult);
		this.listener = null;
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
dump(url)
		this._req.send(null);
	}
};
dump('****')
/*******************************************************
 *  json handlers
 *************/
var parseSimpleJson = function(json, key){
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
			url: key + ' ' + result
		})
	}
	return results
}
var parseMapsJson = function(json, key){
	var xhrReturn = json.match(/query:"[^"]*/g);	
	if(!xhrReturn.length)
		return

	var results=[];
	for(var i = 0; i < xhrReturn.length; i++){
		var result = xhrReturn[i].substr(7);
		results.push({
			icon: '',
			title: result,
			url: key + ' ' + result
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