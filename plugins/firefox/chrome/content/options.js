var Cc = Components.classes
var Ci = Components.interfaces

Components.utils.import("resource://gre/modules/Services.jsm");
ibp = Components.utils.import('chrome://instantfox/content/instantfoxModule.js')

//************** find all avaliable locales

function updateLocaleList(){
	ibp.pluginLoader.getAvaliableLocales(function(locales)  {
		var sbs = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
		var langNames = sbs.createBundle("chrome://global/locale/languageNames.properties");
		var regNames  = sbs.createBundle("chrome://global/locale/regionNames.properties");

		function addDisplayName(locale) {
			var parts = locale.split(/-/);
			var displayName;
			try {
				displayName = langNames.GetStringFromName(parts[0]);
				try {
					displayName += " (" + regNames.GetStringFromName((parts[1]||parts[0]).toLowerCase()) + ")";
				} catch (e) {}
			} catch (e) {
				displayName = '';
			}
			return {displayName: displayName, id: locale}
		}

		var locales = locales.map(addDisplayName)

		locales.sort(function(x, y)x.displayName > y.displayName)

		var xml = []
		for each(var i in locales)
			xml.push('<menuitem label="', i.displayName, '" value="', i.id ,'">',
				'<label value="', i.displayName, '"/><hbox flex="1"/><label value="', i.id, '"/>',
			'</menuitem>')

		var menulist = $('locale')
		clean(menulist.firstChild)
		appendXML(menulist.firstChild, xml.join(''))

		// find selected index
		var sl = InstantFoxModule.selectedLocale.toLowerCase()
		var slPart = sl.substring(0, sl.indexOf('-'))
		var si = -1, siPart = -1;
		for (var i in locales){
			var loc = locales[i].id.toLowerCase()
			if(loc == sl){
				si = i
				break
			}
			if(loc == slPart){
				siPart = i
			}
		}
		if(si == -1)
			si = siPart

		menulist.selectedIndex = si
	})
}
globalInstant = {
	recomended: ["google","googlemaps", "googleimages", "wikipedia", "youtube", "amazon", "weather", "calculator"],
	onCommand: function(e){
		var v = e.target.value
		if (v == 'all') {
			for each(var p in InstantFoxModule.Plugins)
				p.disableInstant = false
		} else if (v == 'recomended') {
			for each(var p in InstantFoxModule.Plugins)
				p.disableInstant = !~this.recomended.indexOf(p.id)
		} else if (v == 'none') {
			for each(var p in InstantFoxModule.Plugins)
				p.disableInstant = true
		}
		gPluginsChanged = true
		rebuild()
	},
	update: function(){
		var ml = $("global-instant")

		var all = 0, dis = 0, good = 0, goodDis = 0
		for each(var p in InstantFoxModule.Plugins){
			if(p.disabled || !p.url)
				continue

			all++
			p.disableInstant && dis++
			//if(p.id=='google' || p.id = 'googletranslate')
			if(this.recomended.indexOf(p.id)>-1)
				p.disableInstant? goodDis++: good++
		}

		var v
		if(dis == 0)
			v = 'all'
		else if(dis == all)
			v = 'none'
		else if(goodDis == 0 && good + dis == all)
			v = 'recomended'
		else
			v = 'manual'

		ml.selectedItem = ml.querySelector("[value="+v+"]")

		return v
	}
}
//************* dom utils
function $(id) {
	return document.getElementById(id)
}
function $t(el, aID) {
	return el && el.getElementsByAttribute('aID', aID)[0]
}
function $parent(el) {
	while(el){
		if(el.id)
			return el
		el=el.parentNode
	}
}
function $el(name, att, parent) {
	var el = document.createElement(name)
	for (var a in att)
		el.setAttribute(a, att[a])
	if (parent)
		parent.appendChild(el)
	
	return el
}


