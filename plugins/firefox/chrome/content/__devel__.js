/** devel__( */

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

/** ************************* ---===--- ************************* **/
function makeReq(href) {
	var req = new XMLHttpRequest;
	req.open("GET", href, false);
	try {
		req.send(null);
	} catch (e) {
	}
	return req.responseText;
}

var instantFoxDevel = {
	reloadComponent: function(){
		var p = Cc["@mozilla.org/appshell/appShellService;1"]
			.getService(Ci.nsIAppShellService)
			.hiddenDOMWindow._InstantFox_Component_Scope_
		
		if(!p)
			return dump('**********************error component debugging disabled*******************');
		// uregister
		var reg = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
		var CONTRACT_ID = p.InstantFoxSearch.prototype.contractID
		try{
			reg.unregisterFactory(
				reg.contractIDToCID(CONTRACT_ID),
				reg.getClassObjectByContractID(CONTRACT_ID, Ci.nsISupports)
			)
		}catch(e){}
		
		var spec = 	Services.io.newFileURI(p.__LOCATION__).spec
		var t = makeReq(spec)
		//p.eval(t,p)		
		var sandbox = new Cu.Sandbox(Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal))
		sandbox.__LOCATION__ = p.__LOCATION__.clone()
		Cu.evalInSandbox(t, sandbox, '1.8', spec, 1);
		var scope = Cc["@mozilla.org/appshell/appShellService;1"]
			.getService(Ci.nsIAppShellService)
			.hiddenDOMWindow._InstantFox_Component_Scope_;
		var f1 = scope.InstantFoxSearch.prototype
		var f = scope.NSGetFactory(f1.classID)
		reg.registerFactory(f1.classID, f1.classDescription, f1.contractID, f);
	},
	
	reloadModule: function(href){
		//Cu.import(href).eval(makeReq(href))
		//return Cu.import(href)
		//Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader) 
		var bp = Cu.import(href)
		// query needed to confuse startupcache in ff 8.0+ 
		Services.scriptloader.loadSubScript(href+'?'+Date.now(), bp);
		return bp
	},

	loadScript: function(href, index){
		var s=document.createElementNS('http://www.w3.org/1999/xhtml', "script")
		s.type = "text/javascript;version=1.8";
		s.src = href
		s.index = index
		s.onload = function(e){instantFoxDevel.onLoad(e, this)}
		document.documentElement.appendChild(s)
	},

	/*get sourceList() {		
		var t=makeReq("chrome://instantfox/content/instantfox.xul")
		t.match(/<script.*src="(.*)"/g).map(function(x)x.match(/src="(.*)"/)[1])
	}*/
	sourceList: [
		"chrome://instantfox/content/instantfox.js",
		"chrome://instantfox/content/contentHandler.js"
	],
	moduleHref: 'chrome://instantfox/content/instantfoxModule.js',
	
	doReload: function(){
		//this.reloadComponent()
		try{InstantFox.destroy()}catch(e){}
		
		try{
			var p = document.getElementById('instantFox-options').firstChild
			while(p.hasChildNodes())
				p.removeChild(p.firstChild)
		}catch(e){}
		
		var i = this.loadedScriptsCount = 0		
		this.loadScript(this.sourceList[i], i)
	},
	onLoad: function(e, script){
		this.loadedScriptsCount++;
		if(this.loadedScriptsCount == this.sourceList.length){
			this.m = this.reloadModule(this.moduleHref)	
			// simulate document load event
			InstantFox.initialize()
		}else{
			//load next script
			var i = this.loadedScriptsCount
			this.loadScript(this.sourceList[i], i)
			dump('next')
		}		
	},
	clearFirstRunPref: function(update){
		try{
			// debug initialization
			if (update)
				Services.prefs.setCharPref("extensions.instantfox.version", 'oldVersion')
			else
				Services.prefs.clearUserPref("extensions.instantfox.version")
				
			InstantFox.updateOptionsButton(true)
		}catch(e){}
	},
	onClick: function(e){
		var action = e.target.getAttribute('action')
		switch(action){
			case 'reload':
				if (e.originalTarget.tagName != 'xul:toolbarbutton')
					return

				if(e.button == 2){
					// fallthrough
				}else{
					this.doReload()
					break
				}
			case 'test-first-run':
				this.clearFirstRunPref(e.button == 2)
				this.doReload()
				break
			case 'show-folder':
				this.getContainingFolder().reveal()
				break
			case 'build':
				makeXPI()
				break
			case 'build-d':
				break
			case 'buildLocales':
				this.buildLocales()
				break
			case 'delete-plugin-file':
				this.deletePluginFile(e.button)
				break
			case 'jsonify-plugins':
				this.jsonifyPlugins()
				break
		}
	},	
	// file utils
	getContainingFolder: function(showFile){
		return getLocalFile('chrome://instantfox/content').parent.parent.parent.QueryInterface(Ci.nsILocalFile)
	},
	deletePluginFile: function(showFile){
		var file = Cu.import(this.moduleHref).getUserFile('instantFoxPlugins.js')
		if(!file) {
			alert('already removed')
			return
		}
		file = file.QueryInterface(Ci.nsILocalFile)
		if(file.exists())
			showFile?file.reveal():file.remove(false)
		else
			alert('already removed')
	},
	jsonifyPlugins: function(){
		// override makeReq from foximirror to properly handle encodings
		function makeReq(href) {
			var req = new XMLHttpRequest;
			req.open("GET", href, false);
			try {
				req.send(null);
			} catch (e) {
			}
			return req.responseText;
		}
		
		function jsonify(locale){
			var spec = InstantFoxModule.pluginLoader.getPluginFileSpec(locale)

			var t = makeReq(spec)
			if(t.match(/^rawPluginData/))
			eval(t)
			else
			eval('rawPluginData='+t)

			var text = JSON.stringify(rawPluginData, null, 4)
			writeToFile(getLocalFile(spec), text)
		}

		InstantFoxModule.pluginLoader.getAvaliableLocales(function(locales) {
			locales.forEach(jsonify)
		})
		
	},
	buildLocales: function(){
		Services.scriptloader.loadSubScript('chrome://instantfox/content/__locales__.js?'+Date.now(), window, 'UTF-8')
		var self = this
		// and copy manifest
		InstantFoxModule.pluginLoader.getAvaliableLocales(function(locales) {
			var decl = 'locale    instantfox %n%s chrome/locale/%n/'
			var ans = locales.map(function(x){
				return decl.replace('%n', x, 'g').replace('%s', Array(9-x.length).join(' '), 'g')
			}).join('\n')
			//alert(ans)
			gClipboardHelper.copyString(ans)
			
			self.getContainingFolder().reveal()
		})
		
	}
	
}

