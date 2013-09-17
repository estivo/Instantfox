
var Cc  = Components.classes;
var Ci  = Components.interfaces;
var Cr  = Components.results;
var Cu  = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

EXPORTED_SYMBOLS = ['InstantFoxModule'];

/**devel__(*********************************************///{
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

//}/** devel__) **/
try{
	var HttpsEverywhere = !!Cc["@eff.org/https-everywhere;1"]
}catch(e){}
// compatibility with https-everywhere


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
		p.iconURI = p.iconURI || pluginLoader.getFavicon(p.url);

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
		var newPlugins = Object.create(null)
		var oldPlugins = InstantFoxModule.Plugins;
		for each(var plugin in pluginData.plugins){
			var p = this.cleanCopyPlugin(plugin)
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
					p.iconURI = pluginLoader.getFavicon(p.url);
			}
			newPlugins[p.id] = p;
		}
		// remove default plugins from other locale
		for each(var p in oldPlugins) {
			if (newPlugins[p.id])
				continue
			if (p.type != 'default' || this.isUserModified(p))
				newPlugins[p.id] = p;
		}

		InstantFoxModule.Plugins = newPlugins;

		InstantFoxModule.defaultPlugin = InstantFoxModule.defaultPlugin||'google'
		//---------
		var p = pluginData.autoSearch;

		if(!InstantFoxModule.autoSearch)
			InstantFoxModule.autoSearch = p

		var a = InstantFoxModule.autoSearch

		if (!a.def_json || a.def_json == a.json)
			a.json = p.json
		a.def_json = p.json

		if (!a.def_url || a.def_url == a.url)
			a.url = p.url
		a.def_url = p.url
	},

	initShortcuts: function(){
		InstantFoxModule.Shortcuts = Object.create(null)
		var conflicts = Object.create(null)

		for each (var  p in InstantFoxModule.Plugins) {
			if (p.url && p.key && !p.disabled) {
				var keys = p.key.split(/\s+/)
				for each (var k in keys) {
					if (!k)
						continue

					var id = InstantFoxModule.resolveShortcut(k)
					if (id) {
						conflicts[InstantFoxModule.Plugins[id].id] = true
						conflicts[p.id] = true
					}

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
			var mP = InstantFoxModule.Plugins[p.id]
			if (mP && mP.key)
				p.key = mP.key
			InstantFoxModule.Plugins[p.id] = p
		}
		// add data from browser search engines
		importBrowserPlugins(false)

		InstantFoxModule.selectedLocale = pluginData.selectedLocale
		InstantFoxModule.defaultPlugin = pluginData.defaultPlugin
		InstantFoxModule.setContextMenuPlugins(pluginData.contextMenu)

		if(pluginData.autoSearch)
			InstantFoxModule.autoSearch = pluginData.autoSearch
		else
			return false

		return true;
	},

	getPluginString: function(forUser){
		var prefs = Services.prefs.getBranch('extensions.InstantFox.')
		var version = prefs.prefHasUserValue("version") ? prefs.getCharPref("version") : "0.0.0"

		var ob={}
		for each(var p in InstantFoxModule.Plugins)
			if(p.url)
				ob[p.id] = this.cleanCopyPlugin(p, forUser)

		var pluginData = {
			selectedLocale: InstantFoxModule.selectedLocale,
			defaultPlugin: InstantFoxModule.defaultPlugin,
			autoSearch: InstantFoxModule.autoSearch,
			version: version,
			plugins: ob,
			contextMenu: InstantFoxModule.getContextMenuPlugins("on")
		}

		return JSON.stringify(pluginData, null, forUser?4:1)
	},
	savePlugins: function(){
		if (this.req) {
			dump("WARNING: fetchAsync is too slow")
			if (this.req.loadQueue.indexOf(this.savePlugins) == -1)
				this.req.loadQueue.push(this.savePlugins)
			return
		}
		var js = this.getPluginString(false)
		writeToFile(getUserFile('instantFoxPlugins.js'), js)
	},
	scheduleSavePlugins: function(setTimeout, t) {
		if (pluginLoader.savePlugins.timeout)
			return
		pluginLoader.savePlugins.timeout = setTimeout(function() {
			pluginLoader.savePlugins()
		}, t || 100)
	},
	loadPlugins: function(locale, callback){
		var file = getUserFile('instantFoxPlugins.js')
		if (!locale && file.exists()) {
			var spec = Services.io.newFileURI(file).spec
			var onload = [
				function(str){
					try{
						if(!this.addFromUserString(str))
							throw("error")
					}catch(e){
						// settings in user profile were corrupted, load default plugins
						this.loadPlugins(true)
					}
					delete this.req
				},
				this.initShortcuts,
				callback
			];
			if(this.req)
				this.req.abort()
			this.req = fetchAsync(spec, onload, this)
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
			"fi","fr-FR","it-IT","nl","pl","pt","pt-BR","ru","tr","ja","zh-CN","sv-SE","cs","hu","ro-RO","zh-TW","el","ko"
		]
		callback && callback(a)
		return a
	},
	getPluginFileSpec: function(locale, fileName) {
		if (!fileName)
			fileName = 'plugins.json'
		if (locale == "default")
			locale = "en-US"
		var spec = 'chrome://instantfox/locale/' + fileName
		if (typeof locale == 'string') {
			var upre=/\/[^\/]*$/
			spec = getFileUri(spec).replace(upre,'').replace(upre,'')
			spec += '/'+ locale + '/' + fileName;
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
		p.disabled && (p1.disabled = p.disabled)
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
		if (this.req) {
			Cu.reportError("fetchAsync is too slow")
			if (this.req.loadQueue.indexOf(this.onInstantfoxUpdate) == -1)
				this.req.loadQueue.push(this.onInstantfoxUpdate)
			return
		}
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
function fetchAsync(href, callback, thisVal){
	var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
	req.overrideMimeType('text/plain')
	req.open('GET', href, true);
	req.loadQueue = typeof callback == 'function' ? [callback] : callback

	req.addEventListener('load', function() {
		req.removeEventListener('load', arguments.callee, false)
		var reqText = req = req.responseText

		for each(var func in callback)
			if (typeof func == 'function') try {
				func.call(thisVal, reqText);
			} catch(e){Components.utils.reportError(e)}
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

function setTimer(f, t) {
	var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer)
	timer.init(f, t || 100, 0)
	return timer
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
		domain: pluginLoader.extendedDomainFromURL(url),
		disabled:false,
		key: bp.alias,
		type:'browserSearch'
	}
}
function importBrowserPlugins(importKeys) {
	dump("importBrowserPlugins")
	try{
		var browserPlugins = Services.search.getEngines().map(pluginFromNsiSearch)
		for each(var p in browserPlugins){
			if (!InstantFoxModule.Plugins[p.id])
				InstantFoxModule.Plugins[p.id] = p
			else if (importKeys && p.key) {
				var iPlugin = InstantFoxModule.Plugins[p.id]
				if (!iPlugin.key)
					iPlugin.key = p.key
			}

			// handle default plugins
			var p1 = InstantFoxModule.Plugins[p.id]
			if(p1.type == 'browserSearch')
				pluginLoader.defPropNames.forEach(function(propName){
					p1['def_'+propName] = p[propName]
				})
		}
	}catch(e){
		Cu.reportError(e)
	}
}

searchEngineObserver = {
	observe: function(subject, topic, j){
		if (this.$pending)
			return;
		this.$pending = true
		var _this = this
		setTimer(function(){
			_this.$pending = false
			try{
				importBrowserPlugins(false)
			}catch(e){}
			_this.$listeners && _this.$listeners.forEach(function(l) {
				try{
					l.get()()
				}catch(e){Cu.reportError(e)}
			})
		}, 100)
	},
	addListener: function(w){
		if (!this.$listeners) 
			this.$listeners = [];
		this.$listeners.push(Components.utils.getWeakReference(w))
		dump(this.$listeners)
	},
	QueryInterface: function() this,
	turn: function(state){
		var f = state == "on" ? "addObserver" : "removeObserver"
		Services.obs[f](this, "engine-added", true)
		Services.obs[f](this, "engine-loaded", true)
		Services.obs[f](this, "engine-removed", true)
		Services.obs[f](this, "browser-search-engine-modified", true)
	}
}

searchEngineObserver.turn('on')

/*****************************************************
 * main object
 ***********/
InstantFoxModule = {
	helpURL: 'http://www.instantfox.net/help/',
	editingHelpURL: 'http://www.instantfox.net/help/#add-plugin',
	uninstallURL: 'http://www.instantfox.net/uninstall.php',
	deactivatedURL: 'http://www.instantfox.net/deactivated.php',
	install_url: "http://www.instantfox.net/welcome.php",
	update_url:  "http://www.instantfox.net/update.php",

	bp: this,

	getContextMenuPlugins: function(type) {
		if (!this.contextMenuPlugins)
			this.setContextMenuPlugins()

		switch(type) {
			case "default":
				return this.contextMenuPlugins[0]
			case null:
			case "on":
				return this.contextMenuPlugins
			case "off":
				var ans = []; var pList = this.contextMenuPlugins
				var add = function(id) { if (pList.indexOf(id) == -1) ans.push(id) }

				for each (var engine in this.Plugins)
					engine.disabled || add(engine.id)
				add("__search_site__")
				ans.splice(1,0,"-")
				return ans
		}
	},
	updateContextMenuPlugins: function(){
		var pList = this.getContextMenuPlugins("on")
		for (var i = pList.length; i--;) {
			var id = pList[i]
			if (id == "-" || id == "__search_site__")
				continue
			var p = this.Plugins[id]
			if (p && !p.disabled && !p.hideFromContextMenu)
				continue
			pList.splice(i, 1)
		}

		for each (var p in this.Plugins) {
			if(p.disabled || p.hideFromContextMenu)
				continue
			var id = p.id
			if (pList.indexOf(id) == -1) {
				var insertPos = pList.lastIndexOf("-")
				if (insertPos == -1)
					insertPos = pList.length
				pList.splice(insertPos - 1, 0, id)
			}
		}
	},
	setContextMenuPlugins: function(list) {
		var pList = this.contextMenuPlugins = []

		if (!list) {
			var add = function(id) { pList.push(id) }
			for each (var p in this.Plugins) {
				if(p.disabled || p.hideFromContextMenu)
					continue
				add(p.id)
			}
			add("-")
			add("__search_site__")
		} else {
			var add = function(id) { if (pList.indexOf(id) == -1) pList.push(id) }

			for (var i = 0; i < list.length; i++) {
				var id = list[i]
				if (id == "-" || id == "__search_site__") {
					this.contextMenuPlugins.push(id)
					continue
				}
				var p = this.Plugins[id]
				if(!p || p.disabled || p.hideFromContextMenu)
					continue

				this.contextMenuPlugins.push(id)
			}
		}
	},
	//
	get openSearchInNewTab(){
		delete this.openSearchInNewTab
		this.openSearchInNewTab = Services.prefs.getBoolPref("browser.search.openintab")
		return this.openSearchInNewTab
	},
	get takeSuggestedOnEnter(){
		delete this.takeSuggestedOnEnter
		var prefs = Services.prefs
		var name = "extensions.InstantFox.takeSuggestedOnEnter"
		this.takeSuggestedOnEnter = prefs.prefHasUserValue(name) && prefs.getBoolPref(name)
		return this.takeSuggestedOnEnter
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
				var domain = p.domain.replace(/\w+\:\/\/(www\.)?/, '')
				if(url.indexOf(domain)!=-1){
					match=true;
					break;
				}
				domain = domain.replace(/\.\w{1,3}(\.\w{1,3})?\//, '.@@@@/')
				if(domain == '.')
					continue
				// test in other locales
				domain = escapeRegexp(domain).replace('@@@@','\\w{1,3}(?:\.\\w{1,3})?')
				if(RegExp(domain).test(url))
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
			regexp = RegExp('[&?#]'+regexp+'([^&]+)')
		}
		do {
			var match = url.match(regexp);
			if (!match)
				break
			url = url.substr(match.index + match[0].length);
			var queryString = match[1]
		} while(match)
		if(!queryString)
			return null;
        
        if (this.Plugins.weather&& p.id=="google" && /^weather /.test(queryString)
            && /\.google\..*weather %q/.test(this.Plugins.weather.url)) {
            p = this.Plugins.weather
            queryString = queryString.substr(8)
        }

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
	Plugins: Object.create(null),
	Shortcuts: Object.create(null),
	resolveShortcut: function(key) {
		return this.Shortcuts[key]
	},
	pluginLoader: pluginLoader,

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
		dump(json, "-------------------------")
		try{
			var i = json.indexOf("[\"")
			var j = json.lastIndexOf("\"]")
			if (i != -1 && j != -1)
				xhrReturn = json.substring(i+2,j).split('","')
			else if (json && !/<[^><]>|[{\[\]]|^\s+/m.test(json)) {
				xhrReturn = json.split(/[\n\r]+/);
			}
		}catch(e) {
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
	var xhrReturn = json.match(/query"?:"[^"]*/g);
	if(!xhrReturn || !xhrReturn.length)
		return

	var results=[];
	for(var i = 0; i < xhrReturn.length; i++){
		var result = xhrReturn[i].replace(/query"?:"/, '')
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
	if (!city || /\(?null\)?/.test(city[1]))
		return
	var result = city[1]
	// side effect
	return InstantFoxModule.geoResult = [{
		icon: '',
		title: result,
		url: key + splitSpace + result
	}]
}
var parsePluginSuggestions = function(plugins, tail){
	var results=[];
	for each(var p in plugins){
		if(p.disabled)
			continue
		// todo: always use unbreakable space in plugin names?
		results.push({
			icon: p.iconURI,
			title: p.name,
			url: '`' + p.name.replace(' ', '\xB7', 'g') + tail,
			comment: p.key
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
	text = text.replace(/[`\xb7]/g, "")
	var filterText = text.toLowerCase();
	var filterTextCase = text;

	//*******/
	function computeSpringyIndex(val, prop) {
		var lowName = val[prop||'name'].toLowerCase();

		var priority = 0;
		var lastI = 0;
		var ind1 = 0;
		if (val.name.indexOf(filterTextCase) === 0) {
			if (prop) {
				val.priority = -2;
				table.push(val);
			} else {
				computeSpringyIndex(val, "title")
			}
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
			ans[name == "config" ? "unshift" : "push"]({
				url: 'about:'+ name,
				title: 'about:'+ name,
				name: name
			})
		}
	return ans.sort()
}
/*************************************************************************
 *	search component
 ***************/
function AutoCompleteResultToArray(r){
	var ans = [];
	for(var i = 0;i<r.matchCount;i++)
		ans.push({
			icon: r.getImageAt(i),
			type: r.getStyleAt(i),
			comment: r.getCommentAt(i),
			title: r.getLabelAt(i),
			url: r.getValueAt(i),
			origIndex: i
		})
	return ans
}
function SimpleAutoCompleteResult(list, searchString, defaultIndex) {
	this.setResultList(list)
	this._searchString = searchString;
	this._defaultIndex = defaultIndex == null ? -1 : defaultIndex;
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
	/*********** nsIAutoCompleteSimpleResult *********/
	setSearchResult: function(val) this._searchResult = val,
	setDefaultIndex: function(val) this._defaultIndex = val,
	setSearchString: function(aSearchString){},
	setErrorDescription: function(aErrorDescription){},
	appendMatch: function(aValue,aComment,aImage, aStyle){},
	setListener: function(aListener){},
	/********************/
	setResultList: function(list, defItem) {
		if (list) {
			var status = (list.length?'SUCCESS':'NOMATCH')
			this.list = list;
			this._defaultIndex = defItem ? list.indexOf(defItem) : -1
		} else
			var status = 'FAILURE';

		this._searchResult = Ci.nsIAutoCompleteResult['RESULT_' + status];
	},
	/********************/

	get searchResult() this._searchResult,
	get searchString() this._searchString,
	get defaultIndex() this._defaultIndex,
	get errorDescription() this._errorDescription,
	get matchCount() this.list.length,

	getCommentAt: function(index)
		this.list[index] && this.list[index].comment || "",//title attribute on richlistitem in popup
	getLabelAt: function(index)
		this.list[index] && this.list[index].title || "",//url attribute on richlistitem in popup
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
	QueryInterface: XPCOMUtils.generateQI([ Ci.nsIAutoCompleteResult, Ci.nsIAutoCompleteSimpleResult ])
};

function combinedSearch(searchProvider) {
	this.searchProvider = searchProvider
	this._result = new SimpleAutoCompleteResult()
	this._result.removeValueAt = this.removeValueAt.bind(this)
}
combinedSearch.prototype = {
	removeValueAt: function(index, removeFromDb) {

		var item = this._result.list[index]
		if (!item)
			return

		this._result.list.splice(index, 1);

		if(item.origIndex == null)
			this.historyResult(origIndex, removeFromDb)
	},
	notifyListener: function() {
		var list, l1 = this.xhrEntries, l2 = this.historyEntries
		;(InstantFoxModule.o||(InstantFoxModule.o=[])).push([l1, l2])
		
		if (!l2 || !l2.length) {
			list = l1 && l1.concat()
		} else  {
			var defaultEntry = l2[this.defaultHistoryIndex]
			var list = []
			var tip = 0
			for (var i = 0; i < l2.length; i++) {
				var item = l2[i]
				if (item.title !== item.url || item.url.length < 150)
					list.splice(tip++, 0, item)
				else
					list.push(item)
			}
			if (l1) {
				tip = Math.min(tip, 1)
				var max = Math.min(l1.length, 4)
				for (var i = 0; i < max; i++)
					list.splice(tip++, 0, l1[i])
				while(i < l1.length)
					list.push(l1[i++])
			}
		}
		
		dump(JSON.stringify(list[0], null, 4))
		this._result.setResultList(list, defaultEntry)
		this.listener.onSearchResult(this.searchProvider, this._result)
	},
	onSearchResult: function(search, historyResult) {
		this.historyResult = historyResult
		this.defaultHistoryIndex = historyResult.defaultIndex
		this.historyEntries = AutoCompleteResultToArray(historyResult)
		this.notifyListener()
	},
	onXHRReady: function(json) {
		this.xhrEntries = parseSimpleJson(json, "", "")
		for (var i = this.xhrEntries.length; i--; ) {
			this.xhrEntries[i].icon = "chrome://instantfox/content/skin/button-logo.png"
		}
		this.notifyListener()
	},
	start: function(searchString, searchParam, listener, jsonURL) {
		this.listener = listener
		this.searchString = searchString

		this.searchProvider.historyAutoComplete.stopSearch()
		this.searchProvider.historyAutoComplete.startSearch(searchString, searchParam, null, this);
		var url = jsonURL.replace('%q', encodeURIComponent(searchString))
		this.searchProvider.startReq(url)
	}
}

function InstantFoxSearch(){}
InstantFoxSearch.prototype = {
	classDescription: "Autocomplete 4 InstantFox",
	classID: Components.ID("c541b971-0729-4f5d-a5c4-1f4dadef365e"),
	contractID: "@mozilla.org/autocomplete/search;1?name=instantFoxAutoComplete",
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch, Ci.nsIAutoCompleteObserver]),

	// implement searchListener for historyAutoComplete
	onSearchResult: function(search, result) {
		this.listener.onSearchResult(this, result)
	},

	// implement nsIAutoCompleteSearch
	startSearch: function(searchString, searchParam, previousResult, listener) {
		dump(searchString, searchParam, previousResult, listener)
		if (searchString[0] == ":" || searchString.slice(0, 6) == 'about:') {
			searchString = searchString.substr(searchString[0] == ":" ? 1 : 6)
			var results = filter(getAboutUrls(), searchString)

			var newResult = new SimpleAutoCompleteResult(results, searchString);
			listener.onSearchResult(this, newResult);
			return
		}

		if (!InstantFoxModule.currentQuery) {
			var p = InstantFoxModule.autoSearch || {}
			//Search user's history
			this.$searchingHistory = true
			this.listener = listener;
			this.searchString = searchString;

			if (!p.disabled && p.suggest && searchString.length >= p.minQChars) {
				if (!this._combinedResult) {
					this._combinedResult = new combinedSearch(this)
				}
				this._combinedResult.start(searchString, searchParam, listener, p.json)
				return
			}
			this.historyAutoComplete.startSearch(searchString, searchParam, null, this);
			return
		}
		if (this.$searchingHistory)
			this.historyAutoComplete.stopSearch()

		var q = InstantFoxModule.currentQuery
		var plugin = q.plugin
		var results, url, callOnSearchReady;

		var isMaps = plugin && plugin.json && plugin.json.indexOf('http://maps.google') == 0

		if (plugin.pluginSuggestions) {
			// handle ` searches
			var results = parsePluginSuggestions(plugin.pluginSuggestions, plugin.tail)
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

		if (HttpsEverywhere) url = url.replace(/^http:/, 'https:')

		_req.open("GET", url, true);
		// without this request can generate prompts
		_req.channel.notificationCallbacks = new SearchSuggestLoadListener();
		_req.send(null);
		
		_req._url = url
	},

	onSearchReady: function(e){
		if(!this.listener)
			return
		// don't let older requests completing later mess with suggestions
		this.stopOldRequests(e.target)
		var req = e.target
		var json = req.responseText;
		
		var q = InstantFoxModule.currentQuery
		if (q) {
			var key = q.key || q.plugin.key
			q.results = this.parser(json, key, q.splitSpace)
			if (!q.results && req.status == 404 || req.status == 0) {
				q.results = [{
					comment: "request to suggest url didn't return valid json, please check your settings",
					title: req._url,
					type: "favicon",
					url: key + q.splitSpace
				}]
			}
			var newResult = new SimpleAutoCompleteResult(q.results, q.value);
			this.listener.onSearchResult(this, newResult);
			q.onSearchReady()
		} else if (this._combinedResult)
			this._combinedResult.onXHRReady(json)
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

function SearchSuggestLoadListener() { }
SearchSuggestLoadListener.prototype = {
	// nsIBadCertListener2
	notifyCertProblem: function(socketInfo, status, targetSite) { return true; },
	// nsISSLErrorListener
	notifySSLError: function(socketInfo, error, targetSite) { return true; },
	// nsIInterfaceRequestor
	getInterface: function SSLL_getInterface(iid) { return this.QueryInterface(iid); },
	// nsISupports
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIBadCertListener2, Ci.nsISSLErrorListener, Ci.nsIInterfaceRequestor])
};

/*******************************************************
 *  component registration
 *************/
InstantFoxModule.updateComponent = function(off) {
	(function(component, off){
		var reg = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
		var CONTRACT_ID = component.prototype.contractID
		try{
			reg.unregisterFactory(
				reg.contractIDToCID(CONTRACT_ID),
				reg.getClassObjectByContractID(CONTRACT_ID, Ci.nsISupports)
			)
		}catch(e){}
		if (off)
			return
		var cp = component.prototype;
		var factory = XPCOMUtils.generateNSGetFactory([component])(cp.classID);
		reg.registerFactory(cp.classID, cp.classDescription, cp.contractID, factory);
	})(InstantFoxSearch, off);
}
InstantFoxModule.shutdown = function() {
	InstantFoxModule.updateComponent('off')
	searchEngineObserver.turn('off')
}
InstantFoxModule.updateComponent()
InstantFoxModule.initialize()

/***************************************************
 * localization
 ***********************/

getBundle = function(name, locale){
	var sbs = Cc["@mozilla.org/intl/stringbundle;1"]
		.getService(Ci.nsIStringBundleService);
	/**devel__(*/ sbs.flushBundles() /**devel__)*/
	return sbs.createBundle(
		pluginLoader.getPluginFileSpec(locale, name)
	);
}

XPCOMUtils.defineLazyGetter(InstantFoxModule, "$bundle", function(){
	return getBundle('instantfox.properties');
})
XPCOMUtils.defineLazyGetter(InstantFoxModule, "$defaultBundle", function(){
	return getBundle('instantfox.properties', "default");
})

InstantFoxModule.getString = function(name) {
	try{
		return this.$bundle.GetStringFromName(name)
	}catch(e){
		try{
			return this.$defaultBundle.GetStringFromName(name)
		}catch(e1){
			Cu.reportError("no string for: " + name)
			return ""
		}
	}
}

/***************************************************
 * update notification
 ***********************/

checkVersion = function() {
	Components.utils.import("resource://gre/modules/AddonManager.jsm", {})
	.AddonManager.getAddonByID('searchy@searchy', function(addon) {
		var pb = Services.prefs.getBranch('extensions.InstantFox.')
		var oldVersion = pb.prefHasUserValue('version') ? pb.getCharPref('version') : '0.0.0'
		var uninstallVersion = pb.prefHasUserValue("uninstalled") && pb.getCharPref('uninstalled')
		var newVersion = addon.version;

		// ---------------------------- remove old pref ---------------
		if (oldVersion == '0.0.0') {
			let pbo = Services.prefs.getBranch('extensions.instantfox.')
			if (pbo.prefHasUserValue('version')) {
				oldVersion = pbo.getCharPref('version')
				pbo.deleteBranch('')
			}
		}
		// ---------------------------- --------------- ---------------

		var topWin, ifox
		// update toolbar items of loaded windows
		if (oldVersion != newVersion) {
			var e = Services.wm.getEnumerator("navigator:browser")
			while(e.hasMoreElements()) try {
				var win = e.getNext()
				ifox = win.InstantFox
				if (!ifox)
					continue
				topWin = topWin || win // show install notification in top window
				ifox.updateToolbarItems("install");
			} catch(e) {Cu.reportError(e)}
		}

		if (oldVersion == newVersion)
			return;

		pb.setCharPref("version", newVersion);
		// check if new plugins are added by this update
		try {
			InstantFoxModule.pluginLoader.onInstantfoxUpdate()
		} catch(e) {Cu.reportError(e)}

		// don't bother user with minor updates or after reenabling
		if (oldVersion.slice(0,-1) == newVersion.slice(0,-1) || uninstallVersion == newVersion)
			return

		if (oldVersion == "0.0.0") {
			var url = InstantFoxModule.install_url + '?to=' + newVersion;
			// add options button only on first install
			topWin.setTimeout(topWin.InstantFox.showInstallNotification, 600);
		} else {
			var url = InstantFoxModule.update_url + '?to=' + newVersion + '&from=' +oldVersion
		}

		topWin.setTimeout(topWin.InstantFox.addTab, 500, url);
	})
}

// this will be called after
checkVersion()