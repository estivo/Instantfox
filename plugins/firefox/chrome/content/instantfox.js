//var currentTab = getWebNavigation().sessionHistory;.getEntryAtIndex(currentTab.count-1, false).URI.spec
var InstantFox = {
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
			var prefName = "extensions.instantfox.version";
			var oldVersion = Services.prefs.getCharPref(prefName);
			var newVersion = addon.version;
			if (oldVersion == newVersion)
				return;

			Services.prefs.setCharPref(prefName, newVersion);
			if(oldVersion == "0.0.0"){
				var url = InstantFox.install_url + '?to=' + newVersion;
				// add options button only on first install
				InstantFox.updateToolbarItems();
				setTimeout(InstantFox.showInstallNotification, 600);
			}else{
				var url = InstantFox.update_url + '?to=' + newVersion + '&from=' +oldVersion
				if (oldVersion<'2.5.0')
					InstantFox.updateToolbarItems();
				// check if new plugins are added by this update
				InstantFoxModule.pluginLoader.onInstantfoxUpdate()
			}


			setTimeout(InstantFox.addTab, 500, url);
		})
	},
	showInstallNotification: function(){
		var n = {
			id: 'instant-fox-installed',
			anchor: "instantFox-options",
			label: "NEW!\nYour Instantfox configuration menu & shortcuts!\nEdit your language settings and add your own search-plugins!",
			hide: 'document.getBindingParent(this).parentNode.hidePopup();',
			mainActionLabel: 'ok',
			action: 'document.getElementById("instantFox-options").open=true;',
			a: {
				label: 'remove this button',
				action: 'InstantFox.updateToolbarItems(true)'
			}
		}

		var doc = document;
		var p = doc.createElement('panel')
		p.setAttribute('type', 'arrow')
		doc.getElementById("mainPopupSet").appendChild(p)


		var popupnotification = doc.createElement("popupnotification");
		popupnotification.setAttribute("label", n.label);
		popupnotification.setAttribute("popupid", n.id);
		popupnotification.setAttribute("closebuttoncommand", n.hide);

		popupnotification.setAttribute("buttonlabel", n.mainActionLabel);
		popupnotification.setAttribute("buttoncommand", n.hide + n.action);
		popupnotification.setAttribute("menucommand", "event.target.action?" + n.a.action + ':' + n.hide);
		popupnotification.setAttribute("closeitemcommand", n.hide);

		//secondary actions
		var item = doc.createElement("menuitem");
        item.setAttribute("label", n.a.label);
        item.action = true;
        popupnotification.appendChild(item);
		var closeItemSeparator = doc.createElement("menuseparator");
        popupnotification.appendChild(closeItemSeparator);

		// popupnotification.notification = n;
		p.appendChild(popupnotification);
		p.openPopup(doc.getElementById(n.anchor), "bottomcenter topleft");
	},
	// end belong to notifyTab

	initialize: function(event) {
		window.removeEventListener('load', arguments.callee, true);
		Cu.import('chrome://instantfox/content/instantfoxModule.js')

		gURLBar.setAttribute('autocompletesearch',	'instantFoxAutoComplete');
		gURLBar.removeAttribute('oninput');

		gURLBar.addEventListener('keydown', InstantFox.onKeydown, false);
		gURLBar.addEventListener('input', InstantFox.onInput, false);
		// gURLBar.addEventListener('cut', InstantFox.onInput, false);
		// _copyCutController prevents cut event, so modify it for now
		// (fortunately this function is same the in 3.6-8.0a)
		gURLBar._copyCutController.doCommand = InstantFox._urlbarCutCommand
		gURLBar.addEventListener('blur', InstantFox.onblur, false);
		gURLBar.addEventListener('focus', InstantFox.onfocus, false);

		dump('instantFox initialized')
		InstantFox.notifyTab()
		// apply user modified styles
		InstantFox.checkURLBarBinding()
		InstantFox.updateUserStyle()

		// this is needed if searchbar is removed from toolbar
		BrowserSearch.__defineGetter__("searchbar", function(){
			return document.getElementById("searchbar") || document.getElementById("urlbar")
		})

		InstantFox.hookUrlbarCommand()
	},

	destroy: function(event) {
		gURLBar.removeEventListener('keydown', this.onKeydown, false);
		gURLBar.removeEventListener('input', this.onInput, false);
		gURLBar.removeEventListener('focus', this.onfocus, false);
		gURLBar.removeEventListener('blur', this.onblur, false);

		this.finishSearch()
		this.hookUrlbarCommand('off')
		
		InstantFox.modifyContextMenu(false)
	},

	checkURLBarBinding: function() {
		if(gURLBar.instantFoxKeyNode)
			return;
		// our binding was overriden by some other addon
		// we can recover if it placed mInputField into stack
		var s = gURLBar.mInputField
		while (s&&s.nodeName!='xul:stack')
			s = s.parentNode;

		if(!s) {
			// todo: add !important to our bindings rule
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
		var ss = document.styleSheets
		for(var i = ss.length; i--; ){
			var s = ss[i]
			if(s.href=="chrome://instantfox/content/skin/instantfox.css"){
				// caution: this depends on the order of css rules in instantfox.css
				var prefs = Services.prefs
				if (prefs.prefHasUserValue('extensions.InstantFox.fontsize')){
					var pref = prefs.getCharPref('extensions.InstantFox.fontsize')
					if (!/^\d+.?\d*((px)|(em))$/.test(pref)){
						pref = parseFloat(pref)

						if (isNaN(pref) || pref < 0.5)
							pref = '';
						else if (pref < 2)
							pref+='em';
						else
							pref+='px';
					}
					s.cssRules[3].style.fontSize = pref;
				}
				if (prefs.prefHasUserValue('extensions.InstantFox.opacity')){
					var pref = parseInt(prefs.getIntPref('extensions.InstantFox.opacity')) / 100
					if(isNaN(pref) || pref < 0.1)
						pref = 1
					s.cssRules[2].style.opacity = pref;
				}
				if (document.dir == 'rtl'){
					s.cssRules[5].style.backgroundPosition = '5% bottom';
				}
				break
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
				if(InstantFox.pageLoader.preview.parentNode){
					InstantFox.pageLoader.removePreview()
					// restore security and icon
					XULBrowserWindow._hostChanged = true
					XULBrowserWindow.onSecurityChange(null, null, XULBrowserWindow._state);
				} else
					gURLBar.blur()
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

			if(key in InstantFoxModule.Shortcuts || key[0] == '`'){
			//gURLBar.value = '`'+origVal
				if (gURLBar.selectionStart <= keyIndex) {
					gURLBar.selectionStart = keyIndex+1
					gURLBar.selectionEnd = origVal.length
				} else {
					gURLBar.selectionStart = 0
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
		dump(val, oldQ)
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
			var id = InstantFoxModule.Shortcuts[val.substr(0, i)]
			if (!id)
				return this.defQ;
			plugin = InstantFoxModule.Plugins[id]
		}

		var j = val.substr(i).match(/^\s*/)[0].length
		if (!oldQ) {
			oldQ = {
				//browserText: nsContextMenu.prototype.getSelectedText().substr(0, 50),
				tabId: gBrowser.mCurrentTab.linkedPanel,
				onSearchReady: this.onSearchReady,
				shadow: ''
			}
		}
		oldQ.key = key || plugin.key
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
		for each(var i in q.results) {
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
		gURLBar.instantFoxTipNode.textContent = "TAB to complete"; //\u21B9 \u21C4
		this.$urlBarModified = true
	},

	// ****** instant preview ****************************************
	minLoadTime: 100,
	maxLoadTime: 200,
	doPreload: function(q) {
		if (this.timeout)
			this._timeout = clearTimeout(this._timeout)

		var url2go = InstantFoxModule.urlFromQuery(q);
		var contentHandler = this.contentHandlers[q.plugin.id];

		if(q.query && q.preloadURL && url2go.toLowerCase() == q.preloadURL.toLowerCase()){
			contentHandler && contentHandler.onLoad(q, true)			
			return url2go
		}

		q.preloadURL = url2go

		var now = Date.now()

		if(this._isOwnQuery){
			// gBrowser.docShell.isLoadingDocument
			if(now - this.loadTime < this.minLoadTime){
				this.schedulePreload(this.minLoadTime)
				return
			}
			var mustBreak = contentHandler && contentHandler.onLoad(q)

			if(mustBreak)
				return url2go
		}else{
			this._isOwnQuery = true;
		}
		this.pageLoader.addPreview(url2go);

		this.loadTime = q.loadTime = now
		return url2go
	},
	schedulePreload: function(delay) {
		if (this._timeout)
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

		var q = InstantFoxModule.currentQuery, br
		if (!q) {
			this.pageLoader.removePreview()
		} else if (q.tabId == this._ctabID){
			this.pageLoader.persistPreview(q.forceNewTab?'new':'')
		} else {
			for (var i = 0; i < gBrowser.tabs.length; i++) {
				if (gBrowser.tabs[i].linkedPanel == q.tabId ){
					var tab = gBrowser.tabs[i]
					break
				}
			}
			if(tab){
				this.pageLoader.persistPreview(tab, true)
			}else{
				dump('no tab')
				this.pageLoader.removePreview()
			}
		}

		InstantFoxModule.currentQuery = null;
		if(this.timeout)
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
		else if(q.shadow)
			q.query = q.shadow

		//
		var tmp = this.doPreload(InstantFoxModule.currentQuery)
		gURLBar.value = tmp;
		gBrowser.userTypedValue = null;

		this.finishSearch()

		InstantFoxModule.currentQuery = null;
	},
}

//************************************************************************
// experimental options popup
InstantFox.popupCloser = function(e) {
	var inPopup = InstantFox.clickedInPopup
	InstantFox.clickedInPopup = false
	if (e.target.id == 'instantFox-options') {
		window.removeEventListener('mousedown', InstantFox.popupCloser, false)
		e.target.firstChild.hidePopup()
		e.stopPropagation()
		e.preventDefault()
		return
	}
	if (inPopup || e.target.nodeName == 'resizer')
		return
	window.removeEventListener('mousedown', InstantFox.popupCloser, false)
	document.getElementById('instantFox-options').firstChild.hidePopup()
}
InstantFox.onPopupShowing = function(p) {
	if (p.parentNode.id != 'instantFox-options')
		return

	window.addEventListener('mousedown', InstantFox.popupCloser, false)

	var st = p.querySelector('stack')
	var i = p.querySelector('iframe')
	if (i){
		// touch the stack, otherwise it isn't drawn in nightly
		st.flex=0
		st.flex=1
		// rebuild in case user modified plugins by another options window instance
		try{
			i.contentWindow.onOptionsPopupShowing()
		}catch(e){Components.utils.reportError(e)}
		return;
	}
	var i = document.createElement('iframe')
	i.setAttribute('src', 'chrome://instantfox/content/options.xul')
	i.setAttribute('flex', '1')
	st.insertBefore(i, st.firstChild)
}
InstantFox.onPopupHiding = function(p) {
	var i = document.getElementById('instantFox-options').querySelector('iframe')
	i.contentWindow.savePlugins()
	window.removeEventListener('mousedown', InstantFox.popupCloser, false)
}
InstantFox.updatePopupSize = function(size) {
	var p = document.getElementById('instantFox-options').firstChild

	if (p.wrongSize){
		delete p.wrongSize
		p.width = size
	}
}
InstantFox.popupClickListener = function(e) {
	InstantFox.clickedInPopup = true
}
InstantFox.closeOptionsPopup = function(p) {
	p = p || document.getElementById('instantFox-options').firstChild
	p.hidePopup()
}
InstantFox.openHelp = function() {
	var url = InstantFoxModule.helpURL
	gBrowser.loadOneTab(url, {inBackground: false, relatedToCurrent: true});
}

// todo: call this after window load on first install releted to FS#32
InstantFox.updateToolbarItems = function(remove) {
	var myId = "instantFox-options";
	var navBar = document.getElementById("nav-bar");
	var curSet = navBar.currentSet.split(",");
	var i = curSet.indexOf(myId)

	if (i == -1 && !remove) {
		var pos = curSet.indexOf("urlbar-container") + 1;
		if (pos) {
			while ('reload-button,stop-button'.indexOf(curSet[pos]) != -1)
				pos++
		} else
			pos = curSet.length;
		curSet.splice(pos, 0, myId)
	} else if (i != -1 && remove) {
		curSet.splice(i, 1)
	}

	// remove searchbar
	i = curSet.indexOf("search-container")
	if(i != -1)
		curSet.splice(i, 1)

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
//************************************************************************
window.addEventListener('load', InstantFox.initialize, true);

// modify URLBarSetURI defined in browser.js
function URLBarSetURI(aURI) {
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
				old.parentNode.removeChild(old)
			}

			var m = document.createElement('menu')
			m.setAttribute('id', "ifox-context-searchselect")
			m.setAttribute('type', "splitmenu")
			m.setAttribute('onclick', "gContextMenu&&gContextMenu.doSearch(event)")
			m.setAttribute('oncommand', "gContextMenu&&gContextMenu.doSearch(event)")
			m.setAttribute('class', "menu-non-iconic")

			var p = document.createElement('menupopup')
			p.setAttribute('onpopupshowing', "gContextMenu.fillSearchSubmenu(this)")

			m.appendChild(p)

			var s = document.getElementById("context-sep-open")

			var c = document.getElementById("contentAreaContextMenu")
			c.insertBefore(m, s)
			return m
		}
		proto.getSelectedText = function() {
			var selectedText = getBrowserSelection();

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

			for each (engine in InstantFoxModule.Plugins){
				if(engine.disabled||engine.hideFromContextMenu)
					continue

				menu = document.createElement('menuitem')
				menu.setAttribute('name', engine.id)
				menu.setAttribute('label', engine.name)
				menu.setAttribute('image', engine.iconURI)
				menu.setAttribute('class', "menuitem-iconic")
				popup.appendChild(menu)
			}
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
			} else if (name == 'search_site'){
				href  = InstantFoxModule.urlFromQuery("google", selectedText + 'site:' + gBrowser.currentURI.host)
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
		node && node.parentNode.removeChild(node)
		popup.insertBefore(proto.oldNode, proto.oldNodePosId && document.getElementById(proto.oldNodePosId))
	}
}

InstantFox.hookUrlbarCommand = function(off){
	if (off && InstantFox.handleCommand_orig) {
		gURLBar.handleCommand = InstantFox.handleCommand_orig
	} else {
		InstantFox.handleCommand_orig = gURLBar.handleCommand
		gURLBar.handleCommand = InstantFox.handleCommand
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
		InstantFox.onInput()
		// instantfox shortcuts have the highest priority
		if (InstantFoxModule.currentQuery) {
			url = InstantFoxModule.urlFromQuery(InstantFoxModule.currentQuery);
			InstantFox.finishSearch()
		} else if (InstantFoxModule.autoSearch && !InstantFoxModule.autoSearch.disabled) {
			url = url.trimRight() // remove spaces at the end
			// let firefox to handle builtin shortcuts if any
			var shortcutURL = getShortcutOrURI(url, {}, {})
			//
			if (shortcutURL == url && (
				    url.indexOf(' ') != -1 // contains space or doesn't contain any url characters \:/.
				 || url.indexOf('\\') == -1
				 && url.indexOf(':') == -1
				 && url.indexOf('/') == -1
				 && url.indexOf('.') == -1
			)){
				url = InstantFoxModule.urlFromQuery(InstantFoxModule.autoSearch, url);
			}
		} else {
			// fallback to default behaviour
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


InstantFox.modifyContextMenu()

dump("instantfox initialization success")
