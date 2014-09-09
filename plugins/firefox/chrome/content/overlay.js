/* devel__( */ // helps to test button behavior while disabling
XULBrowserWindow.inContentWhitelist=[]
/* devel__) */
InstantFox.applyOverlay = function(off) {
    var $el = InstantFox.$el, $ = InstantFox.$, rem = InstantFox.rem
	var buttonId = 'instantFox-options', popupId = 'instantfox-popup'
	if (off) {
		[
			gNavToolbox.palette.querySelector("#" + buttonId),
			$(buttonId),
			$(popupId),
            $("instantFox-menuitem"),
		].forEach(rem)
		return
	}

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
				"build"              ,"build (right click=keep dump calls)",
				"build-lite"         ,"build lite version",
				"encodePluginList"   ,"convert pluginList to (left:ascii/right:utf-8)",
				"copyLocaleManifest" ,"copy Locales for Manifest",
				"delete-plugin-file" ,"delete-plugin-file",
				"test-first-run"     ,"test first run",
				"show-folder"        ,"show folder (right click=profile)",
				"run-tests"          ,"run tests"
			])
		)], $("status-bar"))
	/* devel__) */

	// ---------------------------
	var options = {
		id: popupId, noautohide:'true', position:'after_end',
		persist:'width,height', width:'400', height:'600',
		onpopupshowing: "if(event.target==this)InstantFox.onPopupShowing(this)",
		onpopuphiding: "if(event.target==this)InstantFox.onPopupHiding(this)",
		type: "arrow",
		flip: 'slide',
		animate:'true',
		position: 'bottomcenter topright',
		noautofocus: 'true',
		side: 'top',
		consumeoutsideclicks: 'false',
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
		image:InstantFoxModule.buttonLogoURL, label:'InstantFox'
	}, gNavToolbox.palette)

	var id = buttonId
	var selector = "[currentset^='"+id+",'],[currentset*=',"+id+",'],[currentset$=',"+id+"']"
	var toolbar = document.querySelector(selector)
	
    toolbar ?  insertButton() : insertMenuitem()

    function insertButton() {
        var currentset = toolbar.getAttribute("currentset").split(",");
        var i = currentset.indexOf(id) + 1;

        var len = currentset.length, beforeEl;
        while (i < len && !(beforeEl = $(currentset[i])))
            i++

        toolbar.insertItem(id, beforeEl);
    }
    
    function insertMenuitem() {
        InstantFox.updateMenuitem(true)        
    }
}
InstantFox.updateMenuitem = function(show) {
    var $el = InstantFox.$el, $ = InstantFox.$, rem = InstantFox.rem
    var popup = $("menu_ToolsPopup")
    var mi = $("instantFox-menuitem")
    
    if (!popup)
        return;
    if (!show)
        return mi && rem(mi);

    mi || popup.insertBefore($el("menuitem", {
          id:"instantFox-menuitem"
        , image: InstantFoxModule.buttonLogoURL
        , onclick:'document.getElementById("instantfox-popup").openPopup(gNavToolbox)', label: "InstantFox Options"
        , class: "menuitem-iconic"
    }), $("prefSep"))
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
    
    if (!p.hidePopup_orig) {
        p.hidePopup_orig = p.hidePopup;
        p.hidePopup = function() {
            this.hidePopup_orig()
            // workaround for firefox 32 bug
            if (this.getBoundingClientRect().width) {
                var ifr = this.querySelector("iframe");
                var w = ifr && ifr.contentWindow;
                if (w) {
                    w.openEditPopup(w.$('shortcuts').firstElementChild)
                } else {
                    this.parentNode.appendChild(this)
                    this.parentNode.insertBefore(this, this.parentNode.firstChild)
                }
            }
        }
    }
    
	var button = document.getElementById('instantFox-options')
    button && button.setAttribute("open", true)
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
	var button = document.getElementById('instantFox-options')
    button && button.removeAttribute("open");
}
InstantFox.updatePopupSize = function(options) {
	var RDF = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService)

	var store = PlacesUIUtils.localStore//this.RDF.GetDataSource("rdf:local-store")

	var root = RDF.GetResource("chrome://browser/content/browser.xul#instantfox-popup");

	var getPersist = function getPersist(aProperty) {
		if (!store) return null;
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

// mode = ""           follow prefs
// mode = "install"    remove searchbox and add instantfox button
// mode = "uninstall"  add searchbox if 
InstantFox.updateToolbarItems = function(mode) {		
	var navBar = document.getElementById("nav-bar");
	var curSet = navBar.currentSet.split(",");
	//**********************************************
	var oldId = "search-container"
	var newId = "instantFox-options"
	var getSearchbarPosition = function(){
		var pos = curSet.indexOf("urlbar-container") + 1;
		if (pos) {
			while (['reload-button', 'stop-button', 'search-container'].indexOf(curSet[pos]) != -1)
				pos++
		} else {
			pos = curSet.length;
		}
		return pos
	}
	var pb = Services.prefs.getBranch("extensions.InstantFox.")
	var getPref = function(name, defVal) {
		if (pb.prefHasUserValue(name))
			return pb.getBoolPref(name)
		else
			return defVal
	}
	//**********************************************
	var shouldRemoveSearchbar = getPref("removeSearchbar", true)
	var shouldRemoveOptions = getPref("removeOptions", false)
        
	dump(mode + "-ing", curSet)
	dump(InstantFoxModule._defToolbarSet)
	if (mode == "install"){
        if (shouldRemoveOptions)
            return;

		if (!InstantFoxModule._defToolbarSet)
			InstantFoxModule._defToolbarSet = curSet.concat()
		
		var i1 = curSet.indexOf(newId)
		var i2 = curSet.indexOf(oldId)
		dump("new item: old item", i1, i2)
		if (i1 >= 0 || document.getElementById(newId))
			return
		if (i2 != -1 && shouldRemoveSearchbar) {
            curSet[i2] = newId
		} else {
			var pos = getSearchbarPosition()
			curSet.splice(pos, 0, newId)
		}
	}
	else if (mode == "uninstall") {
		if (InstantFoxModule._defToolbarSet)
			curSet = InstantFoxModule._defToolbarSet
		else {
			var i1 = curSet.indexOf(newId)
			if (i1 >= 0 && !document.getElementById(oldId))
				curSet[i1] = oldId
		}
	}
	else {
		var item2Toolbar = function(id, remove) {
			dump(id, remove)
			var i = curSet.indexOf(id)
			if (remove) {
				i != -1 && curSet.splice(i, 1)
			} else if (i == -1) {
				if (document.getElementById(id))
					return
				var pos = getSearchbarPosition()
				curSet.splice(pos, 0, id)
			}
		}

		
		item2Toolbar(oldId, shouldRemoveSearchbar)
		item2Toolbar(newId, shouldRemoveOptions)
	}
	
	dump("final curset", curSet)

	//**********************************************
	curSet = curSet.join(",")
	if (curSet != navBar.currentSet){
		navBar.setAttribute("currentset", curSet);
		navBar.currentSet = curSet;
		document.persist(navBar.id, "currentset");
		try {
			BrowserToolboxCustomizeDone(true);
            InstantFox.updateMenuitem(curSet.indexOf(newId) == -1)
		} catch (e) {}
	}
}

InstantFox.updateToolbarPrefs = function(e) {
	InstantFoxModule._defToolbarSet = null
	var optionsButton = document.getElementById("instantFox-options")
	var searchBar = document.getElementById('search-container')

	Services.prefs.setBoolPref("extensions.InstantFox.removeSearchbar", !searchBar)
	Services.prefs.setBoolPref("extensions.InstantFox.removeOptions", !optionsButton)

	dump(searchBar, optionsButton, "************************************")
    
    setTimeout(InstantFox.updateMenuitem, 0, !optionsButton)
}