var gClipboardHelper = {
    copyString: function(str) {
        if (str)
            this.cbHelperService.copyString(str);
    },
    getData: function() {
        try{
            var pastetext,
                clip = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard),
                trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable),
                str={},
                strLength={};

            trans.addDataFlavor("text/unicode");
            clip.getData(trans,1);
            trans.getTransferData("text/unicode",str,strLength);
            str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
            pastetext = str.data.substring(0, strLength.value/2) || "";
            return pastetext;
        } catch(e) {
            Components.utils.reportError(e);
            return "";
        }
    }
};
XPCOMUtils.defineLazyServiceGetter(gClipboardHelper, 'cbHelperService',
					"@mozilla.org/widget/clipboardhelper;1", "nsIClipboardHelper")

getLocalFile=function getLocalFile(mPath){
	var uri = Services.io.newURI(mPath, null, null),file;
	if(uri.schemeIs('resource')){//about?
		var ph = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler)
		var abspath = ph.getSubstitution(uri.host)
		uri = Services.io.newURI(uri.path.substr(1), null, abspath)
	}
	var gChromeReg = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry);

	while(uri.schemeIs('chrome')) uri = gChromeReg.convertChromeURL(uri)
	while(uri.schemeIs('jar')) uri = uri.QueryInterface(Ci.nsIJARURI).JARFile
	if(uri.schemeIs('file')) file = uri.QueryInterface(Ci.nsIFileURL).file

	return file && file.QueryInterface(Ci.nsILocalFile)
}

