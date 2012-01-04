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
	
	var options = {
		id: popupId, noautohide:'true', position:'after_end',
		persist:'width,height', width:'400', height:'600',
		onpopupshowing: "if(event.target==this)InstantFox.onPopupShowing(this)",
		onpopuphiding: "if(event.target==this)InstantFox.onPopupHiding(this)"
	}
	$el("panel", options, [$el("stack", {flex: 1}, [
		$el('resizer', {element: popupId, dir:'bottomleft',
			left:'0', bottom:'0', width:'16', height:'16', style:'-moz-transform: rotate(90deg);' 		
		})
	])], $("mainPopupSet"))
	
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