function clean(el){
	var ch
	while(ch=el.lastChild)
		el.removeChild(ch)
}
function appendXML(element, xml){
	var range = document.createRange()
	range.selectNode(element)
	range.collapse(true)
	var fragment = range.createContextualFragment(xml)

	return element.appendChild(fragment)
}
function replaceXML(element, xml){
	var range = document.createRange()
	range.selectNode(element)
	var fragment = range.createContextualFragment(xml)

	return element.parentNode.replaceChild(fragment, element)
}
function formatString(string, options){
	return string.replace(/\$[^\$]*\$/g, function(x){
		var x = x.slice(1,-1)
		if(x[0]=='!')
			return options[x.substr(1)]?'false':'true'
		if(x[0]=='_'){
			x = x.substr(1)
			var strName = options[x]
			return escapeHTML(i18n.get(x+"_"+strName))
		}
		if(typeof options[x]=='string')
			return escapeHTML(options[x])
		if(typeof options[x]=='number')
			return options[x].toString()
		return options[x] ? options[x].toString() : ''
	})
}
function escapeHTML(str) str.replace(/[&"'<>]/g, function(m)"&#"+m.charCodeAt(0)+";");

//************************ context menu
initContextMenu = function(popup){
	var item = document.popupNode
	item = $parent(item)
	var selectedItems = $('shortcuts').selectedItems

	for each(var aID in ['disableInstant', 'disableSuggest', 'hideFromContextMenu', 'disabled'])
		$t(popup, aID).setAttribute(
			'checked',
			!selectedItems.some(function(x){
				var p = InstantFoxModule.Plugins[x.id]
				return !p || p[aID]
			})
		)
		
	var editItem = $t(popup, 'edit')
	var visible = selectedItems.length == 1 && !InstantFoxModule.Plugins[selectedItems[0].id].disabled
	editItem.hidden = !visible
}
onContextMenuCommand = function(e){
	var menu = e.target
	var name = menu.getAttribute('aID')
	var item = document.popupNode
	item = $parent(item)
	if (name=='edit'){
		openEditPopup(item.lastElementChild)
		return
	}

	var rbox = $("shortcuts")
	var selectedItems = rbox.selectedItems
	var value = menu.getAttribute('checked')!='true'

	var ids = []

	selectedItems.forEach(function(x){
		ids.push(x.id)
		InstantFoxModule.Plugins[x.id][name] = value
	})

	rebuild()

	//restore selection
	ids.forEach(function(x){
		rbox.addItemToSelection($(x));
	})


}

//************************ edit popup utils
var gPlugin, gPluginsChanged, gPrefChanged, gToolbarsChanged, resultOK = true;
initEditPopup = function(plugin, panel){
	if(plugin)
		gPlugin = ibp.pluginLoader.cleanCopyPlugin(plugin)
	else
		gPlugin = createEmptyPlugin(plugin)

	$t(panel, 'instant').checked = !gPlugin.disableInstant
	$t(panel, 'instant').doCommand()
	$t(panel, 'image').src = gPlugin.iconURI
	$t(panel, 'key').value = gPlugin.key

	for each(var i in ['url', 'name', 'json']){
		var box = $t(panel, i)
		box.value = gPlugin[i] || '';
		box.nextSibling.hidden = !canResetProp(box)
	}

	var suggest = !gPlugin.disableSuggest // !!(gPlugin.json && !gPlugin.disableSuggest)
	var chkbox = $t(panel, 'suggest')
	chkbox.checked = suggest
	chkbox.doCommand()

	var rem =  $t(panel, 'disable')
	if(plugin){
		rem.label = i18n.get('disable');
		rem.hidden = false;
		$t(panel, 'remove').hidden = false
	}else{
		$t(panel, 'remove').hidden = true
		rem.label = i18n.get('cancel');
		rem.hidden = false;
	}
}
createEmptyPlugin=function(){
	var i=0
	while(InstantFoxModule.Plugins['user'+i])
		i++
	return {
		type: 'user',
		id: 'user'+i,
		name: '',
		key: '',
		url: '',
		json: '',
		iconURI: '',
		createNew: true
	}
}
openEditPopup = function(item, anchor){
	if(item.id == autoSearchUI.id){
		var panel = $('edit-box-autoSearch')
		autoSearchUI.init()
	} else {
		var panel = $('edit-box')
		var plugin = InstantFoxModule.Plugins[item.id]
		initEditPopup(plugin, panel)
	}
	$openPopup(panel, anchor || item.lastElementChild || item)
}

function $openPopup(panel, anchor){
	// without this, arrow isn't shown first time
	if (!panel.openedOnce){
		// todo popupshowing attribute
		var onpopuphiding = panel.getAttribute("onpopuphiding")
		panel.removeAttribute("onpopuphiding")
		panel.openPopup(anchor)
		panel.hidePopup()
		panel.openedOnce = true
		panel.setAttribute("onpopuphiding", onpopuphiding)
	}	
	var popupBoxObject = panel.popupBoxObject;
	popupBoxObject.setConsumeRollupEvent(popupBoxObject.ROLLUP_NO_CONSUME);
	panel.openPopup(anchor, 'start_before', 0, 0, false, true)
}

editPopupSave = function(panel){
	if(!gPlugin)
		return

	gPlugin.disableSuggest = !$t(panel, 'suggest').checked
	gPlugin.disableInstant = !$t(panel, 'instant').checked

	gPlugin.name = $t(panel, 'name').value
	gPlugin.json = $t(panel, 'json').value
	gPlugin.url = $t(panel, 'url').value || gPlugin.url
	gPlugin.key = $t(panel, 'key').value
	gPlugin.iconURI = $t(panel, 'image').src

	saveGPlugin()
	return true
}

saveGPlugin = function(createNew){
	if (gPlugin.createNew) {
		ibp.fixupPlugin(gPlugin)
		if(!gPlugin.url)
			return
		InstantFoxModule.Plugins[gPlugin.id] = gPlugin;
	} else {
		// todo: is this needed
		var el = $(gPlugin.id)
 		if (!el)
			return;
	}
	InstantFoxModule.Plugins[gPlugin.id] = ibp.pluginLoader.cleanCopyPlugin(gPlugin)
	ibp.pluginLoader.initShortcuts()
	rebuild()
	markConflicts()

	var el = $(gPlugin.id)
	if (el){
		$("shortcuts").selectItemRange(el, el)
	}


	gPluginsChanged = true
	gPlugin = null
}


disablePlugin = function(p) {
	if (p.createNew) {
		gPlugin = null
		return
	} else {
		p.disabled = true
	}
	ibp.pluginLoader.initShortcuts()
	rebuild()
	gPluginsChanged = true
}
removePlugin = function(p) {
	if (p.createNew) {
		gPlugin = null
		return
	}
	gPlugin = null
	$('edit-box').hidePopup();
	
	
	var proceed = Services.prompt.confirm(window, "InstantFox", i18n.get("alert.remove"))
	if (!proceed)
		return

	if (p.type != 'user' ) {
		InstantFoxModule.Plugins[p.id].disabled = "invisible"
	} else {
		delete InstantFoxModule.Plugins[p.id];
	}

	ibp.pluginLoader.initShortcuts()
	rebuild()	
	gPluginsChanged = true
}
canResetProp = function(el, plugin){
	var plugin = el.plugin || gPlugin;
	var name = el.getAttribute('aID')
	return plugin && (plugin.type == 'default' || plugin.type == 'browserSearch' || !plugin.type) &&
		plugin['def_' + name] != null &&
		plugin['def_' + name] != el.value
}
resetPluginProp = function(self){
	var el = self.previousSibling
	var plugin = el.plugin || gPlugin
	var name = el.getAttribute('aID')
	el.value = plugin['def_'+name]
	var e = document.createEvent('UIEvent')
	e.initUIEvent('input',true, true, window, 1)
	el.dispatchEvent(e)
}

toggleVisibility = function(el, selector, on){
	var list = el.querySelectorAll(selector)
	var actionName = on?"remove":on==null?"toggle":"add"
	for(var i = list.length; i--; ){
		list[i].classList[actionName]("invisible") 
	}
}

var gBrowserEngineList
enginesPopup = {
	type: '',
	show: function(anchor, type, subType){
		this.node = anchor;
		this.type = type;
		this.subType = subType;
		var panel = $("engine-list")
		var popupBoxObject = panel.popupBoxObject;
		popupBoxObject.setConsumeRollupEvent(popupBoxObject.ROLLUP_NO_CONSUME);
		var pos = this.type == "InstantFox" ? 'after_start' : 'before_end';
		panel.openPopup(anchor, pos, 0, 0, false, true)
	},
	onShowing: function(popup){
		var items = this['getItems_' + this.type](this.subType)
		this.fillPopup(popup, items)
	},
	onCommand: function(popup){
		this['command_' + this.type](popup)
	},
	fillPopup: function(popup, items){
		var xml=[]
		clean(popup)
		var str = '<menuitem class="menuitem-iconic" label="$name$" image="$iconURI$" value="$id$"/>'
		for each(var p in items)
			xml.push(formatString(str, p))

		appendXML(popup, xml.join(''))
	},
	getItems_Url: function(t){
		var ans = [], usedList = []
		for each(var p in InstantFoxModule.Plugins){
			var url = p['def_'+t] || p[t]
			if(url && usedList.indexOf(url) == -1){
				usedList.push(url)
				ans.push(p)
			}
		}
		return ans
	},
	command_Url: function(event){
		var t = this.subType
		var p = InstantFoxModule.Plugins[event.target.value];
		var el = $parent(this.node).querySelector('textbox[aID='+t+']')
		el.value = p['def_'+t] || p[t]
		var e=document.createEvent('UIEvent')
		e.initUIEvent('input',true, true, window, 1)
		el.dispatchEvent(e)
	},

	// display avaliable open search browser plugins
	getItems_Browser: function(popup){
		gBrowserEngineList = []
		var win = Services.wm.getMostRecentWindow("navigator:browser")
		if(!win){
			return
		}
		var gBrowser = win.gBrowser
		var uriList = []

		for each(var e in gBrowser.mCurrentBrowser.engines){
			if(uriList.indexOf(e.uri) == -1 && e.title && e.uri){
				uriList.push(e.uri)
				gBrowserEngineList.push({
					name: e.title,
					iconURI: e.icon,
					uri: e.uri,
					id: gBrowserEngineList.length
				})
			}
		}
		// todo add engines from background browsers
		/*for each(var b in gBrowser.browsers){
			for each(var e in b.engines){
				if(uriList.indexOf(e.uri) == -1 && e.title && e.uri){
					uriList.push(e.uri)
					gBrowserEngineList.push({
						name: e.title,
						iconURI: e.icon,
						uri: e.uri,
						id: gBrowserEngineList.length
					})
				}
			}
		}*/

		return gBrowserEngineList
	},
	command_Browser: function(event){
		var id = event.target.value
		var e = gBrowserEngineList[id]
		var type = Ci.nsISearchEngine.DATA_XML;
		InstantFoxModule.bp.searchEngineObserver.addListener(this.scheduleBrowserEngineListUpdate.bind(this))
		Services.search.addEngine(e.uri, type, e.iconURI, false)
	},
	scheduleBrowserEngineListUpdate: function(){
		if(this.$pending)
			return
		this.$pending = true
		setTimeout(function(self){
			self.$pending = false;
			self.updateBrowserEngineList()
		}, 100, this)
	},
	updateBrowserEngineList: function(){
		var win = Services.wm.getMostRecentWindow("navigator:browser")
		var hide = true
		if(win){
			var b = win.gBrowser.mCurrentBrowser
			if(b.engines && b.engines.length){
				hide = false
			}
		}
		$("add-from-browser").hidden = hide

        rebuild()

        var el = $("shortcuts")
        el.selectedItem = el.lastChild
        el.scrollToIndex(el.itemCount - 1)
	}
}

autoSearchUI = {
	id: "-------autoSearchUI-id",
	init: function(){
		if(!this.onTimeout)
			this.onTimeout = this.$onTimeout.bind(this)

		var g = $("autoSearch")
		var p = InstantFoxModule.autoSearch

		for each(var i in ['url', 'json']){
			var box = $t(g, i)
			box.plugin = p
			box.value = p[i] || '';
			box.nextSibling.hidden = !canResetProp(box)
		}
		
		$t(g, "disabled").checked = !p.disabled
		$t(g, "suggest").checked = !!p.suggest
		$t(g, "suggest").doCommand()
		$t(g, "disabled").doCommand()
		
		$t(g, "minQChars").value = p.minQChars || 0
		
		var menu = $t(g, "instant")
		menu.selectedItem = $t(menu, p.instant)
	},
	onChange: function(e){
		if(e.target.autoSearchIgnore)
			return
		if(this.$timeout)
			clearTimeout(this.$timeout)
		
		this.$timeout = setTimeout(this.onTimeout, 500)
	},
	$onTimeout: function(){
		this.$timeout = null
		this.saveChanges()
	},
	saveChanges: function(){
		var g = $("autoSearch")
		var p = InstantFoxModule.autoSearch
		
		p.url = $t(g, "url").value
		p.json = $t(g, "json").value
		p.disabled = !$t(g, "disabled").checked 
		
		p.instant = $t(g, "instant").selectedItem.getAttribute("aID")
		
		p.suggest = !!$t(g, "suggest").checked
		
		p.minQChars = parseInt($t(g, "minQChars").value)
		if(isNaN(p.minQChars))
			p.minQChars = 0	

		gPluginsChanged = true
	},
	
	// richlistbox integration
	getXML: function(){
		var a = InstantFoxModule.autoSearch
		var p = {}
		p.disabled = a.disabled
		p.name = i18n.get("standard_search_label")
		p.iconURI = "chrome://instantfox/content/skin/button-logo.png"
		p.id = this.id
		
		var fr = p.disabled ? xmlFragmentDis : xmlFragment
		fr = fr.replace(/class=.key.>.*<\/hbox/, "/")
		return formatString(fr, p)
	}
}


//*************************

function markConflicts(){
	var cf = InstantFoxModule.ShortcutConflicts || {}

	for (var id in InstantFoxModule.Plugins){
		var key = $t($(id), 'key')
		if(!key)
			continue

		if(cf[id])
			key.setAttribute('conflict', cf[id])
		else
			key.removeAttribute('conflict')
	}
}
onTextboxInput = function(el){
	var id = $parent(el).id
	var orig = InstantFoxModule.Plugins[id].key
	InstantFoxModule.Plugins[id].key = el.value

	ibp.pluginLoader.initShortcuts()
	markConflicts()
	InstantFoxModule.Plugins[id].key = orig
}
onTextboxEnter = function(el){
	var id = $parent(el).id
	InstantFoxModule.Plugins[id].key = el.value
	ibp.pluginLoader.initShortcuts()
	markConflicts()

	gPluginsChanged = true
}
onTextboxEscape = function(el){
	var id = $parent(el).id
	el.value = InstantFoxModule.Plugins[id][el.className]
	el.blur()
}

rbSelect=function(e, rbox){
	var el=document.activeElement
	if(rbox.selectionInKeyTextbox){
		$t(rbox.selectedItem,'key').focus()
	}
}
rbKeyPress = function(e, rbox){
	var c
	var el = e.target

	if(e.ctrlKey && e.charCode==102){
		$("pluginFilter").focus()
		return
	}
	if(el.className == 'key'){
		if(e.keyCode==27){
			onTextboxEscape(el)
		}
		if(e.keyCode==13){
			el.blur()
			$parent(el).parentNode.focus()
		}
		if(e.keyCode==40||e.keyCode==38){
			$t($parent(el).parentNode.selectedItem,'key').focus()
		}
		rbox.selectionInKeyTextbox = true
		return
	}
	if($t(rbox.selectedItem,'key')){
		rbox.selectionInKeyTextbox = false	
	}
	if(e.keyCode==13){
		openEditPopup(rbox.selectedItem)
	}
}
rbMouseup = function(e, rbox){
	rbox.selectionInKeyTextbox = false;
	//**********
	var item = e.target;
	var aID = item.getAttribute('aID')
	//**********
	if (aID == 'enable-link') {
		var item = $parent(e.target)
		if(item.id == autoSearchUI.id){
			InstantFoxModule.autoSearch.disabled = false
			gPluginsChanged = true
			rebuild()
			return 
		}
		gPlugin = InstantFoxModule.Plugins[item.id]
		gPlugin.disabled = false
		saveGPlugin()
		return
	}
	if (!aID && item.className == 'separator'){
		var start = item.nextSibling, end = item = start

		while((item = item.nextSibling) && ( item.nodeName == 'richlistitem')  ){
			end = item
		}
		if(start && end && start.className != 'separator')
			start.parentNode.selectItemRange(start, end)
		else
			start.parentNode.clearSelection()
	}

	//**********
	if (aID != 'edit-link')
		return;

	openEditPopup($parent(e.target))
}

//*************
function schedule(fn, delay){
	if (fn._timeout != null)
		clearTimeout(fn._timeout)
		
	fn._timeout = setTimeout(fn, delay||200)
}

updateToolbarItems = function(){
	var InstantFox = top.InstantFox
	if (!InstantFox)
		return
	var panes = document.querySelectorAll('prefpane')
	for (var i=panes.length;i--;)
		panes[i].writePreferences(false)
	InstantFox.updateToolbarItems()
}
function saveChanges(){
	if(gPrefChanged){
		var panes = document.querySelectorAll('prefpane')
		for (var i=panes.length;i--;)
			panes[i].writePreferences(false)
	}

	var em = Services.wm.getEnumerator('navigator:browser')
	while(em.hasMoreElements()){
		var iFox = em.getNext().InstantFox
		if (!iFox) {
			Components.utils.reportError('no iFox in window')
			continue
		}
		iFox.updateUserStyle()
		gToolbarsChanged && iFox.updateToolbarItems()
	}
	
	if(!gPluginsChanged)
		return
		
	if(resultOK)
		InstantFoxModule.updateContextMenuPlugins()
		
	if(resultOK)
		InstantFoxModule.pluginLoader.savePlugins()
	else
		InstantFoxModule.pluginLoader.loadPlugins()
	gPluginsChanged = false
}

/** XML********************************************///{
xmlFragment = "\
	  <richlistitem align='center' id='$id$'>\
		<hbox align='center' class='image'>\
			<image src='$iconURI$' width='16' height='16'/>\
		</hbox>\
		<label value='$name$'/>\
		<hbox flex='1' pack='start' align='top'>\
			<hbox class='plugin-status' status='$status$' aID='edit-link' tooltiptext='$_status$'/>\
		</hbox>\
		<hbox align='center' class='key'>\
			<textbox class='key' aID='key' value='$key$' tooltiptext='$i18n_key_tooltip$'\
				onblur='onTextboxEnter(this)' oninput='onTextboxInput(this)'/>\
		</hbox>\
		<label class='link' value='$i18n_edit$' aID='edit-link'/>\
	  </richlistitem>".replace(/>\s*</g,'><').trim()
xmlFragmentDis = "\
	  <richlistitem align='center' id='$id$' disabled='true'>\
		<hbox align='center' class='image'>\
			<image src='$iconURI$' width='16' height='16'/>\
		</hbox>\
		<label value='$name$'/>\
		<spacer flex='1' />\
		<textbox class='key invisible' aID='key'/>\
		<label class='link' value='$i18n_enable$' aID='enable-link'/>\
	  </richlistitem>".replace(/>\s*</g,'><').trim()
//}

function plugin2XML(p){
	updatePluginStatus(p)
	return formatString(p.disabled?xmlFragmentDis:xmlFragment, p)
}

rebuild = function(){
	var xml=[], userxml = [], disabledxml = [];
	var activePlugins = InstantFoxModule.Plugins

	var pluginFilter = $('pluginFilter').value
	for each (var p in activePlugins) {
		if (!p.url || (pluginFilter && p.name.toLowerCase().indexOf(pluginFilter) == -1))
			continue
		if (p.disabled == 'invisible')
			continue
			
		var dis = p.disabled, def = p.type=='default'
		var px = plugin2XML(p)
		if (dis)
			disabledxml[p.disabled?'unshift':'push'](px)
		else
			(def ? xml : userxml).push(px)

	}
	var sepXML1 = '<label class="separator" value="   ', sepXML2 ='"/>'

	// 
		xml.unshift(sepXML1 + i18n.get("separator_standard") + sepXML2)
	if (userxml.length)
		xml.push(sepXML1 + i18n.get("separator_your") + sepXML2)
	if (disabledxml.length)
		userxml.push(sepXML1 + i18n.get("separator_inactive") + sepXML2)

	// default search
	if (!pluginFilter)
		xml.unshift(autoSearchUI.getXML())
	
	var el = $("shortcuts");
	//it's important to clear selection of richbox before removing its' children
	el.clearSelection && el.clearSelection()

	clean(el)
	appendXML(el, xml.join('') + userxml.join('')+ disabledxml.join('')	)

	markConflicts()
	// todo: better place for this
	globalInstant.update()
}

function updatePluginStatus(p){
	// warn about invalid plugin
	if (!p.url ||
		 p.url.indexOf('%q') == -1 ||
		(p.json && p.json.indexOf('%q') == -1 )	) {
		p.status = "invalid"
	} else if(p.disableInstant) {
		p.status = "not_instant"
	} else
		p.status = "instant"
}

window.addEventListener("DOMContentLoaded", function() {
	window.removeEventListener("DOMContentLoaded", arguments.callee, false)
	slideCheckbox.initAll()
	// this must be called after menulists' binding is loaded
	updateLocaleList()
	rebuild()

	var size = document.getElementsByTagName('tabbox')[0].clientWidth + 50;
	// check if we are inside popup
	var InstantFox = top.InstantFox
	if (InstantFox) {
		window.close = InstantFox.closeOptionsPopup
		// don't let clicks inside options window to close popup
		window.addEventListener('mousedown', InstantFox.popupClickListener, false)
	}
	enginesPopup.scheduleBrowserEngineListUpdate()
}, false)

// called when popup containing this window is opened
onOptionsPopupShowing = function(){
	rebuild()
	enginesPopup.updateBrowserEngineList()
}

function onTabSelect(){
	var i = this.selectedIndex

	if(this[i+"_paneReady"])
		return;
	this[i+"_paneReady"] = true
	
	if(i == 1 || i == 2){
		this.parentNode.selectedPanel.firstChild.hidden = false;
		gPrefChanged = true;
		if(i == 1) {			
			if(!Services.prefs.prefHasUserValue("extensions.InstantFox.removeSearchbar"))
				setTimeout(function() {
					document.querySelector("checkbox[preference='removeSearchbar']").checked = true
				})
		}
	}else if(i == 3){
		var iframe = document.createElement('iframe');
		iframe.setAttribute('type', 'content');
		iframe.setAttribute('src', 'resource://instantfox/about.html');
		iframe.setAttribute('flex', '1');
		this.parentNode.selectedPanel.appendChild(iframe);
	}
}

/***********************************************************************/
var gClipboardHelper = {
	get cbHelperService() {
		delete this.cbHelperService
		this.cbHelperService = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper)
		return this.cbHelperService
	},
	copyString: function(str) str&&this.cbHelperService.copyString(str),
	getData: function(){
		try{
			var clip = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard);
			var trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
			trans.addDataFlavor("text/unicode");
			clip.getData(trans,1)
			var str={},strLength={}
			trans.getTransferData("text/unicode",str,strLength)
			str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
			pastetext = str.data.substring(0, strLength.value/2);
			return pastetext||''
		}catch(e){
			Cu.reportError(e)
			return ''
		}
	}
}

