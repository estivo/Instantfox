var __instantFoxDevel__ = {
	reloadComponent: function(){
		if(!_InstantFox_Component_Scope_)
			return;
		// uregister
		var reg = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
		var p = _InstantFox_Component_Scope_;
		var CONTRACT_ID = p.InstantFoxSearch.prototype.contractID
		try{
			reg.unregisterFactory(
				reg.contractIDToCID(CONTRACT_ID),
				reg.getClassObjectByContractID(CONTRACT_ID, Ci.nsISupports)
			)
		}catch(e){}
		
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
		var spec = 	Services.io.newFileURI(p.__LOCATION__).spec
		var t = makeReq(spec)
		//p.eval(t,p)		
		var sandbox = new Cu.Sandbox(Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal))
		sandbox.__LOCATION__ = p.__LOCATION__.clone()
		Cu.evalInSandbox(t, sandbox, '1.8', spec, 1);
		var scope = _InstantFox_Component_Scope_
		var f1 = scope.InstantFoxSearch.prototype
		var f = scope.NSGetFactory(f1.classID)
		reg.registerFactory(f1.classID, f1.classDescription, f1.contractID, f);
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
		
	],
	
	doReload: function(){		
		
		for(var i in this.sourceList){
			this.loadScript(this.sourceList[i],i)
		}
		this.reloadComponent()
	},
	onLoad: function(){
		this.loadedScriptsCount++;
		if(this.loadedScriptsCount == this.sourceList.length){
			// simulate onload
			
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