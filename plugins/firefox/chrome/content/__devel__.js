function makeReq(href) {
	var req = new XMLHttpRequest;
	req.overrideMimeType("text/plain");
	req.open("GET", href, false);
	try {
		req.send(null);
	} catch (e) {
	}
	return req.responseText;
}

var __instantFoxDevel__ = {
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
		Services.scriptloader.loadSubScript(href, bp);
		return bp
	},

	loadScript: function(href, index){
		var s=document.createElementNS('http://www.w3.org/1999/xhtml', "script")
		s.type = "text/javascript;version=1.8";
		s.src = href
		s.index = index
		s.onload = function(e){__instantFoxDevel__.onLoad(e, this)}
		document.documentElement.appendChild(s)
	},

	sourceList: [
		//"chrome://instantfox/content/javascripts/app.js",
		//"chrome://instantfox/content/javascripts/plugins.js",
		//"chrome://instantfox/locale/plugins.js",
		"chrome://instantfox/content/instantfox.js"
	],
	moduleHref: 'chrome://instantFox/content/instantFoxModule.js',
	
	doReload: function(){
		//this.reloadComponent()
		var i = this.loadedScriptsCount = 0		
		this.loadScript(this.sourceList[i], i)
		
		this.m = this.reloadModule(this.moduleHref)		
	},
	onLoad: function(e, script){
		this.loadedScriptsCount++;
		if(this.loadedScriptsCount == this.sourceList.length){
			// simulate document load event
			instantFoxLoad()
		}else{
			//load next script
			var i = this.loadedScriptsCount
			this.loadScript(this.sourceList[i], i)
			dump('next')
		}		
	}
}

window.addEventListener('load', function(){
	window.removeEventListener('load', arguments.callee, false)
	if(!document.getElementById('__instantFoxDevel__')){
		let t=document.createElement('toolbarbutton')
		t.setAttribute('oncommand','__instantFoxDevel__.doReload()')
		t.setAttribute('id', '__instantFoxDevel__')
		t.setAttribute('label', 'instantFoxDevel')
		t.textContent = 'instantFoxDevel'
		document.getElementById("status-bar").appendChild(t)
	}
}, false)


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
/*
function log(msg) {
  if(typeof Firebug != 'undefined') {
	Firebug.Console.log(msg);
  } else {
	Components.utils.reportError(msg);
  }
  return msg;
}
function print_r(x, max, sep, l) {	
	l = l || 0;
	max = max || 10;
	sep = sep || ' ';
	
	if (l > max) {
		return "[WARNING: Too much recursion]\n";
	}

	var
		i,
		r = '',
		t = typeof x,
		tab = '';

	if (x === null) {
		r += "(null)\n";
	} else if (t == 'object') {
		l++;

		for (i = 0; i < l; i++) {
			tab += sep;
		}

		if (x && x.length) {
			t = 'array';
		}

		r += '(' + t + ") :\n";

		for (i in x) {
			try {
				r += tab + '[' + i + '] : ' + print_r(x[i], max, sep, (l + 1));
			} catch(e) {
				return "[ERROR: " + e + "]\n";
			}
		}

	} else {

		if (t == 'string') {
			if (x == '') {
				x = '(empty)';
			}
		}

		r += '(' + t + ') ' + x + "\n";

	}	
	return r;	
};
*/ 



/*
var reg=Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
reg.isContractIDRegistered('@mozilla.org/autocomplete/search;1?name=instantFoxAutoComplete')
f=getLocalFile('chrome://instantfox/content/g').parent.parent.parent
f.append('components')
f.append('instantfox_search.js')
Cc["@mozilla.org/autocomplete/search;1?name=instantFoxAutoComplete"]
Cc[contractid].number
//Components.ID("c541b971-0729-4f5d-a5c4-1f4dadef365e").number==Cc[contractid].number
f1 = InstantFoxSearch.prototype
f = NSGetFactory(f1.classID)
reg.registerFactory(f1.classID, f1.classDescription, f1.contractID, f);

contractID="@mozilla.org/autocomplete/search;1?name=instantFoxAutoComplete"
var reg=Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
try{
reg.unregisterFactory(
	reg.contractIDToCID(contractID),
	reg.getClassObjectByContractID(contractID,Ci.nsISupports)
)
}catch(e){}

p=jn.getParent(uiiu)
t=makeReq(Services.io.newFileURI(p.__LOCATION__).spec)

p.eval(t,p)

*/