copyPluginsToClipboard = function(){
	var str = InstantFoxModule.pluginLoader.getPluginString(true)
	str = "--metadata-- version:" + "--instantfox--plugin--data--" + "\n" + str
	gClipboardHelper.copyString(str)
}

addPluginsFromClipboard = function(){
	var str = gClipboardHelper.getData()
	var i = str.indexOf("\n")
	var metadata = str.substring(0,i)
	str = str.substr(i)
	try{
		if(metadata.indexOf("--instantfox--plugin--data--")==-1)
			throw "no metadata"
		JSON.parse(str) // check for valid json
	}catch(e){
		alert(i18n.get('alert.invalid'))
		return
	}
	var arr = [i18n.get("alert.merge"), i18n.get("alert.replace")]
	var sel={}
	var proceed = Services.prompt.select(
		window, "Instantfox ", i18n.get("alert.what2do"),
		arr.length, arr,
		sel
	)
	if(!proceed)
		return
	try{
		var origPlugins = InstantFoxModule.Plugins
		if(sel.value == 1){//"replace"
			InstantFoxModule.Plugins = {}
		}
		InstantFoxModule.pluginLoader.addFromUserString(str)
	}catch(e){
		InstantFoxModule.Plugins = origPlugins
		Cu.reportError(e)
	}
	InstantFoxModule.pluginLoader.onInstantfoxUpdate()
	
	gPluginsChanged = true
	
	updateLocaleList()
	rebuild()
	autoSearchUI.init()
}

