window.InstantFox = {
	$el: function(name, attributes, childList_, parent) {
    	if (!Array.isArray(childList_)){
			parent = childList_
			childList_ = null
		}			
		var el = document.createElement(name)
		for (var a in attributes)
			el.setAttribute(a, attributes[a])		
		for each(var a in childList_)
			el.appendChild(a)			
		if (parent)
			parent.appendChild(el)
		
		return el
	},
	$: function(x) document.getElementById(x), 
	rem: function(x) {
		if (typeof x == "string")
			x = document.getElementById(x)
		x && x.parentNode && x.parentNode.removeChild(x)
	},
    idsToRemove: [],
	// belong to notifyTab
	install_url: "http://www.instantfox.net/welcome.php",
	update_url:  "http://www.instantfox.net/update.php",
	checkversion: true,

	addTab: function(url, nextToCurrent){
		if(url){
			var targetTab = gBrowser.addTab(url);
			if(nextToCurrent)
				gBrowser.moveTabTo(targetTab , gBrowser.mCurrentTab._tPos+1)
			gBrowser.selectedTab = targetTab;
			return targetTab
		}
	},
	notifyTab: function(){
		if (!InstantFox.checkversion)
			return;

		AddonManager.getAddonByID('searchy@searchy', function(addon){
			InstantFox.checkversion = false;
			var pb = Services.prefs.getBranch('extensions.InstantFox.')
			var oldVersion = pb.prefHasUserValue('version') ? pb.getCharPref('version') : '0.0.0'
			
			if (oldVersion == '0.0.0') {
				let pbo = Services.prefs.getBranch('extensions.instantfox.')
				if (pbo.prefHasUserValue('version')) {
					oldVersion = pbo.getCharPref('version')
					pbo.deleteBranch('')
				}
			}
			
			var newVersion = addon.version;
			if (oldVersion == newVersion)
				return;

			pb.setCharPref("version", newVersion);
			try {
				// check if new plugins are added by this update
				InstantFoxModule.pluginLoader.onInstantfoxUpdate()
			} catch(e) {
				Cu.reportError(e)
			}
			try {
				InstantFox.updateToolbarItems();
			} catch(e) {
				Cu.reportError(e)
			}
			
			
			// don't bother user with minor updates
			if (oldVersion.slice(0,-1) == newVersion.slice(0,-1))
				return 
			
			if (oldVersion == "0.0.0") {
				var url = InstantFox.install_url + '?to=' + newVersion;
				// add options button only on first install
				setTimeout(InstantFox.showInstallNotification, 600);
			} else {
				var url = InstantFox.update_url + '?to=' + newVersion + '&from=' +oldVersion
			}


			setTimeout(InstantFox.addTab, 500, url);
		})
	},
	showInstallNotification: function(){
		var n = {
			id: 'instant-fox-installed',
			anchor: "instantFox-options",
			label: InstantFoxModule.getString("welcome.notification"),
			hide: 'document.getBindingParent(this).parentNode.hidePopup();',
			mainActionLabel: 'ok',
			action: 'document.getElementById("instantFox-options").open=true;',
			a: {
				label: 'remove this button',
				action: 'InstantFox.updateToolbarItems(false, false)'
			}
		}

		var $el = InstantFox.$el
		var $ = InstantFox.$
		var p = $el('panel', {type: 'arrow'}, $("mainPopupSet"))

		var popupnotification = $el('popupnotification', {
			label:              n.label,
			popupid:            n.id,
			closebuttoncommand: n.hide,
			buttonlabel:        n.mainActionLabel,
			buttoncommand:      n.hide + n.action,			
			menucommand:        "event.target.hasAttribute(action)?" + n.a.action + ':' + n.hide,
			closeitemcommand:   n.hide
		}, p);

		//secondary actions
		var item = $el("menuitem", {
			label:    n.a.label,
			action:   true
        }, popupnotification);
		var closeItemSeparator = $el("menuseparator", null, popupnotification);

		p.openPopup($(n.anchor), "bottomcenter topleft");
		
		// 
		setTimeout(function() {
			gBrowser.userTypedValue = gURLBar.value = InstantFoxModule.Plugins.google.key + " " +
				InstantFoxModule.getString("welcome.urlbar")
			InstantFox.onInput()
		}, 20)
	},
	// end belong to notifyTab

	initialize: function() {
		Cu.import('chrome://instantfox/content/instantfoxModule.js')
		
		InstantFox.stylesheet = document.createProcessingInstruction('xml-stylesheet', 'href="chrome://instantfox/content/skin/instantfox.css"')
		document.insertBefore(InstantFox.stylesheet, document.documentElement)
		setTimeout(InstantFox.updateUserStyle, 200)
		
		InstantFox.autocompletesearch_orig = gURLBar.getAttribute('autocompletesearch')
		gURLBar.setAttribute('autocompletesearch',	'instantFoxAutoComplete');
		gURLBar.removeAttribute('oninput');

		gURLBar.addEventListener('keydown', InstantFox.onKeydown, false);
		gURLBar.addEventListener('input', InstantFox.onInput, false);
		// _copyCutController prevents cut event, so modify it in hookUrlbarCommand
		// gURLBar.addEventListener('cut', InstantFox.onInput, false);
		
		gURLBar.addEventListener('blur', InstantFox.onblur, false);
		gURLBar.addEventListener('focus', InstantFox.onfocus, false);
		
		// afterCustomization
		gNavToolbox.addEventListener("aftercustomization", InstantFox.afterCustomization, false);

		dump('instantFox initialized')
		InstantFox.applyOverlay()

		// apply user modified styles
		InstantFox.transformURLBar()		

		// this is needed if searchbar is removed from toolbar
		BrowserSearch.__defineGetter__("searchbar", function() {
			return document.getElementById("searchbar") || document.getElementById("urlbar")
		})
		InstantFox.notifyTab()

		InstantFox.hookUrlbarCommand()
		InstantFox.modifyContextMenu()
	},

	destroy: function(event) {
		gURLBar.removeEventListener('keydown', this.onKeydown, false);
		gURLBar.removeEventListener('input', this.onInput, false);
		gURLBar.removeEventListener('focus', this.onfocus, false);
		gURLBar.removeEventListener('blur', this.onblur, false);
		
		gURLBar.setAttribute('autocompletesearch',	this.autocompletesearch_orig);
		
		gNavToolbox.removeEventListener("aftercustomization", this.afterCustomization, false);

		this.finishSearch()
		
		this.hookUrlbarCommand('off')
		this.modifyContextMenu(false)
		
		this.transformURLBar('off')
				
		this.rem(this.stylesheet)
		this.idsToRemove.forEach(this.rem)
		
		delete window.InstantFox
		delete window.InstantFoxModule
	},

	transformURLBar: function(off) {
		if (off) {
			if(!gURLBar.instantFoxKeyNode)
				return;
			var hbox = document.getAnonymousElementByAttribute(gURLBar, 'class', 'instantfox-box')
			this.rem(hbox)
			hbox = document.getAnonymousElementByAttribute(gURLBar, 'class', 'instantfox-box')
			this.rem(hbox)
			var s = document.getAnonymousElementByAttribute(gURLBar, 'class', 'instantfox-urlbar')
			s && s.classList.remove('instantfox-urlbar')
			
			delete gURLBar.currentShadow
			delete gURLBar.instantFoxKeyNode
			delete gURLBar.instantFoxSpacerNode.textContent
			delete gURLBar.instantFoxShadowNode.textContent
			delete gURLBar.instantFoxTipNode			
			
			return
		}
		
		if (gURLBar.instantFoxKeyNode)
			return;
		var s = gURLBar.mInputField
		while (s && s.nodeName!='xul:stack')
			s = s.parentNode;

		if(!s) {
			s = gURLBar.mInputField.parentNode
			s.classList.add('instantfox-urlbar')
		}

		function hbox(name, addChildDiv){
			var hb = document.createElement('hbox')
			hb.align = 'center'
			hb.className = "instantfox-"+name
			if(addChildDiv){
				hb.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml','div'))

				gURLBar["instantFox" + name[0].toUpperCase() + name.substr(1) + "Node"] = hb.firstChild;
			}
			return hb
		}

        var b2 = hbox('box')
		b2.setAttribute('pack', 'end')
		b2.setAttribute('onclick','InstantFox.openHelp()')
		b2.appendChild(hbox('tip', true))
		s.appendChild(b2)

		var b1 = hbox('box')
		b1.appendChild(hbox('key',true))
		b1.appendChild(hbox('spacer',true))
		b1.appendChild(hbox('shadow',true))
		s.insertBefore(b1, s.firstChild)

		var l1 = gURLBar.editor.rootElement.getBoundingClientRect().left
		var l2 = b1.getBoundingClientRect().left
		var boxStyle = b1.style;
		boxStyle.marginLeft = l1 - l2 + 'px'
		// 1px is from getComputedStyle(gURLBar.mInputField.editor.rootElement).paddingLeft
		// this is platform independant.
		boxStyle.paddingLeft = '1px'
		boxStyle.paddingRight = '1px'
	},
	updateUserStyle: function() {
		var prefs = Services.prefs.getBranch('extensions.InstantFox.')
		var cssRules, ruleIndex
		
		var findRule = function(selector) {
			for (var i = 0; i < cssRules.length; i++) {
				var rule = cssRules[i]
				if (rule.type == 1 && rule.selectorText.indexOf(selector) != -1){
					ruleIndex = i
					return rule
				}
			}
		}
		
		cssRules = InstantFox.stylesheet.sheet.cssRules
		 
		
		if (prefs.prefHasUserValue('fontsize')) {
			var pref = prefs.getCharPref('fontsize')
			if (!/^\d+.?\d*((px)|(em))$/.test(pref)){
				pref = parseFloat(pref)

				if (isNaN(pref) || pref < 0.5)
					pref = '';
				else if (pref < 2)
					pref+='em';
				else
					pref+='px';
			}
			findRule('richlistitem[type="InstantFoxSuggest"]').style.fontSize = pref;
		}
		if (prefs.prefHasUserValue('opacity')){
			var pref = parseInt(prefs.getIntPref('opacity')) / 100
			if(isNaN(pref) || pref < 0.1)
				pref = 1
			findRule('#PopupAutoCompleteRichResult').style.opacity = pref;
		}
		if (document.dir == 'rtl'){
			findRule('richlistbox[type').style.backgroundPosition = '5% bottom';
		}				
		if (prefs.prefHasUserValue('hideUrlbarTips')) {
			findRule('.instantfox-tip').style.display = prefs.getBoolPref('hideUrlbarTips')?"none":"";
		}
		if (prefs.prefHasUserValue('suggestStyle')) {

			if (prefs.getCharPref('suggestStyle') == "condensed")
				newSelector = 'richlistitem.autocomplete-richlistitem'
			else
				newSelector = 'richlistitem.instantfox-slim'
			
			var t = findRule("richlistitem.").cssText
			if (t.substring(0, newSelector.length) != newSelector) {			
				t = newSelector + t.substr(t.indexOf("{")-1)
				s.deleteRule(ruleIndex);
				s.insertRule(t, ruleIndex)
			}
		}
	},
	// ****** event handlers ****************************************
	onKeydown: function(event) {
		var key = event.keyCode ? event.keyCode : event.which,
			alt = event.altKey, meta = event.metaKey,
			ctrl = event.ctrlKey, shift = event.shiftKey,
			simulateInput, i, q;

		if (q = InstantFoxModule.currentQuery) {
			q.shadowOff = false
			if (key == 9 || (!ctrl && !shift && key == 39)) { // 9 == Tab
				if (InstantFox.rightShadow != '') {
					gURLBar.value += InstantFox.rightShadow;
					InstantFox.rightShadow = '';
					simulateInput = true;
				}
			}
			else if (key == 39 && ctrl && !shift) { // 39 == RIGHT
				if (InstantFox.rightShadow != '' && gURLBar.selectionEnd == gURLBar.value.length) {
					gURLBar.value += InstantFox.rightShadow[0]
					simulateInput = true;
				}
			}
			else if (key == 13 && !meta && !ctrl) { // 13 == ENTER
				if (InstantFox.pageLoader.previewIsActive) {
					q.shadow = ""
					InstantFox.onEnter(null, alt)
					event.preventDefault();
				}
				// case with no preview will be handled by gURLBar.handleCommand
			}
			else if (!alt && !meta && !ctrl && [38,40,34,33].indexOf(key)!=-1) {//UP,DOWN,PAGE_UP,PAGE_DOWN
				if(!q.plugin.disableInstant) {
					q.shadow = '';
					InstantFox.schedulePreload()
				}
			}
			else if (key == 27) { // 27 == ESCAPE
				if (InstantFox.pageLoader.preview.parentNode){
					InstantFox.pageLoader.removePreview()
					// restore security and icon
					XULBrowserWindow._hostChanged = true
					XULBrowserWindow.onSecurityChange(null, null, XULBrowserWindow._state);
				} else if (InstantFoxModule.currentQuery) {
					InstantFox.finishSearch()
				} else {
					return
				}
			}
			else if (key == 8 || key == 46) { // 8 == BACK_SPACE, 46 == DELETE
				if(gURLBar.selectionEnd == gURLBar.mInputField.value.length){
					InstantFoxModule.currentQuery.shadowOff = true
					simulateInput = key == 46
				}
			}
		}

		if (key == 32 && (ctrl || meta)) { // 32 == SPACE
			var origVal = gURLBar.value;
			var keyIndex = origVal.indexOf(' ')
			var key = origVal.substring(0,keyIndex)

			if(InstantFoxModule.resolveShortcut(key) || key[0] == '`'){
			//gURLBar.value = '`'+origVal
				if (gURLBar.selectionStart <= keyIndex) {
					gURLBar.selectionStart = keyIndex+1
					gURLBar.selectionEnd = origVal.length
				} else {
					gURLBar.selectionStart = key[0] == '`' ? 1 : 0
					gURLBar.selectionEnd = keyIndex
				}
				simulateInput = true
			}else{
				var val = InstantFoxModule.queryFromURL(origVal)
				if(val){
					gURLBar.value = val
				}else{
					gURLBar.selectionStart = 0
					gURLBar.selectionEnd = origVal.length
				}
			}
		} else if (ctrl && [38,40,34,33].indexOf(key)!=-1){
			var amount = key == 38 ?  10:
						 key == 40 ? -10:
						 key == 34 ? -200:
					   /*key == 33 ?*/200;
			if(InstantFox.pageLoader.previewIsActive)
				var win = InstantFox.pageLoader.preview.contentWindow
			else
				var win = window.content

			win.scrollBy(0, -amount)
		}

		if(simulateInput){
			gURLBar.controller.handleText(true)
			InstantFox.onInput()
			event.preventDefault();
		}
	},
	onInput: function() {
		var val = gURLBar.value;
		gBrowser.userTypedValue = val;
		dump(val)

		var q = InstantFox.getQuery(val, InstantFoxModule.currentQuery)
		if (q) {
			InstantFoxModule.currentQuery = q;
			InstantFox.findBestShadow(q)
			//q.shadowOff = false
		} else if (InstantFoxModule.currentQuery) {
			InstantFoxModule.currentQuery = null;
		}

		InstantFox.updateShadowLink(q);
	},
	onblur: function(e) {
		if(gURLBar.mIgnoreFocus || e.originalTarget != gURLBar.mInputField)
			return

        if (InstantFox._isOwnQuery && !gURLBar.mIgnoreFocus && e.originalTarget == gURLBar.mInputField) {
			//gURLBar.value = content.document.location.href;
			//gBrowser.userTypedValue = null;
			InstantFox.finishSearch("block");
        }
		//InstantFox.mouseUI.remove();
    },
	onfocus: function(e) {
		if(gURLBar.mIgnoreFocus || e.originalTarget != gURLBar.mInputField)
			return
		//InstantFox.mouseUI.add();
    },

	// ****** ----- -------- ****************************************
	_isOwnQuery: false,
	$urlBarModified: false,

	get _ctabID() gBrowser.mCurrentTab.linkedPanel,
	get _url() InstantFoxModule.currentQuery,

	getQuery: function(val, oldQ){
		//dump(val, oldQ)
		var plugin, key
		var i = val.indexOf(' ');
		if(val[0]=='`'){
			if (i == -1)
				i = val.length
			key = val.substring(0, i)
			if(gURLBar.selectionStart <= i)
				plugin = {
					suggestPlugins: true,
					key: key,
					tail: val.substr(i),
					disableInstant: true
				}
			else
				plugin = InstantFoxModule.getBestPluginMatch(key.substr(1))
		}else{
			if (i == -1)
				return this.defQ
			key = val.substr(0, i)
			var id = InstantFoxModule.resolveShortcut(key)
			if (!id)
				return this.defQ;
			plugin = InstantFoxModule.Plugins[id]
		}

		var j = val.substr(i).match(/^\s*/)[0].length
		if (!oldQ || oldQ.plugin != plugin) {
			oldQ = {
				//browserText: nsContextMenu.prototype.getSelectedText().substr(0, 50),
				tabId: gBrowser.mCurrentTab.linkedPanel,
				onSearchReady: this.onSearchReady,
				shadow: ''
			}
		}

		oldQ.key = key
		oldQ.plugin = plugin
		oldQ.query = val.substr(i+j)
		oldQ.splitSpace = val.substr(i,j)
		oldQ.value = val
		return oldQ
	},
	onSearchReady: function(){
		var q = this;
		InstantFox.findBestShadow(q)
		InstantFox.updateShadowLink(q)
		if(!q.plugin.disableInstant)
			q.shadow ? InstantFox.doPreload(q):InstantFox.schedulePreload(100)

		// show logo if it fits into popup
		InstantFox.updateLogo(true, q)
	},
	updateLogo: function(show, q) {
		show = show && q.results && q.results.length >= 4
		if (this.logoAdded == show)
			return;
		this.logoAdded = show;

		if(show)
			gURLBar.popup.richlistbox.setAttribute('type', 'InstantFoxSuggest')
		else
			gURLBar.popup.richlistbox.removeAttribute('type')
	},
	findBestShadow: function(q){
		q.shadow = ''
		// after backspace and delete
		if(q.shadowOff)
			return

		var query = q.query.toLowerCase()
		var maxIndex = 5 // do not pick shadow from invisible results
		for each(var i in q.results) {
			if (!maxIndex--)
				break
			var title = i.title.toLowerCase()
			if (title == query) {
				q.shadow = i.title
				break
			}
			if (!q.shadow && title.indexOf(query) == 0)
				q.shadow = i.title
		}
	},
	updateShadowLink: function(q){
		//var q = InstantFoxModule.currentQuery;
		if(!q) {
			if(!gURLBar.currentShadow)
				return;
			gURLBar.currentShadow = null;
			gURLBar.instantFoxKeyNode.textContent =
			gURLBar.instantFoxSpacerNode.textContent =
			gURLBar.instantFoxShadowNode.textContent = '';
			gURLBar.instantFoxTipNode.parentNode.hidden = true;
			this.rightShadow = ''
			return
		}

		var key = q.key + q.splitSpace.replace(' ', '\u00a0', 'g');
		var l = 1
		var s = {
			key: key,
			spacer: q.value.substr(key.length).replace(' ', '\u00a0', 'g'),
			shadow: q.shadow.substr(q.query.length)
		}
		gURLBar.instantFoxKeyNode.textContent = s.key;
		gURLBar.instantFoxSpacerNode.textContent = s.spacer
		gURLBar.instantFoxShadowNode.textContent = s.shadow;
		gURLBar.currentShadow = s
		this.rightShadow = s.shadow // fixme
		gURLBar.instantFoxTipNode.parentNode.hidden = false;
		gURLBar.instantFoxTipNode.textContent = InstantFoxModule.getString("hint.tabToComplete"); //\u21B9 \u21C4
		this.$urlBarModified = true
	},

	// ****** instant preview ****************************************
	minLoadTime: 100,
	maxLoadTime: 200,
	doPreload: function(q) {
		if (this._timeout != null)
			this._timeout = clearTimeout(this._timeout)

		var url2go = InstantFoxModule.urlFromQuery(q);
		var handler = this.contentHandlers[q.plugin.id] || this.contentHandlers.__default__;
		if (this._isOwnQuery && handler.transformURL) {
			url2go = handler.transformURL(q, url2go)
		}

		/****************************/
		if (q.$searchBoxAPI_URL == null) {
			q.$searchBoxAPI_URL = this.searchBoxAPI.getUrl()
		}
		if (this._isOwnQuery && this.searchBoxAPI.canLoad(q.$searchBoxAPI_URL, url2go)) {
			this.searchBoxAPI.setDimensions()	
			this.searchBoxAPI.onInput()
			return
		}
		/****************************/
		if (handler.isSame(q, url2go)) {
			handler.onLoad && handler.onLoad(q, url2go)
			return url2go
		}

		var now = Date.now()

		if (this._isOwnQuery) {
			if(now - this.loadTime < this.minLoadTime){
				this.schedulePreload(this.minLoadTime)
				return
			}
			if (handler.onLoad && handler.onLoad(q, url2go))
				return url2go
		} else {
			this._isOwnQuery = true;
		}

		q.preloadURL = url2go

		this.pageLoader.addPreview(url2go);

		this.loadTime = q.loadTime = now
		return url2go
	},
	schedulePreload: function(delay) {
		if (this._timeout != null)
			return;

		this._timeout = setTimeout(function(self){
			self._timeout = null
			if(InstantFoxModule.currentQuery)
				self.doPreload(InstantFoxModule.currentQuery)
			else
				self.defaultSearch.doPreload()

		}, delay||200, this)
	},
	onPageLoad: function(spec){
		dump(spec)
	},
	finishSearch: function() {
		this.$urlBarModified = this._isOwnQuery = false
		this.updateShadowLink(null)
		gBrowser.userTypedValue = null;
		
		

		var q = InstantFoxModule.currentQuery, br
		
		if (q && q.$searchBoxAPI_URL) {
			q.$searchBoxAPI_URL = null
			this.searchBoxAPI.onFinish(q.shadow || q.query)
		}
		
		if (!q) {
			this.pageLoader.removePreview()
		} else if (q.tabId == this._ctabID) {
			this.pageLoader.persistPreview(q.forceNewTab? 'new' : '')
		} else {
			for (var i = 0; i < gBrowser.tabs.length; i++) {
				if (gBrowser.tabs[i].linkedPanel == q.tabId ){
					var tab = gBrowser.tabs[i]
					break
				}
			}
			if(tab) {
				this.pageLoader.persistPreview(tab, true)
			}else{
				dump('no tab')
				this.pageLoader.removePreview()
			}
		}

		InstantFoxModule.currentQuery = null;
		if(this._timeout != null)
			this._timeout = clearTimeout(this._timeout)
		//
		this.updateLogo(false)
	},
	onEnter: function(value, forceNewTab){
		var q = InstantFoxModule.currentQuery
		InstantFoxModule.previousQuery = q

		//
		q.forceNewTab = InstantFoxModule.openSearchInNewTab ? !forceNewTab : forceNewTab

		//
		if (value)
			q.shadow = q.query = value
		else if (q.shadow)
			q.query = q.shadow

		//
		var tmp = this.doPreload(InstantFoxModule.currentQuery)
		//gURLBar.value = tmp;

		this.finishSearch()

		InstantFoxModule.currentQuery = null;
	},
}

