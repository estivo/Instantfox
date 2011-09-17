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
			xml.push('<menuitem label="', i.id, '">',
				'<label value="', i.displayName, '"/><hbox flex="1"/><label value="', i.id, '"/>',
			'</menuitem>')
		
		var menulist = $('locale')
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
//************* dom utils
function $(id){
	return document.getElementById(id)
}
function $t(el, aID) {
	
	return el && el.getElementsByAttribute('aID', aID)[0]
}
function $parent(el){
	while(el){
		if(el.id)
			return el
		el=el.parentNode
	}
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
		if(typeof options[x]!='string')
			return options[x]?options[x].toString():''
		return escapeHTML(options[x]||'')
	})
}
function escapeHTML(str) str.replace(/[&"<>]/g, function(m)"&"+escapeMap[m]+";");
var escapeMap = { "&": "amp", '"': "quot", "<": "lt", ">": "gt" }

//************************ context menu
initContextMenu = function(popup){
	var item = document.popupNode	
	item = $parent(item)
	var selectedItems = $('shortcuts').selectedItems

	$t(popup, 'disableInstant').setAttribute('checked', !selectedItems.some(function(x){
		return InstantFoxModule.Plugins[x.id].disableInstant
	}))
	$t(popup, 'disableSuggest').setAttribute('checked', !selectedItems.some(function(x){
		return InstantFoxModule.Plugins[x.id].disableSuggest
	}))
	$t(popup, 'hideFromContextMenu').setAttribute('checked', !selectedItems.some(function(x){
		return InstantFoxModule.Plugins[x.id].hideFromContextMenu
	}))
	var editItem = $t(popup, 'edit')
	var visible = selectedItems.length == 1 && !InstantFoxModule.Plugins[selectedItems[0].id].disabled
	editItem.hidden = editItem.previousSibling.hidden = !visible
}
onContextMenuCommand = function(e){
	var menu = e.target
	var name = menu.getAttribute('aID')
	var item = document.popupNode	
	item = $parent(item)
	if (name=='edit'){
		openEditPopup({target: item.lastChild})
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
	dump(x)
	
		rbox.addItemToSelection($(x));
	})
   

}

//************************ edit popup utils
var gPlugin, gPluginsChanged, gPrefChanged, resultOK = true;
initEditPopup = function(plugin, panel){
	if(plugin)
		gPlugin = ibp.pluginLoader.cleanCopyPlugin(plugin)
	else
		gPlugin = createEmptyPlugin(plugin)

	$t(panel, 'instant').checked = !gPlugin.disableInstant
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
	var st = chkbox.nextSibling.style;
	if(suggest){
		st.opacity="";
		st.pointerEvents=""
	}else{
		st.opacity=0;
		st.pointerEvents="none"
	}
	
	var rem =  $t(panel, 'remove')
	if(plugin){
		rem.label = gPlugin.type == 'user' ? 'remove': 'disable';
		rem.hidden = false;
	}else{
		rem.label = 'cancel';
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
openEditPopup = function(item, plugin){
	var panel = $('edit-box')

	// without this, arrow isn't shown first time
 	if(!window.$panelHackApplied){
		var p = gPlugin
		gPlugin = null
		window.$panelHackApplied=true
		panel.openPopup(document.documentElement)
		panel.hidePopup()
		gPlugin = p
	}
	
	initEditPopup(plugin, panel)	
	
	var popupBoxObject = panel.popupBoxObject;
	popupBoxObject.setConsumeRollupEvent(popupBoxObject.ROLLUP_NO_CONSUME);
	panel.openPopup(item, 'start_before', 0, 0, false, true)
}

rbMouseup = function(e){
	var item = e.target;
	var aID = item.getAttribute('aID')
	//**********
	if (aID == 'enable-link') {
		var item = $parent(e.target)
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
		start.parentNode.selectItemRange(start, end)
	}
	
	//**********
	if (aID != 'edit-link')
		return;
	
	var item = $parent(e.target)
	var p = InstantFoxModule.Plugins[item.id]

	openEditPopup(item.lastElementChild, p)	
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
		//appendXML($("shortcuts"), plugin2XML(gPlugin))
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


removePlugin = function(p) {
	if (p.createNew) {
		gPlugin = null
	}else if (p.type != 'user' ) {
		p.disabled = true		
	} else {
		delete InstantFoxModule.Plugins[p.id];
		ibp.pluginLoader.initShortcuts()
		markConflicts()
		
		var item = $(p.id)
		item.parentNode.removeChild(item)
	}
	
	gPluginsChanged = true
}
canResetProp = function(el){
	var name = el.getAttribute('aID')
	return (gPlugin.type == 'default' || gPlugin.type == 'browserSearch') &&
		gPlugin['def_' + name] != null &&
		gPlugin['def_' + name] != el.value
}
resetPluginProp = function(self){
	var el = self.previousSibling
	var name = el.getAttribute('aID')
	el.value = gPlugin['def_'+name]
	var e=document.createEvent('UIEvent')
	e.initUIEvent('input',true, true, window, 1)
	el.dispatchEvent(e)
}
var gBrowserEngineList
enginesPopup = {
	type: '',
	show: function(anchor, type){
		this.type = type;
		var panel = $("engine-list")
		var popupBoxObject = panel.popupBoxObject;
		popupBoxObject.setConsumeRollupEvent(popupBoxObject.ROLLUP_NO_CONSUME);
		panel.openPopup(anchor, 'before_end', 0, 0, false, true)
	},
	onShowing: function(popup){
		dump
		var items = this['fill_' + this.type]()
		this.fillPopup(popup, items)
	},
	onCommand: function(popup){
		this['command_' + this.type](popup)
	},
	fillPopup: function(popup, items){
		var xml=[]		
		var str = "<menuitem class='menuitem-iconic' label='$name$' image='$iconURI$' value='$id$'/>"
		for each(var p in items)
			xml.push(formatString(str, p))

		clean(popup)
		appendXML(popup, xml.join(''))
	},
	fill_Json: function(){
		var jsonP = [], jsonList = []
		for each(var p in InstantFoxModule.Plugins){
			var json = p.def_json || p.json
			if(json && jsonList.indexOf(json) == -1){
				jsonList.push(json)
				jsonP.push(p)
			}
		}
		return jsonP
	},
	command_Json: function(event){
		var p = InstantFoxModule.Plugins[event.target.value];
		var el = document.querySelector('#edit-box textbox[aID=json]')
		el.value = p.def_json || p.json	
		var e=document.createEvent('UIEvent')
		e.initUIEvent('input',true, true, window, 1)
		el.dispatchEvent(e)
	},
	fill_InstantFox: function(){
		var items = [{name:'none'}], jsonList = []
		for each(var p in InstantFoxModule.Plugins)
			if(!p.disabled)
				items.push(p)

		return items
	},
	command_InstantFox: function(event){
		var id = event.target.value;
		if(!id){
		
		}else
			var p = InstantFoxModule.Plugins[id];
		
		
	},
	fill_Browser: function(popup){
		gBrowserEngineList = []
		var win = Services.wm.getMostRecentWindow("navigator:browser")
		if(!win){
			return 
		}
		var gBrowser = win.gBrowser
		var uriList = []

		for each(var e in gBrowser.mCurrentBrowser.engines){
			if(uriList.indexOf(e.uri) == -1){
				uriList.push(e.uri)
				gBrowserEngineList.push({
					name: e.title,
					iconURI: e.icon,
					uri: e.uri,
					id: gBrowserEngineList.length+''
				})
			}
		}

		for each(var b in gBrowser.browsers){
			for each(var e in b.engines){
				if(uriList.indexOf(e.uri) == -1){
					uriList.push(e.uri)
					gBrowserEngineList.push({
						name: e.name,
						iconURI: e.icon,
						uri: e.uri,
						id: gBrowserEngineList.length
					})
				}
			}	
		}

		return gBrowserEngineList
	},
	command_Browser: function(event){
		var id = event.target.value
		var e = gBrowserEngineList[id]
		var type = Ci.nsISearchEngine.DATA_XML;
		Services.search.addEngine(
			e.uri, type, e.iconURI, false
		)
	}
}

//*************************

function markConflicts(){
	dump.trace('sssssss')

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
	dump(id,InstantFoxModule.Plugins[id].key)
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
window.addEventListener('keydown', function(e){
	var el = e.target
	if(el.className == 'key'){
		dump(e.keyCode)
		if(e.keyCode=='27'){
			onTextboxEscape(el)
		}
		if(e.keyCode=='13'){
			el.blur()
			$parent(el).parentNode.focus()
		}
		if(e.keyCode=='40'||e.keyCode=='38'){
			dump($parent(el).parentNode.selectedItem.id)
			$t($parent(el).parentNode.selectedItem,'key').focus()
		}
	}
}, false)

onSelect=function(rbox){
	var el=document.activeElement
	if(el.localName=='input'&&el.parentNode.parentNode.className=='key'){
		$t(rbox.selectedItem,'key').focus()
	}
}



//************* 
function savePlugins(){
	if(gPrefChanged)
		document.getElementsByTagName('prefpane')[0].writePreferences(false)

	var em = Services.wm.getEnumerator('navigator:browser')
	while(em.hasMoreElements())
		em.getNext().InstantFox.updateUserStyle()

	if(!gPluginsChanged)
		return
	if(resultOK)
		InstantFoxModule.pluginLoader.savePlugins()
	else
		InstantFoxModule.pluginLoader.loadPlugins()
	gPluginsChanged = false
}
//************* 
xmlFragment = 
	  <richlistitem align="center" id='$id$'>
		<hbox align="center" class='image'>
			<image src="$iconURI$" width="16" height="16"/>
		</hbox>
		<label value="$name$"/>
		<hbox flex='1' pack='start' align='top'> 
			<hbox class="plugin-status" status="$status$" aID='edit-link'/>
		</hbox>
		<hbox align="center" class='key'>
			<textbox class='key' aID='key' value='$key$' tooltiptext='edit plugin key'
				onblur='onTextboxEnter(this)' oninput='onTextboxInput(this)'/>
		</hbox>
		<label class='link' value='edit' aID='edit-link'/>
	  </richlistitem>.toXMLString().replace(/>\s*</g,'><')
xmlFragmentDis = 
	  <richlistitem align="center" id='$id$' disabled="true">
		<hbox align="center" class='image'>
			<image src="$iconURI$" width="16" height="16"/>
		</hbox>
		<label value="$name$"/>
		<spacer flex='1' />
		<textbox class='key hidden' aID='key'/>
		<label class='link' value='enable' aID='enable-link'/>
	  </richlistitem>.toXMLString().replace(/>\s*</g,'><')

function plugin2XML(p){
	updatePluginStatus(p)
	return formatString(p.disabled?xmlFragmentDis:xmlFragment, p)
}

rebuild = function(){
	var xml=[], userxml = [], disabledxml = [];
	var activePlugins = InstantFoxModule.Plugins
	for each(var p in activePlugins){
		if(p.url){
			var dis = p.disabled, def = p.type=='default'
			var px = plugin2XML(p)
			if(dis)
				disabledxml[p.disabled?'unshift':'push'](px)
			else
				(def ? xml : userxml).push(px)
		}
	}
	var sepXML1 = "<label class='separator' value='   ", sepXML2 =" search plugins'/>"

	xml.unshift(sepXML1 + "standard" + sepXML2)
	if(userxml.length)
		xml.push(sepXML1 + "your" + sepXML2)
	
	if(disabledxml.length)
		userxml.push(sepXML1 + "inactive" + sepXML2)
	
	var el = $("shortcuts");
	//it's important to clear selection of richbox before removing its' children
	el.clearSelection()

	clean(el)
	appendXML(el, xml.join('') + userxml.join('')+ disabledxml.join('')	)
	
	markConflicts()
}

function updatePluginStatus(p){
	// warn about invalid plugin
	if (!p.url ||
		 p.url.indexOf('%q') == -1 ||
		(p.json && p.json.indexOf('%q') == -1 )	) {
		p.status = "invalid"
	} else if(p.disableInstant) {
		p.status = "not-instant"
	} else
		p.status = ""	
}

window.addEventListener("DOMContentLoaded", function() {
	window.removeEventListener("DOMContentLoaded", arguments.callee, false)
	// this must be called after menulists' binding is loaded 
	updateLocaleList()
	rebuild()
	
	var size = document.getElementsByTagName('tabbox')[0].clientWidth + 50;
	// check if we are inside popup
	var InstantFox = top.InstantFox
	if (InstantFox) {
		window.close = InstantFox.closeOptionsPopup
		var el = document.getElementById('pinbox')
		el.hidden = false
		el.firstChild.checked = !!InstantFox.popupPinned
		InstantFox.updatePopupSize(size)
		// don't let clicks inside options window to close popup
		window.addEventListener('mousedown', InstantFox.popupClickListener, false)
	} else {
		setTimeout(function(){
			var el=$('shortcuts')
			var delta = el._scrollbox.scrollWidth-el.clientWidth
			if (delta>0) {
				window.resizeBy(delta+50, 0)
				dump('this must not happen *************************************')
			}
		}, 100)
	}
	updateBrowserEngines()
}, false)

// called when popup containing this window is opened
onOptionsPopupShowing = function(){
	rebuild()
	updateBrowserEngines()	
}
updateBrowserEngines = function(){
	var win = Services.wm.getMostRecentWindow("navigator:browser")
	var hide = true
	if(win){
		for each(var b in win.gBrowser.browsers){
			if(b.engines && b.engines.length){
				hide = false
				break
			}
		}	
	}
	$("add-from-browser").hidden = hide
}

function onTabSelect(){
	if(!this.pane1Ready && this.selectedIndex==1){
		this.pane1Ready=true;
		this.parentNode.selectedPanel.firstChild.hidden=false;gPrefChanged=true;
	}else if(!this.pane2Ready && this.selectedIndex==2){
		this.pane2Ready=true;
		var iframe = document.createElement('iframe');
		iframe.setAttribute('type', 'content');
		iframe.setAttribute('src', 'resource://instantfox/about.html');
		iframe.setAttribute('flex', '1');
		this.parentNode.selectedPanel.appendChild(iframe);
	}
	//$("add").hidden = this.selectedIndex != 0
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
	gClipboardHelper.copyString(str) 
}

addPluginsFromClipboar = function(){
	var str = gClipboardHelper.getData()
	try{
		var js = JSON.parse(str)
	}catch(e){
		alert('invalid plugin data')
		return
	}
	InstantFoxModule.pluginLoader.addPlugins(js)
}