resetAllPlugins = function(proceed) {
	proceed = proceed || Services.prompt.confirm(window, "InstantFox", i18n.get("alert.reset"))
	if (!proceed)
		return
	InstantFoxModule.Plugins = Object.create(null)
	InstantFoxModule.selectedLocale = null
	InstantFoxModule.autoSearch = null
	InstantFoxModule.defaultPlugin = null

	InstantFoxModule.pluginLoader.loadPlugins(true, function(){
		updateLocaleList()
		rebuild()
	})		
}


  /**********************************************************************/
 /** iphone style sliding checkbox, supports only cliking no drag yet **/
/**********************************************************************/
slideCheckbox = {
	init: function(el){
		if(el.ready)
			return
		el.ready = true
		//<label value=''><slidecheck><check/></slidecheck>
		el.label = document.createElement("label")
		el.label.setAttribute("value", el.getAttribute("label"))
		
		el.checkbox = document.createElement("slidecheck")
		el.check = document.createElement("check")
		
		var on = i18n.get("ON"), off = i18n.get("OFF")
		var d = document.createElement("div")
		d.textContent = on
		d.className = "slidecheck-before"
		el.checkbox.appendChild(d)
		var d = document.createElement("div")
		d.textContent = off
		d.className = "slidecheck-after"
		el.checkbox.appendChild(d)
		el.checkbox.style.width = (on+off).length +'em';
		
		el.checkbox.appendChild(el.check)
		
		el.appendChild(el.label)
		el.appendChild(el.checkbox)
		
		el.__defineGetter__("checked", this.getChecked)
		el.__defineSetter__("checked", this.setChecked)
		
		el.addEventListener("click", this.onClick, false)
	},
	initAll: function(el){
		var all = (el||document).querySelectorAll("slidecheckbox")
		for(var i=all.length;i--;)
			this.init(all[i])
	},
	onClick: function(e){
		this.checked = !this.checked
		this.doCommand()
	},
	getChecked: function(){
		return this.classList.contains("checked")
	},
	setChecked: function(val){
		if(val){
			this.setAttribute("checked", val)
			this.classList.add("checked")
		}else{
			this.removeAttribute("checked")
			this.classList.remove("checked")
		}
		return val
	}
}

