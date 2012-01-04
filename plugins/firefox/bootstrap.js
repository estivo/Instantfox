/** use this code in console to access global for this file

var XPIProviderBP = Components.utils.import("resource://gre/modules/XPIProvider.jsm")
XPIProviderBP.XPIProvider.bootstrapScopes["instant@maps.de"]

/******************************************************************/

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");

function loadIntoWindow(win) {	
	/*devel__(*/
		Services.obs.notifyObservers(null, "startupcache-invalidate", null);
		Services.scriptloader.loadSubScript( 'chrome://instantfox/content/__devel__.js', win);
	/*devel__)*/
	for each (var x in ["instantfox", "contentHandler", "overlay"]) try {
		Services.scriptloader.loadSubScript( 'chrome://instantfox/content/'+x+'.js', win);
	} catch(e) {Cu.reportError(e)}
	
	win.InstantFox.initialize()
}

function unloadFromWindow(win){
	try {
		// delete all added variables and remove eventListeners
		win.instantmaps_loader.uninit()
	}catch(e){Cu.reportError(e)}
}

WindowListener = {
	onOpenWindow: function(win){
		// Wait for the window to finish loading
		win = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow).window;
		win.addEventListener("load", function() {
			win.removeEventListener("load", arguments.callee, false);
			if (win.location.href == 'chrome://browser/content/browser.xul')
				loadIntoWindow(win)
		}, false);
	},
	onCloseWindow: function(win) {},
	onWindowTitleChange: function(win, aTitle) {}
}

/**************************************************************************
 * bootstrap.js API
 *****************/
function startup(aData, aReason) {
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)  
		Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
							.addBootstrappedManifestLocation(aData.installPath)
	Services.io.getProtocolHandler('resource')
		.QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution(
			'instantfox',
			Services.io.newURI(__SCRIPT_URI_SPEC__+'/../modules/', null, null)    
		)
	// Load into any existing windows
	var enumerator = Services.wm.getEnumerator("navigator:browser");
	while (enumerator.hasMoreElements()) {
		var win = enumerator.getNext();
		loadIntoWindow(win);
	}
	// Load into all new windows
	Services.wm.addListener(WindowListener);
}

function shutdown(aData, aReason) {
	// no need to cleanup, everything goes to die anyway
	if (aReason == APP_SHUTDOWN)
		return;

	// Unload from any existing windows
	var enumerator = Services.wm.getEnumerator("navigator:browser");
	while (enumerator.hasMoreElements()) {
		var win = enumerator.getNext();
		unloadFromWindow(win);
	}
	Services.wm.removeListener(WindowListener);
	
	Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution('instantfox',null)
	
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)  
		Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
			.removeBootstrappedManifestLocation(aData.installPath)
	
	Cu.unload('chrome://instantfox/content/instantfoxModule.js')
}

function install(aData, aReason) {
	/*devel__(*/
		dump = Cu.import("resource://shadia/main.js").dump
		dump(aData, aReason, arguments.callee.name, "--------------------")
	/*devel__)*/
}

function uninstall(aData, aReason) {
	/*devel__(*/
		dump = Cu.import("resource://shadia/main.js").dump
		dump(aData, aReason, arguments.callee.name, "--------------------")
	/*devel__)*/
}
