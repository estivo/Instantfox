//var currentTab = getWebNavigation().sessionHistory;.getEntryAtIndex(currentTab.count-1, false).URI.spec
var InstantFox = {
	// belong to notifyTab
	install_url: "http://www.instantfox.net/welcome.php",
	update_url:  "http://www.instantfox.net/update.php",
	checkversion: true,
	
	notifyOpenTab: function(url){
		if(url){
			var targetTab = gBrowser.addTab(url);
			gBrowser.selectedTab = targetTab;
		}
	},
	notifyTab: function(){
		if (!InstantFox.checkversion)
			return

		AddonManager.getAddonByID('searchy@searchy', function(addon){
			InstantFox.checkversion = false;
			var prefName = "extensions.instantfox.version";
			var oldVersion = Services.prefs.getCharPref(prefName);
			var newVersion = addon.version;
			if (oldVersion == newVersion)
				return

			Services.prefs.setCharPref(prefName, newVersion);
			if(oldVersion == "0.0.0"){
				var url = InstantFox.install_url + '?to=' + newVersion;
				// add options button only on first install
				InstantFox.updateOptionsButton();
				setTimeout(InstantFox.showInstallNotification, 600);
			}else{				
				var url = InstantFox.update_url + '?to=' + newVersion + '&from=' +oldVersion
			}
			
			setTimeout(InstantFox.notifyOpenTab, 500, url);
		})
	},
	showInstallNotification: function(){
		let n = {
			id: 'instant-fox-installed',
			anchor: "instantFox-options",
			label: "NEW!\nYour Instantfox configuration menu & shortcuts!\nEdit your language settings and add your own search-plugins!",
			hide: 'document.getBindingParent(this).parentNode.hidePopup();',
			mainActionLabel: 'ok',
			action: 'document.getElementById("instantFox-options").open=true;',
			a: {
				label: 'remove this button',
				action: 'InstantFox.updateOptionsButton(true)'
			}
		}

		let doc = document;
		let p = doc.createElement('panel')
		p.setAttribute('type', 'arrow')
		doc.getElementById("mainPopupSet").appendChild(p)


		let popupnotification = doc.createElement("popupnotification");
		popupnotification.setAttribute("label", n.label);
		popupnotification.setAttribute("popupid", n.id);
		popupnotification.setAttribute("closebuttoncommand", n.hide);

		popupnotification.setAttribute("buttonlabel", n.mainActionLabel);
		popupnotification.setAttribute("buttoncommand", n.hide + n.action);
		popupnotification.setAttribute("menucommand", "event.target.action?" + n.a.action + ':' + n.hide);
		popupnotification.setAttribute("closeitemcommand", n.hide);

		//secondary actions
		let item = doc.createElement("menuitem");
        item.setAttribute("label", n.a.label);
        item.action = true;
        popupnotification.appendChild(item);
		let closeItemSeparator = doc.createElement("menuseparator");
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
		gURLBar.addEventListener('blur', InstantFox.onblur, false);

		dump('instantFox initialized')
		InstantFox.notifyTab()
		InstantFox.checkURLBarBinding()
		InstantFox.updateUserStyle()
		// apply user modified styles
	},

	destroy: function(event) {
		//dump('---***---',arguments.callee.caller)
		gURLBar.removeEventListener('keydown', _keydown, false);
		gURLBar.removeEventListener('input', _input, false);
	},

	checkURLBarBinding: function() {
		if(gURLBar.instantFoxKeyNode)
			return
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
		var ss=document.styleSheets
		for(var i=ss.length; i--; ){
			var s=ss[i]
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
			simulateInput, i;

		if (InstantFoxModule.currentQuery) {
			if (key == 9 || (!ctrl && !shift && key == 39)) { // 9 == Tab
				if (InstantFox.rightShadow != '') {
					gURLBar.value += InstantFox.rightShadow;
					InstantFox.rightShadow = '';
					simulateInput = true;
				}
			} else if (key == 39 && ctrl && !shift) { // 39 == RIGHT
				if (InstantFox.rightShadow != '' && gURLBar.selectionEnd == gURLBar.value.length) {
					gURLBar.value += InstantFox.rightShadow[0]
					simulateInput = true;
				}
			} else if (key == 13 && !meta && !ctrl) { // 13 == ENTER
				if(!alt)
					InstantFox.onEnter(InstantFoxModule.currentQuery.query)
				else {
					InstantFox.openLoadedPageInNewTab()
				}
				event.preventDefault();
			} else if (!alt && !meta && !ctrl && [38,40,34,33].indexOf(key)!=-1) {//UP,DOWN,PAGE_UP,PAGE_DOWN
				if(!InstantFoxModule.currentQuery.plugin.disableInstant) {
					InstantFox.schedulePreload()
					InstantFoxModule.currentQuery.shadow = '';
				}
			} else if (key == 27) { // 27 == ESCAPE
				gBrowser.webNavigation.gotoIndex(0)
				InstantFox.finishSearch(InstantFoxModule.currentQuery.index)
				event.preventDefault();
				gURLBar.blur()
			}
		}

		if (key == 32 && ctrl) { // 32 == SPACE
			var origVal = gURLBar.value;
			var keyIndex = origVal.indexOf(' ')
			var key=origVal.substring(0,keyIndex)

			if(key in InstantFoxModule.Shortcuts || key[0] == '`'){
			//gURLBar.value = '`'+origVal
				if (gURLBar.selectionStart<=keyIndex) {
					gURLBar.selectionStart = keyIndex+1
					gURLBar.selectionEnd = origVal.length
				} else {
					gURLBar.selectionStart=0
					gURLBar.selectionEnd=keyIndex
				}
				simulateInput=true
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
			content.scrollBy(0, -amount)
		}

		if(simulateInput){
			gURLBar.controller.handleText(true)
			InstantFox.onInput()
			event.preventDefault();
		}
	},
	onInput: function(event) {
		var val = gURLBar.value;
		gBrowser.userTypedValue = val;

		var q = InstantFox.getQuery(val, InstantFoxModule.currentQuery)
		if (q) {
			InstantFoxModule.currentQuery = q;
			InstantFox.findBestShadow(q)
			InstantFox.updateShadowLink(q);
		} else if (InstantFoxModule.currentQuery) {
			InstantFoxModule.currentQuery = null;
			InstantFox.updateShadowLink(q);
		}
	},
	onblur: function(e) {
		// Return power to Site if urlbar really lost focus
        if (InstantFox._isOwnQuery && !gURLBar.mIgnoreFocus && e.originalTarget == gURLBar.mInputField) {
			gURLBar.value = content.document.location.href;
			gBrowser.userTypedValue = null;
			InstantFox.finishSearch();
        }
    },

	// ****** ----- -------- ****************************************
	_isOwnQuery: false,

	get _ctabID() gBrowser.mCurrentTab.linkedPanel,
	get _url() InstantFoxModule.currentQuery,

	getQuery: function(val, oldQ){
		var plugin
		var i = val.indexOf(' ');
		if(val[0]=='`'){
			if (i == -1)
				i = val.length
			if(gURLBar.selectionStart<=i)
				plugin = {
					suggestPlugins: true,
					key: val.substring(1, i),
					tail: val.substr(i),
					disableInstant: true
				}
			else
				plugin = InstantFoxModule.getBestPluginMatch(val.substring(1, i))
		}else{
			if (i == -1)
				return false
			var id = InstantFoxModule.Shortcuts[val.substr(0, i)]
			if (!id)
				return
			plugin = InstantFoxModule.Plugins[id]
		}

		var j = val.substr(i).match(/^\s*/)[0].length
		if (!oldQ) {
			oldQ = {
				browserText: nsContextMenu.prototype.getSelectedText().substr(0, 50),
				tabId: gBrowser.mCurrentTab.linkedPanel,
				onSearchReady: this.onSearchReady,
				shadow: ''
			}
		}
		oldQ.plugin = plugin
		oldQ.query = val.substr(i+j)
		oldQ.splitSpace = val.substr(i,j)
		oldQ.value = val
		return oldQ
	},
	onSearchReady: function(){
		var q = this;//
		//XULBrowserWindow.InsertShadowLink(q.shadow||"", q.value||"");
		InstantFox.findBestShadow(q)
		InstantFox.updateShadowLink(q)
		if(!q.plugin.disableInstant)
			q.shadow ? InstantFox.doPreload(q):InstantFox.schedulePreload(100)

		// show logo if it fits into popup
		InstantFox.updateLogo(true, q)
	},
	updateLogo: function(show, q) {
		show = show && q.results.length >= 4
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
		var query = q.query.toLowerCase()
		for each(var i in q.results) {
			var title = i.title.toLowerCase()
			if (title == query) {
				q.shadow = i.title
				break
			}
			if (!q.shadow && title.indexOf(query)==0)
				q.shadow = i.title
		}
	},
	updateShadowLink: function(q){
		//var q = InstantFoxModule.currentQuery;
		if(!q) {
			if(!gURLBar.currentShadow)
				return
			gURLBar.currentShadow = null;
			gURLBar.instantFoxKeyNode.textContent =
			gURLBar.instantFoxSpacerNode.textContent =
			gURLBar.instantFoxShadowNode.textContent = '';
			gURLBar.instantFoxTipNode.parentNode.hidden=true;
			this.rightShadow = ''
			return
		}
		var i = q.value.indexOf(' ')
		var key = q.value.slice(0, i)+q.splitSpace.replace(' ', '\u00a0', 'g');
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
	},

	// ****** instant preview ****************************************
	minLoadTime: 50,
	maxLoadTime: 200,
	doPreload: function(q, qVal) {
		if(this.timeout)
			this._timeout = clearTimeout(this._timeout)

		if(!q.query && !qVal)
			return ''


		var url2go = q.plugin.url;
		if(qVal){
			var query = qVal || q.query || q.domain || ''
		}else
			var query = q.shadow || q.query || q.domain || ''

		// encode query
		if (q.plugin.id == 'imdb')
		    query = escape(query.replace(/ /g, '+'));
		else
			query = encodeURIComponent(query);

		url2go = url2go.replace('%q', query);

		if(q.preloadURL &&
			url2go.toLowerCase() == q.preloadURL.toLowerCase())
			return url2go

		q.preloadURL = url2go

		var now = Date.now()

		var char_change = nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE
		var webNav = getWebNavigation()
		if(this._isOwnQuery){
			// gBrowser.docShell.isLoadingDocument
			if(now - this.loadTime < this.minLoadTime){
				this.schedulePreload(this.minLoadTime)
				return
			}
			//content.location.replace(url2go);
		}else{
			q.index = webNav.sessionHistory.index
			gBrowser.docShell.useGlobalHistory = false
			//content.location.assign(url2go);
			this._isOwnQuery = true;
		}

		webNav.loadURI(url2go, char_change, null, null, null);
		this.loadTime = q.loadTime = now
		return url2go
	},
	schedulePreload: function(delay) {
		if (this._timeout)
			return

		this._timeout = setTimeout(function(self){
			self._timeout = null
			self.doPreload(InstantFoxModule.currentQuery)
		}, delay||200, this)
	},
	onPageLoad: function(spec){
		dump(spec)
	},
	finishSearch: function() {
		this._isOwnQuery = false
		this.updateShadowLink(null)

		var q = InstantFoxModule.currentQuery, br
		if (q.tabId == InstantFox._ctabID)
			br = gBrowser
		else {
			br = document.getElementById(InstantFoxModule.currentQuery.tabId)
			br = br && br.getElementsByTagName("xul:browser")[0]
		}

		if (br)
			br.docShell.useGlobalHistory = true

		// todo: investigate why this crashes browser sometimes
		if (InstantFoxModule.currentQuery.index != null)
			this.collapseHistory(InstantFoxModule.currentQuery.index)
		InstantFoxModule.currentQuery = null;
		if(this.timeout)
			this._timeout = clearTimeout(this._timeout)
		//
		InstantFox.updateLogo(false)
	},
	collapseHistory: function(index) {
		var history = gBrowser.selectedBrowser.sessionHistory.QueryInterface(Ci.nsISHistoryInternal);
		var entries=[];

		for (var i = 0; i < index; i++)
			entries.push(history.getEntryAtIndex(i, false));
		// last entry
		entries.push(history.getEntryAtIndex(history.index, false));
		//
		history.PurgeHistory(history.count);

		for each (var entry in entries)
			history.addEntry(entry, true);
	},
	onEnter: function(value){
		InstantFoxModule.previousQuery = InstantFoxModule.currentQuery

		var tmp = this.doPreload(InstantFoxModule.currentQuery, value)
		gURLBar.value = tmp;
		gBrowser.userTypedValue = null;

		this.finishSearch()

		InstantFoxModule.currentQuery=null;

		gBrowser.selectedBrowser.focus();
	},
	openLoadedPageInNewTab: function(){
		var q = InstantFoxModule.currentQuery;
		var tab = gBrowser.mCurrentTab;
		var historyOffset = q.index == null? 0 : q.index - getWebNavigation().sessionHistory.index;
		var newTab = Cc['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore).duplicateTab(window, tab, historyOffset);
		newTab.linkedBrowser.userTypedValue = null;
		gBrowser.moveTabTo(tab,tab._tPos+1)
		this.onEnter(q.query)
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
	if (InstantFox.popupPinned == true || inPopup)
		return
	window.removeEventListener('mousedown', InstantFox.popupCloser, false)
	document.getElementById('instantFox-options').firstChild.hidePopup()
}
InstantFox.onPopupShowing = function(p) {
	if (p.parentNode.id != 'instantFox-options')
		return

	window.addEventListener('mousedown', InstantFox.popupCloser, false)

	if (p.hasChildNodes()){
		// rebuild in case user modified plugins by another options window instance
		p.firstChild.contentWindow.rebuild(true)
		return;
	}
	//while(p.hasChildNodes())
	//	p.removeChild(p.firstChild)
	var i = document.createElement('iframe')
	i.setAttribute('src', 'chrome://instantfox/content/options.xul')
	i.setAttribute('flex', '1')
	p.appendChild(i)
	p.height = screen.availHeight * 4/5
	p.width = 250 // approximate width
	p.wrongSize = true
}
InstantFox.onPopupHiding = function(p) {
	var i = document.getElementById('instantFox-options').firstChild.firstChild
	i.contentWindow.savePlugins()
	window.removeEventListener('mousedown', InstantFox.popupCloser, false)
}
InstantFox.updatePopupSize = function(popupDoc) {
	var p = document.getElementById('instantFox-options').firstChild

	if (p.wrongSize){
		delete p.wrongSize
		p.width = popupDoc.getElementsByTagName('tabbox')[0].clientWidth + 50;
	}

	// don't let clicks inside options window to close popup
	popupDoc.defaultView.addEventListener('mousedown', InstantFox.popupClickListener, false)
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
InstantFox.updateOptionsButton = function(remove) {
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
	} else {
		curSet = null
	}

	if (curSet){
		navBar.setAttribute("currentset", curSet.join(","));
		navBar.currentSet = curSet.join(",");
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
	if (InstantFox._isOwnQuery) {
		if (InstantFoxModule.currentQuery.tabId == InstantFox._ctabID){
			InstantFox.onPageLoad(aURI.spec)
			return;
		} else { //hide shadow if user switched tabs
			InstantFox.finishSearch();
		}
	}
    var value = gBrowser.userTypedValue;
    var valid = false;
    if (value == null) {
        let uri = aURI || getWebNavigation().currentURI;
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

/*********************************************************
 * contextMenu
 *******/
nsContextMenu.prototype.getSelectedText = function() {
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
nsContextMenu.prototype.isTextSelection = function() {
	var menu = document.getElementById("context-searchselect")

    var selectedText = this.getSelectedText()

	if (!selectedText){
		menu.hidden = true
		return false;
	}

    if (selectedText.length > 15)
      selectedText = selectedText.substr(0,15) + this.ellipsis;

    // Use the current engine if the search bar is visible, the default
    // engine otherwise.
    var engine = Services.search[isElementVisible(BrowserSearch.searchBar)?
												"currentEngine": "defaultEngine"];

    // format "Search <engine> for <selection>" string to show in menu
    var menuLabel = gNavigatorBundle.getFormattedString("contextMenuSearchText",
                                                        [engine.name, selectedText]);
	if(menu){
		menu.label = menuLabel;
		menu.image = engine.iconURI.spec
		menu.item.setAttribute('name', engine.name)
		menu.accessKey = gNavigatorBundle.getString("contextMenuSearchText.accesskey");
		menu.hidden = false
	}

    return true;
}
nsContextMenu.prototype.fillSearchSubmenu=function(popup){
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
		//todo: main search must be instantfox search too
		menu.setAttribute('type', "instantFox")
		popup.appendChild(menu)
	}
}
nsContextMenu.prototype.doSearch=function(e){
	var name = e.originalTarget.getAttribute('name')
	if(!name)
		return
	var selectedText = this.getSelectedText()
	if(name == 'open as link')
		openLinkIn(selectedText, e.button!=0?"current":"tab", {relatedToCurrent: true});

	var type = e.originalTarget.getAttribute('type')
	if (type == "instantFox") {
		href  = InstantFoxModule.Plugins[name].url.replace('%q', selectedText)
	} else {
		var engine = Services.search.getEngineByName(name);
		var submission = engine.getSubmission(selectedText);
		if (!submission) {
			return;
		}
		var href = submission.uri.spec
		var postData = submission.postData
	}
    openLinkIn(href, e.button!=0?"current":"tab", {postData: postData, relatedToCurrent: true});
}

