InstantFox.applyOverlay = function() {
    var $el = InstantFox.$el, $ = InstantFox.$, rem = InstantFox.rem
	var buttonId = 'instantFox-options', popupId = 'instantfox-popup'
	InstantFox.idsToRemove.push(buttonId, popupId)
	
	/* devel__( */
	var $elList = function(name, attrNames, attrVals) {
		var count = attrVals && attrVals.length
		if (typeof attrNames == "number") {
			count = attrNames
			attrNames = null
		}
		if (!count || count < 1)
			return []

		var ans = [], i = 0
		while (i < count) {
			var el = document.createElement(name)
			attrNames || i++
			for each(var a in attrNames)
				el.setAttribute(a, attrVals[i++])
			ans.push(el)
		}
		return ans
	}
	rem("instantFox-devel")
	$el("toolbarbutton", { id:"instantFox-devel"
		, type:"menu-button", class:"bookmark-item", context:'', action: "reload"
		, image:"chrome://instantfox/content/skin/button-logo.png"
		, onclick:"instantFoxDevel.onClick(event)", label:"instantFoxDevel"
		}, [$el("menupopup", {},
			$elList("menuitem", ["action", "label"], [
				"build"              , "build",
				"encodePluginList"   ,"convert pluginList to (left:ascii/right:utf-8)",
				"copyLocaleManifest" ,"copy Locales for Manifest",
				"delete-plugin-file" ,"delete-plugin-file",
				"test-first-run"     ,"test first run",
				"show-folder"        ,"show folder",
				"run-tests"          ,"run tests"				
			])
		)], $("status-bar")) 
	/* devel__) */
	
	// ---------------------------
	var options = {
		id: popupId, noautohide:'true', position:'after_end',
		persist:'width,height', width:'400', height:'600',
		onpopupshowing: "if(event.target==this)InstantFox.onPopupShowing(this)",
		onpopuphiding: "if(event.target==this)InstantFox.onPopupHiding(this)"
	}
	InstantFox.updatePopupSize(options)
	$el("panel", options, [$el("stack", {flex: 1}, [
		$el('resizer', {element: popupId, dir:'bottomleft',
			left:'0', bottom:'0', width:'16', height:'16', style:'-moz-transform: rotate(90deg);' 		
		})
	])], $("mainPopupSet"))
	// ---------------------------
	
	var toolbarButton = $el('toolbarbutton', {type:"menu", popup: popupId, id: buttonId,
		class:'toolbarbutton-1 chromeclass-toolbar-additional',
		image:'chrome://instantfox/content/skin/button-logo.png', label:'InstantFox'
	}, ($("navigator-toolbox") || $("mail-toolbox")).palette)
	
	var id = buttonId
	var selector = "[currentset^='"+id+",'],[currentset*=',"+id+",'],[currentset$=',"+id+"']"
	var toolbar = document.querySelector(selector)
	if (!toolbar) 
		return
	
	var currentset = toolbar.getAttribute("currentset").split(",");
    var i = currentset.indexOf(id) + 1;

    var len = currentset.length, beforeEl;
    while (i < len && !(beforeEl = $(currentset[i])))
		i++
  
	toolbar.insertItem(id, beforeEl);
}