/*********************************************************
 * contextMenu
 *******/
InstantFox.modifyContextMenu = function(enable){
	if (enable == undefined) {
		let pname = "extensions.InstantFox.context.usedefault"
		enable = !(Services.prefs.prefHasUserValue(pname) && Services.prefs.getBoolPref(pname))
	}
	let proto = nsContextMenu.prototype
	if (enable && !proto.isTextSelection_orig) {
		proto.isTextSelection_orig = proto.isTextSelection_orig || proto.isTextSelection
		proto.isTextSelection = function() {
			var splitMenu = document.getElementById("ifox-context-searchselect") || this.createSearchItem()
			var menuitem = splitMenu.menuitem

			var selectedText = this.getSelectedText(), croppedText = selectedText

			if (!selectedText){
				splitMenu.hidden = true
				return false;
			}

			if (selectedText.length > 15)
				croppedText = selectedText.substr(0,15) + this.ellipsis;

			var engine = InstantFoxModule.Plugins[InstantFoxModule.defaultPlugin];

			// format "Search <engine> for <selection>" string to show in menu
			var menuLabel = gNavigatorBundle.getFormattedString("contextMenuSearchText",
																[engine.name, croppedText]);
			if (menuitem) {
				menuitem.label = menuLabel;
				menuitem.image = engine.iconURI
				splitMenu.setAttribute('name', engine.id)
				menuitem.accessKey = gNavigatorBundle.getString("contextMenuSearchText.accesskey");
				splitMenu.hidden = false
			}
			// this caches the selected text in isTextSelected
			return selectedText;
		}

		proto.createSearchItem = function(){
			var old = document.getElementById("context-searchselect")
			if(old){
				nsContextMenu.prototype.oldNode = old
				nsContextMenu.prototype.oldNodePosId = old.nextSibling && old.nextSibling.id
				InstantFox.rem(old)
			}

			var m = InstantFox.$el('menu', {
				'id':         "ifox-context-searchselect",
				'type':       "splitmenu",
				'onclick':    "gContextMenu&&gContextMenu.doSearch(event)",
				'oncommand':  "gContextMenu&&gContextMenu.doSearch(event)",
				'class':      "menu-non-iconic"
			})

			var p = InstantFox.$el('menupopup', {
				'onpopupshowing': "gContextMenu.fillSearchSubmenu(this)"
			}, m)

			var s = document.getElementById("context-sep-open")
			var c = document.getElementById("contentAreaContextMenu")
			c.insertBefore(m, s)
			return m
		}
		proto.getSelectedText = function() {
			// getBrowserSelection crops to 150
		    var focusedWindow = document.commandDispatcher.focusedWindow;
			var selectedText = focusedWindow.getSelection().toString();

			if (selectedText)
				return selectedText
			try{
				var editor = content.document.activeElement
					.QueryInterface(Ci.nsIDOMNSEditableElement).editor
			}catch(e){
				try{
					var editor = document.popupNode
						.QueryInterface(Ci.nsIDOMNSEditableElement).editor
				}catch(e){}
			}
			try{
				return editor.selection.toString()
			}catch(e){}
			return ''
		}
		proto.fillSearchSubmenu = function(popup) {
			var menu
			while(menu = popup.firstChild)
				popup.removeChild(menu)
			
			var $el = InstantFox.$el

			for each (engine in InstantFoxModule.Plugins) {
				if(engine.disabled || engine.hideFromContextMenu)
					continue

				menu = $el('menuitem', {
					'name' : engine.id,
					'label': engine.name,
					'image': engine.iconURI,
					'class': "menuitem-iconic",
				}, popup)
			}
			menu = $el('menuseparator', null, popup)
			menu = $el('menuitem', {
				'name' :  "__search_site__",
				'label':  InstantFoxModule.getString("context.searchSite")
			}, popup)
		}
		proto.doSearch = function(e) {
			if(e.target.menuitem && !e.target.isMenuitemActive)
				return;
			// needed to prevent calling command listener after click listener
			if(e.button != 1)
				gContextMenu = null

			var name = e.target.getAttribute('name'), href;
			if (!name)
				return;
			var selectedText = this.getSelectedText()
			if (name == '__open_as_link__') {
				href = selectedText
			} else if (name == '__search_site__'){
				href  = InstantFoxModule.urlFromQuery("google", selectedText + ' site:' + gBrowser.currentURI.host)
			} else {
				href  = InstantFoxModule.urlFromQuery(name, selectedText)
			}

			this.openLinkIn(href, e);
		}
		proto.openLinkIn = function(href, e, postData, fixup){
			var where = e.target.getAttribute('where') || "tab"
			if(e.button == 1)
				where = "tabshifted"
			else if(e.button == 2)
				where = "current"
			if(e.ctrlKey || e.altKey){
				if(where == 'tab')
					where = 'tabshifted'
				else if(where == 'tabshifted')
					where = 'tab';
			}else if(e.shiftKey && where != 'current')
				where = 'current';

			openLinkIn(href, where, fixup||{postData: postData, relatedToCurrent: true});
		}
	}
	else if(!enable && proto.isTextSelection_orig){
		proto.isTextSelection = proto.isTextSelection_orig
		delete proto.isTextSelection_orig
		delete proto.createSearchItem
		delete proto.getSelectedText
		delete proto.fillSearchSubmenu
		delete proto.doSearch
		delete proto.openLinkIn
		let popup = document.getElementById("contentAreaContextMenu")
		let node = document.getElementById("ifox-context-searchselect")
		InstantFox.rem(node)
		proto.oldNode && popup.insertBefore(proto.oldNode, proto.oldNodePosId && document.getElementById(proto.oldNodePosId))
	}
}