/**********************************************************************/
i18n = {
	init: function(){
		this.$bundle = InstantFoxModule.bp.getBundle('options.properties')
		this.$defaultBundle = InstantFoxModule.bp.getBundle('options.properties', "en-US");
	},
	get: function(name){
		try{
			return this.$bundle.GetStringFromName(name)
		}catch(e){
			try{
				return this.$defaultBundle.GetStringFromName(name)
			}catch(e1){
				dump("name: ", name, "error->'' returned", e, e1)
				return ""
			}
		}
	},
	localize: function(){
		var elList = document.querySelectorAll("label.i18n,description.i18n")
		for(var i=elList.length;i--;){
			var el = elList[i]
			el.setAttribute("value", this.get(el.getAttribute("value")))
		}
		var elList = document.querySelectorAll(".i18n[label]")
		for(var i=elList.length;i--;){
			var el = elList[i]
			el.setAttribute("label", this.get(el.getAttribute("label")))
		}
		
		var elList = document.querySelectorAll("textbox.i18n[placeholder]")
		for(var i=elList.length;i--;){
			var el = elList[i]
			el.setAttribute("placeholder", this.get(el.getAttribute("placeholder")))
		}
		
		xmlFragment = this.localizeString(xmlFragment)
		xmlFragmentDis = this.localizeString(xmlFragmentDis)
	},
	localizeString: function(str){
		return str.replace(/\$i18n_[^\$]*\$/g, function(x){
				var x = x.slice(6,-1)
				return escapeHTML(i18n.get(x))
			})
	}
}
i18n.init()
i18n.localize()

/**********************************************************************/
function addTab(url){
	Services.wm.getMostRecentWindow("navigator:browser")
		.InstantFox.addTab(url)
}
