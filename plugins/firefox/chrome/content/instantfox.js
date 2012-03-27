window.InstantFox = {
	// function overriding.
	// using this instead of eval to not get slow reviews because of "eval crusade"
	// BrowserSearch.addEngine with removed this.searchBar check
	addEngine_: function(engine, targetDoc) {
		var browser = gBrowser.getBrowserForDocument(targetDoc);
		if (!browser)
			return;
		if (browser.engines && browser.engines.some((function(e) e.title == engine.title)))
			return;

		var iconURL = null;
		if (gBrowser.shouldLoadFavIcon(targetDoc.documentURIObject))
			iconURL = targetDoc.documentURIObject.prePath + "/favicon.ico";

		var hidden = false;
		if (Services.search.getEngineByName(engine.title))
			hidden = true;

		var engines = (hidden ? browser.hiddenEngines : browser.engines) || [];
		engines.push({uri: engine.href, title: engine.title, icon: iconURL});
		if (hidden)
			browser.hiddenEngines = engines;
		else
			browser.engines = engines;
	},
	webSearch_: function() {
		if (window.fullScreen) {
			FullScreen.mouseoverToggle(true);
		}
		var searchBar = this.searchBar;
		if (!searchBar || !isElementVisible(searchBar)) {
			var p = InstantFoxModule.Plugins[InstantFoxModule.defaultPlugin]
			if (p) {
				gURLBar.focus()
				var val = gURLBar.value
				var key = p.key + " "
				if (val.substring(0,key.length)!=key) {
					gURLBar.value = key
					InstantFox.onInput()
					val = key + val
					gURLBar.value = val
				}
				gURLBar.setSelectionRange(key.length, val.length)
				return
			}
			searchBar = gURLBar
		}
		searchBar.select();
		searchBar.focus();
	},

	$patch: function(obj, funcName, patchName) {
		patchName = patchName || funcName+'_'
		if (this[funcName+'_orig'])
			return Cu.reportError(funcName + " already patched")
		this[funcName+'_orig'] = obj[funcName]
		obj[funcName] = this[patchName]
	},
	$unpatch: function(obj, funcName, patchName) {
		patchName = patchName || funcName+'_'
		if (this[patchName] != obj[funcName])
			return Cu.reportError("can't restore "+funcName)
		obj[funcName] = this[funcName+'_orig']
		this[funcName+'_orig'] = null
	},
	// end overrides

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
	reloadBinding: function(node) {
		return node && node.parentNode && node.parentNode.insertBefore(node, node.nextSibling)
	},
    idsToRemove: [],
	// belong to notifyTab
	addTab: function(url, nextToCurrent){
		if(url){
			var targetTab = gBrowser.addTab(url);
			if(nextToCurrent)
				gBrowser.moveTabTo(targetTab , gBrowser.mCurrentTab._tPos+1)
			gBrowser.selectedTab = targetTab;
			return targetTab
		}
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
				action: ''
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

		this.stylesheet = document.createProcessingInstruction('xml-stylesheet', 'href="chrome://instantfox/content/skin/instantfox.css"')
		document.insertBefore(this.stylesheet, document.documentElement)
		setTimeout(this.updateUserStyle, 200, true) // needs some time untill stylesheet is loaded

		this.setURLBarAutocompleter()

		gURLBar.addEventListener('keydown', this.onKeydown, false);
		// must be capturing to run after value is changed and before autocompleter
		gURLBar.addEventListener('input', this.onInput, true);
		// _copyCutController prevents cut event, so modify it in hookUrlbarCommand
		// gURLBar.addEventListener('cut', this.onInput, false);

		gURLBar.addEventListener('blur', this.onblur, false);
		gURLBar.addEventListener('focus', this.onfocus, false);

		// afterCustomization
		gNavToolbox.addEventListener('aftercustomization', this.updateToolbarPrefs, false);

		dump('instantFox initialized')
		this.applyOverlay()


		// this is needed if searchbar is removed from toolbar
		this.$patch(BrowserSearch, 'addEngine')
		this.$patch(BrowserSearch, 'webSearch')

		this.hookUrlbarCommand()
		this.modifyContextMenu()
	},

	destroy: function(event) {
		// finishSearch
		gURLBar.blur()
		this.pageLoader.removePreview()
		this.updateLogo(false)

		// destroy popup
		this.onPopupHiding = dump
		this.popupCloser({target:''})
		this.applyOverlay('off')


		gURLBar.removeEventListener('keydown', this.onKeydown, false);
		gURLBar.removeEventListener('input', this.onInput, true);
		gURLBar.removeEventListener('focus', this.onfocus, false);
		gURLBar.removeEventListener('blur', this.onblur, false);

		gNavToolbox.removeEventListener('aftercustomization', this.updateToolbarPrefs, false);

		this.hookUrlbarCommand('off')
		this.modifyContextMenu(false)

		this.removeShadowNodes()


		this.rem(this.stylesheet)

		this.setURLBarAutocompleter('off')

		delete window.InstantFox
		delete window.InstantFoxModule

		this.$unpatch(BrowserSearch, 'addEngine')
		this.$unpatch(BrowserSearch, 'webSearch')
	},

	setURLBarAutocompleter: function(state){
		var search = InstantFox._autocompletesearch_orig, oninput = InstantFox._oninput_orig
		if (state != 'off') {
			var s = InstantFox._autocompletesearch_orig = gURLBar.getAttribute('autocompletesearch')
			var n = 'instantFoxAutoComplete'
			InstantFox._oninput_orig = gURLBar.getAttribute('oninput')
			search = /\bhistory\b/.test(s) ? s.replace(/\bhistory\b/,n) : n;
			oninput = ''
		}
		gURLBar.setAttribute("autocompletesearch", search)
		gURLBar.setAttribute('oninput', oninput);

		// reload binding
		this.reloadBinding(gURLBar)
	},

	updateUserStyle: function(firstTime) {
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
		var changeSelector = function(oldSelector, newSelector){
			try{
				var r = findRule(oldSelector)
				if (!r)
					return
				var t = r.cssText
				if (t.substring(0, newSelector.length) != newSelector) {
					t = newSelector + t.substr(t.indexOf("{")-1)
					sheet.deleteRule(ruleIndex);
					sheet.insertRule(t, ruleIndex)
				}
			}catch(e){
				Cu.reportError(e)
			}
		}

		var sheet = InstantFox.stylesheet.sheet
		cssRules = sheet.cssRules


		if (prefs.prefHasUserValue('shadowStyle')) {
			var selector = '.instantfox-shadow[selected]'
			var newSelector = selector
			if (prefs.getCharPref('shadowStyle'))
				newSelector += ',.instantfox-shadow'
			changeSelector(selector, newSelector)
		}
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

			changeSelector("richlistitem.", newSelector)
		}
		//without this adding opacity to popup creates black background on xp
		if (firstTime)
			InstantFox.reloadBinding(InstantFox.$("PopupAutoCompleteRichResult"))
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
		var spacePos = val.indexOf(' ');

		if (val[0]!='`') {
			if (spacePos == -1)
				return this.defQ
			key = val.substr(0, spacePos)
			var id = InstantFoxModule.resolveShortcut(key)
			if (!id)
				return this.defQ;
			plugin = InstantFoxModule.Plugins[id]
		} else { //searching through plugins
			var cursorPos = gURLBar.selectionStart
			var plugin = oldQ && oldQ.plugin

			if (spacePos == -1)
				spacePos = val.length

			key = val.substring(0, spacePos)
			// sort plugins
			var needle = key.substr(1).replace('\xB7', ' ', 'g').toLowerCase()
			pluginSuggestions = []
			for each(var p in InstantFoxModule.Plugins){
				if (p.key == needle) {
					p.score = Infinity
					pluginSuggestions.push(p)
					continue
				}
				p.score = 0
				if (p.key && p.key.indexOf(needle) == 0)
					p.score += 100000
				var name = p.name.toLowerCase()
				var i = -1, j = 0, score = 0
				for each (var ch in needle) {
					i = name.indexOf(ch, i + 1)
					dump(i,name,needle)
					if (i == -1) {
						score = 0
						break
					}
					if (i == 0)
						score += 4
					if (j == i + 1)
						score += 2
					else
						score += 1
					j = i
				}

				p.score += score
				p.score && pluginSuggestions.push(p)
			}
			if (!pluginSuggestions[0]){
				var defp = InstantFoxModule.Plugins[InstantFoxModule.defaultPlugin]
				pluginSuggestions.push(defp)
			}

			pluginSuggestions.sort(function(a,b){
				if (a.score == b.score)
					return a.name > b.name
				return b.score - a.score
			})
			dump(pluginSuggestions, pluginSuggestions.length)
			//------------------------
			if (cursorPos > spacePos) {
				plugin = pluginSuggestions[0]
			} else {
				plugin = {
					pluginSuggestions: pluginSuggestions,
					key: key,
					tail: val.substr(spacePos),
					disableInstant: true
				}
			}
		}


		var spaceLen = val.substr(spacePos).match(/^\s*/)[0].length
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
		oldQ.query = val.substr(spacePos + spaceLen)
		oldQ.splitSpace = val.substr(spacePos, spaceLen)
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
			/*if (title == query) {
				q.shadow = i.title
				break
			}*/
			if (!q.shadow && title.indexOf(query) == 0)
				q.shadow = i.title
		}
	},
	updateShadowLink: function(q){
		//var q = InstantFoxModule.currentQuery;
		var s = gURLBar.mInputField.instantFoxShadow
		if(!q) {
			if(!s)
				return;
			s.keyNode.textContent =
			s.spacerNode.textContent =
			s.shadowNode.textContent = '';
			s.tipNode.parentNode.hidden = true;
			this.rightShadow = ''
			return
		}

		if (!s || !s.box1 || s.box1.parentNode != gURLBar.mInputField.parentNode)
			s = this.prepareShadowNodes()

		var key = q.key + q.splitSpace.replace(' ', '\u00a0', 'g');
		var l = 1
		s.key = key,
		s.spacer = q.value.substr(key.length).replace(' ', '\u00a0', 'g'),
		s.shadow = q.shadow.substr(q.query.length)

		s.keyNode.textContent = s.key;
		s.spacerNode.textContent = s.spacer
		s.shadowNode.textContent = s.shadow;

		this.rightShadow = s.shadow // fixme
		s.tipNode.parentNode.hidden = false;
		s.tipNode.textContent = InstantFoxModule.getString("hint.tabToComplete"); //\u21B9 \u21C4
		this.$urlBarModified = true
	},
	removeShadowNodes: function(){
		var inputField = gURLBar.mInputField
		if(!inputField.instantFoxShadow)
			return;

		var s = inputField.parentNode
		s && s.classList.remove('instantfox-urlbar')

		for each (var hbox in s.querySelectorAll(".instantfox-box"))
			this.rem(hbox)

		delete gURLBar.mInputField.instantFoxShadow
	},
	prepareShadowNodes: function() {
		var container = gURLBar.mInputField.parentNode
		// measure sizes before modifiing dom
		var l1 = gURLBar.editor.rootElement.getBoundingClientRect().left
		var l2 = container.getBoundingClientRect().left

		container.classList.add('instantfox-urlbar')

		var shadow = gURLBar.mInputField.instantFoxShadow = {}

		function hbox(name, addChildDiv){
			var hb = document.createElement('hbox')
			hb.align = 'center'
			hb.className = "instantfox-"+name
			if(addChildDiv){
				hb.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml','div'))

				shadow[name + "Node"] = hb.firstChild;
			}
			return hb
		}

        var b2 = shadow.box2 = hbox('box')
		b2.setAttribute('pack', 'end')
		b2.setAttribute('onclick','InstantFox.openHelp()')
		b2.appendChild(hbox('tip', true))
		container.appendChild(b2)

		var b1 = shadow.box1 = hbox('box')
		b1.appendChild(hbox('key',true))
		b1.appendChild(hbox('spacer',true))
		b1.appendChild(hbox('shadow',true))
		container.insertBefore(b1, container.firstChild)

		var boxStyle = b1.style;
		boxStyle.marginLeft = l1 - l2 + 'px'
		// 1px is from getComputedStyle(gURLBar.mInputField.editor.rootElement).paddingLeft
		// this is platform independant.
		boxStyle.paddingLeft = '1px'
		boxStyle.paddingRight = '1px'

		return shadow
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

		dump(InstantFoxModule.takeSuggestedOnEnter,q.shadow,q.query)
		//
		this.fixQueryBeforeEnter(q, value)

		//
		var tmp = this.doPreload(InstantFoxModule.currentQuery)
		//gURLBar.value = tmp;

		this.finishSearch()

		InstantFoxModule.currentQuery = null;
	},
	// apply setting for taking shadow even when unselected
	fixQueryBeforeEnter: function(q, value){
		if (!value) {
			if (InstantFoxModule.takeSuggestedOnEnter && q.shadow)
				value = q.shadow
			else
				value = q.query
		}
		q.shadow = q.query = value
	}
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
	var patcher = off ? '$unpatch' : '$patch'
	this[patcher](gURLBar, 'handleCommand')
	this[patcher](window, 'URLBarSetURI')
	this[patcher](gURLBar._copyCutController, 'doCommand', '_urlbarCutCommand')
}

InstantFox.handleCommand_ = function(aTriggeringEvent) {
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
			if (/^[\w\-]+:/.test(str))
				return true
			if (/^localhost/.test(str))
				return true
			if (/^(\w+)\.(\w{1,4})(\.\w{1,4})?($|\/|:)/.test(str))
				return true
			if (/[\/\\]/.test(str))
				return true
			if (/[\.]/.test(str))
				return true
		}

		InstantFox.onInput()
		// instantfox shortcuts have the highest priority
		if (InstantFoxModule.currentQuery) {
			var q = InstantFoxModule.currentQuery
			InstantFox.fixQueryBeforeEnter(q)
			url = InstantFoxModule.urlFromQuery(q)
			InstantFox.finishSearch()
			if (InstantFoxModule.openSearchInNewTab) {
				aTriggeringEvent = {__noSuchFunction__: function(){}}
				aTriggeringEvent.altKey = true
			}
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
InstantFox.URLBarSetURI_ = function(aURI) {
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
InstantFox._urlbarCutCommand = function(aCommand){
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
