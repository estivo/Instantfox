/** use this code in console to access global for this file

var XPIProviderBP = Components.utils.import("resource://gre/modules/XPIProvider.jsm")
XPIProviderBP.XPIProvider.bootstrapScopes["instant@maps.de"]

/******************************************************************/
/*devel__(*/
try{
	dump = Components.utils.import("resource://shadia/main.js").dump
}catch(e){}
/*devel__)*/
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
		win.InstantFox.destroy()
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
	dump(aReason, "---------------------------")
	// || aReason == ADDON_UNINSTALL happens on update ?
	if (aReason == ADDON_DISABLE ) try {
		var pb = Services.prefs.getBranch('extensions.InstantFox.')
		var noticeshown = pb.prefHasUserValue("uninstalled") && pb.getCharPref("uninstalled")
		if (noticeshown != aData.version) {
			var win = Services.wm.getMostRecentWindow('navigator:browser')
			var iFox = win.InstantFox
			iFox.addTab(win.InstantFoxModule.uninstallURL + '?version=' + aData.version + '&face=:(')
			// restore searchbar
			iFox.updateToolbarItems(false, false);
			pb.setCharPref("uninstalled", aData.version)
		}
	} catch (e) {Cu.reportError(e)}
	
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
	
	Cu.import('chrome://instantfox/content/instantfoxModule.js')
	InstantFoxModule.updateComponent('off')

	Cu.unload('chrome://instantfox/content/instantfoxModule.js')
	Cu.unload('chrome://instantfox/content/defaultPluginList.js')
}

function install(aData, aReason) {
	/*devel__(*/
		dump = Components.utils.import("resource://shadia/main.js").dump
		dump(aData, aReason, arguments.callee.name, "--------------------")
	/*devel__)*/
}

function uninstall(aData, aReason) {
	/*devel__(*/
		dump = Components.utils.import("resource://shadia/main.js").dump
		dump(aData, aReason, arguments.callee.name, "--------------------")
	/*devel__)*/
}