/*********************************************************
 * urlbarCommand
 *******/
InstantFox.hookUrlbarCommand = function(off){
	if (off) {
		this.handleCommand_orig && (gURLBar.handleCommand = this.handleCommand_orig)
		this.URLBarSetURI_orig && (window.URLBarSetURI = this.URLBarSetURI_orig)
		this._urlbarCutCommand_orig && (gURLBar._copyCutController.doCommand = this._urlbarCutCommand_orig)
	} else {
		this.handleCommand_orig = gURLBar.handleCommand
		gURLBar.handleCommand = this.handleCommand
		
		this.URLBarSetURI_orig = window.URLBarSetURI
		window.URLBarSetURI = this.URLBarSetURI
		
		this._urlbarCutCommand_orig = gURLBar._copyCutController.doCommand 
		gURLBar._copyCutController.doCommand = this._urlbarCutCommand
	}
}

InstantFox.handleCommand = function(aTriggeringEvent) {
	if (aTriggeringEvent instanceof MouseEvent && aTriggeringEvent.button == 2)
		return; // Do nothing for right clicks
	var url = this.value;
	var instantFoxUri;
	var mayInheritPrincipal = false;
	var postData = null;

	var action = this._parseActionUrl(url);
	if (action) {
		url = action.param;
		if (this.hasAttribute("actiontype")) {
			if (action.type == "switchtab") {
				this.handleRevert();
				let prevTab = gBrowser.selectedTab;
				if (switchToTabHavingURI(url) && isTabEmpty(prevTab))
					gBrowser.removeTab(prevTab);
			}
			return;
		}
	} else {
		var isModifierPressed = function(e) {
			return e && (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey)
		}
		var canBeUrl = function(str) {
			if (str[0] == " ")
				return false
			if (/^[\w\-]+:/.test(str))
				return true
			if (/[\.\/\\]/.test(str))
				return true
			if (/^localhost/.test(str))
				return true
		}

		InstantFox.onInput()
		// instantfox shortcuts have the highest priority
		if (InstantFoxModule.currentQuery) {
			url = InstantFoxModule.urlFromQuery(InstantFoxModule.currentQuery);
			InstantFoxModule.currentQuery.shadow = "" // remove this line to get to the first suggest
			InstantFox.finishSearch()
		} else if (InstantFoxModule.autoSearch && !InstantFoxModule.autoSearch.disabled && !isModifierPressed(aTriggeringEvent)) {
			url = url.trimRight() // remove spaces at the end
			if (!url)
				url = InstantFoxModule.autoSearch.url.replace(/[#\?].*/, "")
			else {
				// let firefox to handle builtin shortcuts if any
				var postData = {};
				var mayInheritPrincipal = { value: false };
				var shortcutURL = getShortcutOrURI(url, {}, {})
				postData = postData.value
				mayInheritPrincipal = mayInheritPrincipal.value
				
				if (shortcutURL != url)
					url = shortcutURL
				else if (!canBeUrl(url))
					url = InstantFoxModule.urlFromQuery(InstantFoxModule.autoSearch, url)
			}
		} else {
			// fallback to default behaviour of adding .com/.net/.org
			[url, postData, mayInheritPrincipal] = this._canonizeURL(aTriggeringEvent)
		}

        if (!url)
            return;
    }

    this.value = url;
    if(!instantFoxUri)
		gBrowser.userTypedValue = url;

    try {
		if(!instantFoxUri)
			addToUrlbarHistory(url);
    } catch (ex) {
        Cu.reportError(ex);
    }

    function loadCurrent() {
        var flags = instantFoxUri ? 0 : Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP;
        if (!mayInheritPrincipal) {
            flags |= Ci.nsIWebNavigation.LOAD_FLAGS_DISALLOW_INHERIT_OWNER;
        }
        gBrowser.loadURIWithFlags(url, flags, null, null, postData);
    }

	// Focus the content area before triggering loads, since if the load
	// occurs in a new tab, we want focus to be restored to the content
	// area when the current tab is re-selected.
	gBrowser.selectedBrowser.focus();

	if (aTriggeringEvent instanceof MouseEvent) {
		// We have a mouse event (from the go button), so use the standard
		// UI link behaviors
		let where = whereToOpenLink(aTriggeringEvent, false, false);
		if (where == "current") {
			loadCurrent();
		} else {
			this.handleRevert();
            openUILinkIn(url, where, {allowThirdPartyFixup: true, postData: postData});
        }
	} else if (aTriggeringEvent && aTriggeringEvent.altKey && !isTabEmpty(gBrowser.selectedTab)) {
		this.handleRevert();
        gBrowser.loadOneTab(url, {postData: postData, inBackground: false, allowThirdPartyFixup: true});
		aTriggeringEvent.preventDefault();
		aTriggeringEvent.stopPropagation();
	} else {
		loadCurrent();
	}
}
InstantFox.URLBarSetURI = function(aURI) {
	// auri is null if URLBarSetURI is called from urlbar.handleRevert
	if (InstantFox.$urlBarModified) {
		if (aURI
			&& InstantFoxModule.currentQuery
			&& InstantFoxModule.currentQuery.tabId == InstantFox._ctabID
		) {
			InstantFox.onPageLoad(aURI.spec)
			return;
		} else { //hide shadow if user switched tabs
			InstantFox.finishSearch();
		}
	}
    var value = gBrowser.userTypedValue;
    var valid = false;
    if (value == null) {
        var uri = aURI || getWebNavigation().currentURI;
        if (gInitialPages.indexOf(uri.spec) != -1) {
            value = content.opener ? uri.spec : "";
        } else {
            value = losslessDecodeURI(uri);
        }
        valid = uri.spec != "about:blank";
		// do not allow "about:blank"
		if(!valid) value = '';
    }
    gURLBar.value = value;
    SetPageProxyState(valid ? "valid" : "invalid");
}
// todo: find better way to intercept cut command
InstantFox._urlbarCutCommand =  function(aCommand){
	var urlbar = this.urlbar;
	var val = urlbar._getSelectedValueForClipboard();
	if (!val)
		return;

	if (aCommand == "cmd_cut" && this.isCommandEnabled(aCommand)) {
		var start = urlbar.selectionStart;
		var end = urlbar.selectionEnd;
		// This should reset any "moz-action:" prefix.
		urlbar.value = urlbar.inputField.value.substring(0, start) +
							urlbar.inputField.value.substring(end);
		urlbar.selectionStart = urlbar.selectionEnd = start;
		SetPageProxyState("invalid");
		InstantFox.onInput()
	}

	Cc["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Ci.nsIClipboardHelper)
			.copyString(val);
}


dump("instantfox initialization success")