/**
* folder is a nsFile pointing to a folder TmpD
* callback is a function that it's called after the zip is created. It has one parameter: the nsFile created
*/
var maxRecursion=1000, recur=0, cancel=false
function makeXPI(){
	var contextFolder = instantFoxDevel.getContainingFolder()
	
	packXPI(contextFolder, function(nsFile){
		nsFile.QueryInterface(Ci.nsILocalFile).reveal()
	})
}
function packXPI(folder, callback){	
	var nsFile = folder.clone()
	
	// Create a new file
	nsFile.append(folder.leafName + ".xpi");
	if(nsFile.exists()){
		try{
			var jarProtocolHandler = Services.io.getProtocolHandler("jar").QueryInterface(Ci.nsIJARProtocolHandler);

			var jarCache = jarProtocolHandler.JARCache;
			var reader = jarCache.getZip(nsFile);
			reader.close();
		}catch(e){}
		nsFile.remove(true)
	}
	nsFile.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0666); 
  
	var zipWriter = Components.Constructor("@mozilla.org/zipwriter;1", "nsIZipWriter");
	var zipW = new zipWriter();
  
	zipW.open(nsFile, PR_RDWR | PR_CREATE_FILE | PR_TRUNCATE);
	
	
	// We don't want to block the main thread, so the zipping is done asynchronously
	// and here we get the notification that it has finished
	var observer = {
		onStartRequest: function(request, context) {},
		onStopRequest: function(request, context, status){
			zipW.close();
			// Notify that we're done.
			callback(nsFile);
		}
	}
	//for safety
	recur = 0,cancel = false
	try{
		addFolderContentsToZip(zipW, folder, "");
		zipW.processQueue(observer, null);	
	}catch(e){
		zipW.close();
		Components.utils.reportError(e)
	}
}

/**
* function to add the contents of a folder recursively
* zipW a nsIZipWriter object
* folder a nsFile object pointing to a folder
* root a string defining the relative path for this folder in the zip
*/
function addFolderContentsToZip(zipW, folder, root){
	var entries = folder.directoryEntries; 
	while(entries.hasMoreElements()){
		recur++
		if(recur>maxRecursion){
			cancel=!prompt("Processed "+maxRecursion+' files\n continue?');
			if(cancel)
				return
			else
				recur=0
		}

		var entry = entries.getNext(); 
		entry.QueryInterface(Ci.nsIFile);
		dump(entry, isInvalid(entry))
		if (isInvalid(entry))//skip archives and .svn
			continue
		
		var jarName = root + entry.leafName
		if (entry.isDirectory()) {			
			zipW.addEntryFile(jarName, Ci.nsIZipWriter.COMPRESSION_DEFAULT, entry, true);
			addFolderContentsToZip(zipW, entry, root + entry.leafName + "/");
		} else if (!/\.(xml|xul|jsm?|css)$/.test(jarName)) {
			zipW.addEntryFile(jarName, Ci.nsIZipWriter.COMPRESSION_DEFAULT, entry, true);
		} else
			addTrimmedFileContentsToJAR(zipW, jarName, entry)
	}
}
// 
addTrimmedFileContentsToJAR = function(zipW, entryPath, file){
	var data = readEntireFile(file)
	data = removeDebugCode(data)
	if (data.length < 10)
		return
	
	//var istream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);	
	//istream.setData(data, data.length);
	//todo: do we need to keep encoding from file instead of converting everything to UTF-8
	var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
	converter.charset = "UTF-8";
	var istream = converter.convertToInputStream(data)

	zipW.addEntryStream(entryPath, null, Ci.nsIZipWriter.COMPRESSION_DEFAULT, istream, true)   
}
removeDebugCode = function(code){	
	var startMarker = 'devel__' + '('
	var endMarker = 'devel__' + ')'
	var i = 0, ans = '';
	
	function readBlock(){
		var i1 = i;
		i = code.indexOf(startMarker, i)
		if (i == -1) {
			ans += code.substr(i1)
			return false
		}
		ans += code.substring(i1, i)
		
		i = code.indexOf(endMarker, i + 1)
		return i != -1;
	}
	
	var n = 100;
	while(n-- && readBlock());

	return ans.replace(/^\s*dump.*$/gm, '')
}
//
function isInvalid(entry) {
	return /\.xpi$|\.zip$|\.rar$|thumbs.db$|^\.|^__/i.test(entry.leafName)	
}

/**zr constants*/
var PR_RDONLY      = 0x01;
var PR_WRONLY      = 0x02;
var PR_RDWR        = 0x04;
var PR_CREATE_FILE = 0x08;
var PR_APPEND      = 0x10;
var PR_TRUNCATE    = 0x20;
var PR_SYNC        = 0x40;
var PR_EXCL        = 0x80;

/*************************************** File IO **********************************/
function readEntireFile(file) {
    var data = "",
        str = {},
        fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
        converter = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);

    const replacementChar = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
    fstream.init(file, -1, 0, 0);
    converter.init(fstream, "UTF-8", 1024, replacementChar);
    while (converter.readString(4096, str) != 0) {
        data += str.value;
    }
    converter.close();

    return data;
}

function writeToFile(file, text) {
    var fostream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream),
        converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);

    fostream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
    converter.init(fostream, "UTF-8", 4096, 0x0000);
    converter.writeString(text);
    converter.close();
}