//************************************************************************
// options popup
InstantFox.popupCloser = function(e) {
	var inPopup = InstantFox.clickedInPopup
	InstantFox.clickedInPopup = false
	if (inPopup || e.target.nodeName == 'resizer')
		return
	if (e.target.id == 'instantFox-options') {
		e.stopPropagation()
		e.preventDefault()
	}
	window.removeEventListener('mousedown', InstantFox.popupCloser, false)
	document.getElementById('instantfox-popup').hidePopup()
}
InstantFox.onPopupShowing = function(p) {
	if (p.id != 'instantfox-popup')
		return

	document.getElementById('instantFox-options').setAttribute("open", true)
	window.addEventListener('mousedown', InstantFox.popupCloser, false)

	var st = p.querySelector('stack')
	var ifr = p.querySelector('iframe')
	if (ifr) {
		// touch the stack, otherwise it isn't drawn in nightly
		st.flex = 0
		st.flex = 1
		// rebuild in case user modified plugins by another options window instance
		try {
			ifr.contentWindow.onOptionsPopupShowing()
		} catch(e){Components.utils.reportError(e)}
		return;
	}
	var ifr = InstantFox.$el('iframe', {
		src: 'chrome://instantfox/content/options.xul',
		flex: '1'
	})
	st.insertBefore(ifr, st.firstChild)
}
InstantFox.onPopupHiding = function(p) {
	var ifr = p.querySelector('iframe')
	ifr.contentWindow.saveChanges()
	window.removeEventListener('mousedown', InstantFox.popupCloser, false)
	document.getElementById('instantFox-options').removeAttribute("open");
}
InstantFox.updatePopupSize = function(options) {
	var RDF = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService)

	var store = PlacesUIUtils.localStore//this.RDF.GetDataSource("rdf:local-store")

	var root = RDF.GetResource("chrome://browser/content/browser.xul#instantfox-popup");

	var getPersist = function getPersist(aProperty) {
		let property = RDF.GetResource(aProperty);
		let target = store.GetTarget(root, property, true);
		if (target instanceof Ci.nsIRDFLiteral)
			return target.Value;
	}
	options.width  = getPersist("width")  || options.width
	options.height = getPersist("height") || options.height
}
InstantFox.popupClickListener = function(e) {
	InstantFox.clickedInPopup = true
}
InstantFox.closeOptionsPopup = function(p) {
	p = p || document.getElementById('instantfox-popup')
	p.hidePopup()
}
InstantFox.openHelp = function() {
	var url = InstantFoxModule.helpURL
	gBrowser.loadOneTab(url, {inBackground: false, relatedToCurrent: true});
}

// called after window load on first install
InstantFox.updateToolbarItems = function(removeOptions, removeSearchbar) {
	var prefs = Services.prefs.getBranch("extensions.InstantFox.")
	if (removeSearchbar == undefined)
		removeSearchbar = prefs.prefHasUserValue("removeSearchbar") ? prefs.getBoolPref("removeSearchbar") : false
	else
		prefs.setBoolPref("removeSearchbar", removeSearchbar)
		
	if (removeOptions == undefined)
		removeOptions = prefs.prefHasUserValue("removeOptions") ? prefs.getBoolPref("removeOptions") : true
	else
		prefs.setBoolPref("removeOptions", removeOptions)

		
	var navBar = document.getElementById("nav-bar");
	var curSet = navBar.currentSet.split(",");

	var myId = "instantFox-options";
	var i = curSet.indexOf(myId)
	if (!removeOptions && i == -1 && !document.getElementById(myId)) {
		var pos = curSet.indexOf("urlbar-container") + 1;
		if (pos) {
			while ('reload-button,stop-button'.indexOf(curSet[pos]) != -1)
				pos++
		} else
			pos = curSet.length;
		curSet.splice(pos, 0, myId)
	} else if (i != -1 && removeOptions) {
		curSet.splice(i, 1)
	}

	// remove searchbar
	var myId = "search-container"
	var i = curSet.indexOf(myId)
	if (i == -1 && !removeSearchbar) {
		var pos = curSet.indexOf("urlbar-container") + 1;
		if (!pos)
			pos = curSet.length;
		curSet.splice(pos, 0, myId)
	} else if (i != -1 && removeSearchbar) {
		curSet.splice(i, 1)
	}

	curSet = curSet.join(",")
	if (curSet != navBar.currentSet){
		navBar.setAttribute("currentset", curSet);
		navBar.currentSet = curSet;
		document.persist(navBar.id, "currentset");
		try {
			BrowserToolboxCustomizeDone(true);
		}catch (e) {}
	}
}
InstantFox.afterCustomization = function(e){
	var optionsButton = document.getElementById("instantFox-options")
	var searchBar = document.getElementById('search-container')
	
	Services.prefs.setBoolPref("extensions.InstantFox.removeSearchbar", !searchBar)
	Services.prefs.setBoolPref("extensions.InstantFox.removeOptions", !optionsButton)
	
	dump(searchBar, optionsButton, "************************************")
}

