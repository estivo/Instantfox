/** devel__( */


try{
	dump = Cu.import("resource://shadia/main.js").dump
}catch(e){
	dump = function() {
		var aMessage = "aMessage: ";
		for (var i = 0; i < arguments.length; ++i) {
			var a = arguments[i];
			aMessage += (a && !a.toString ? "[object call]" : a) + " , ";
		}
		var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage("" + aMessage);
	}	
	dump.clear = function() {
		Services.console.reset();
		Services.console.logStringMessage("");
	}
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
		s.onload = function(e){dump(e, this)}
		document.documentElement.appendChild(s)
	},

	/*get sourceList() {
		var t=makeReq("chrome://instantfox/content/instantfox.xul")
		t.match(/<script.*src="(.*)"/g).map(function(x)x.match(/src="(.*)"/)[1])
	}*/
	sourceList: [
		"chrome://instantfox/content/instantfox.js",
		"chrome://instantfox/content/contentHandler.js",
		"chrome://instantfox/content/overlay.js"
	],
	moduleHref: 'chrome://instantfox/content/instantfoxModule.js',

	doReload: function(){
		XPIProviderBP = Components.utils.import("resource://gre/modules/XPIProvider.jsm")
		XPIProvider = XPIProviderBP.XPIProvider
     
		var id="searchy@searchy"
		let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
		file.persistentDescriptor = XPIProvider.bootstrappedAddons[id].descriptor;
		XPIProvider.callBootstrapMethod(id, XPIProvider.bootstrappedAddons[id].version,
								   XPIProvider.bootstrappedAddons[id].type, file, "shutdown",
								   XPIProviderBP.BOOTSTRAP_REASONS.ADDON_UPGRADE);
		
		delete XPIProvider.bootstrapScopes[id]
		XPIProviderBP.flushStartupCache()
		
		XPIProvider.callBootstrapMethod(id, XPIProvider.bootstrappedAddons[id].version,
								   XPIProvider.bootstrappedAddons[id].type, file,
								   "startup", XPIProviderBP.BOOTSTRAP_REASONS.APP_STARTUP);
	},
	clearFirstRunPref: function(update){
		try{
			var prefs = Services.prefs
			
			//Services.prefs.resetBranch("extensions.InstantFox.")//not implemented:(
			//Services.prefs.deleteBranch("extensions.InstantFox.")
			//InstantFox.updateOptionsButton(true)
			prefs.getChildList("extensions.InstantFox.",{},{}).forEach(function(x){
				prefs.clearUserPref(x)
			})
			
			if (update)
				prefs.setCharPref("extensions.InstantFox.version", 'oldVersion')
		}catch(e){}
	},
	testFirstRun: function(isUpdate){
		this.clearFirstRunPref(isUpdate)
		this.doReload()
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
				this.testFirstRun(e.button == 2)
				break
			case 'show-folder':
				(e.button == 2
					? InstantFoxModule.bp.getUserFile('instantFoxPlugins.js')
					: this.getContainingFolder()
				).reveal()
				break
			case 'build':
				makeXPI(instantFoxDevel.getContainingFolder(), e.button == 2)
				break
			case 'copyLocaleManifest':
				this.copyLocaleManifest(e.button == 2)
				break
			case 'encodePluginList':
				this.encodePluginList(e.button == 2)
				break
			case 'delete-plugin-file':
				this.deletePluginFile(e.button)
				break
			case 'run-tests':
				this.loadScript('chrome://instantfox/content/.tests/testRunner.js')
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
	encodePluginList: function(utf){
		var spec = "chrome://instantfox/content/defaultPluginList.js"
		
		var str = makeReq(spec)
		if (utf)	
			str = str.replace(/\\u[\da-fA-F]{4}/g, function(x, i, str) {
				if (str[i-1]=="\\")
					return x
				return String.fromCharCode(parseInt(x.substr(2),16))
			})
		else
			str = str.replace(/[\u0080-\uFFFF]/g, function(x) {
				x = x.charCodeAt(0).toString(16)
				return "\\u"+ Array(5-x.length).join("0") + x
			})

		writeToFile(getLocalFile(spec), str)
	
		var oldLocales = JSON.stringify(InstantFoxModule.pluginLoader.getAvaliableLocales())
		var pluginList = this.reloadModule(spec)
		pluginList.getString(InstantFoxModule)
		
		var newLocales = JSON.stringify(pluginList.avaliableLocaleNames)
		if (oldLocales != newLocales){
			gClipboardHelper.copyString(newLocales)
			alert("new locales added!, add clipboard text to InstantFoxModule")
		}
	},
	
	copyLocaleManifest: function(){
		var f = getLocalFile('chrome://instantfox/locale/plugins.js').parent.parent
		
		var href = Services.io.getProtocolHandler("file")
			.QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(f)
		var t = makeReq(href)
		
		var locales = t.match(/201\: [^ ]* /g).map(function(x)x.slice(5,-1).replace(/\/$/, ''))
		var decl = 'locale    instantfox %n%s chrome/locale/%n/'
		var ans = locales.map(function(x){
			return decl.replace('%n', x, 'g').replace('%s', Array(9-x.length).join(' '), 'g')
		}).join('\n')
		gClipboardHelper.copyString(ans)
	}

}



/********************************* xpi builder ******************************************************/
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
function makeXPI(contextFolder, keepDebugCode){
	packXPI.keepDebugCode = keepDebugCode
	if (keepDebugCode){
		packXPI.isInvalid = function(entry) {
			return /\.xpi$|\.zip$|\.rar$|thumbs.db$|^\./i.test(entry.leafName)
		}
	}else{
		packXPI.isInvalid = function(entry) {
			return /\.xpi$|\.zip$|\.rar$|thumbs.db$|^\.|^_/i.test(entry.leafName)
		}	
	}
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
		dump(entry, packXPI.isInvalid(entry))
		if (packXPI.isInvalid(entry))//skip archives and .svn
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
	if (!packXPI.keepDebugCode)
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

	// remove dump
	Components.utils.import("resource://gre/modules/reflect.jsm");
	
	var anstemp = ans.replace(/^\s*dump.*$/gm, '')	
	
	if (ans != anstemp) try {
		var wasValid
		try {
			Reflect.parse(ans)
			wasValid = true
		} catch(e) {}
		wasValid && Reflect.parse(anstemp)
		ans = anstemp
	} catch(e){Cu.reportError("unable to remove dump" + e);dump(anstemp)}
	
	return ans
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

