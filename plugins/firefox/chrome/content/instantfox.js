var InFoxPrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

InFoxPrefs.QueryInterface(Ci.nsIPrefBranch2);

//var currentTab = getWebNavigation().sessionHistory;.getEntryAtIndex(currentTab.count-1, false).URI.spec

var HH = {
	initialize: function(event) {
		window.removeEventListener('load', arguments.callee, true);
		Cu.import('chrome://instantFox/content/instantFoxModule.js')

		gURLBar.setAttribute('autocompletesearch',	'instantFoxAutoComplete');
		gURLBar.removeAttribute('oninput');

		gURLBar.addEventListener('keydown', HH.onKeydown, false);
		gURLBar.addEventListener('input', HH.onInput, false);
		gURLBar.addEventListener('blur', HH.onblur, false);
		
		dump('instantFox initialized')
		HH.checkURLBarBinding()
		HH.updateUserStyle()
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

		function hbox(name, div){
			var hb=document.createElement('hbox')
			hb.align='center'
			hb.className="instantfox-"+name
			if(div){
				hb.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml','div'))
				
				gURLBar["instantFox" + name[0].toUpperCase() + name.substr(1) + "Node"] = hb.firstChild;
			}
			return hb
		}
		
		var b2=hbox('tip',true)
		b2.setAttribute('right',0)
		b2.setAttribute('align','center')
		s.insertBefore(b2, s.firstChild)

		var b1=hbox('box')
		b1.appendChild(hbox('key',true))
		b1.appendChild(hbox('spacer',true))
		b1.appendChild(hbox('shadow',true))
		s.insertBefore(b1, s.firstChild)
	
	},
	updateUserStyle: function() {
		var ss=document.styleSheets
		for(var i=ss.length; i--; ){
			var s=ss[i]
			if(s.href=="chrome://instantfox/content/skin/instantfox.css"){
				if(InFoxPrefs.prefHasUserValue('extensions.InstantFox.fontsize')){
					var pref =  parseInt(InFoxPrefs.getCharPref('extensions.InstantFox.fontsize'))
					if(isNaN(pref))
						pref = '';
					else if(pref < 2)
						pref+='em';
					else
						pref+='px';
					s.cssRules[3].style.fontSize = pref;
				}
				if(InFoxPrefs.prefHasUserValue('extensions.InstantFox.opacity')){
					var pref = parseInt(InFoxPrefs.getIntPref('extensions.InstantFox.opacity')) / 100
					if(isNaN(pref) || pref < 0.1)
						pref = 1
					s.cssRules[2].style.opacity = pref;
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
			simulateInput;

		if (InstantFoxModule.currentQuery) {
			if (key == 9 || (!ctrl && !shift && key == 39)) { // 9 == Tab
				if (HH.rightShadow != '') {
					gURLBar.value += HH.rightShadow;
					HH.rightShadow = '';
					simulateInput = true;
				}
			} else if (key == 39 && ctrl && !shift) { // 39 == RIGHT
				if (HH.rightShadow != '' && gURLBar.selectionEnd == gURLBar.value.length) {
					gURLBar.value += HH.rightShadow[0]
					simulateInput = true;
				}
			} else if (key == 13 && !meta && !ctrl) { // 13 == ENTER
				if(!alt)
					HH.onEnter(InstantFoxModule.currentQuery.query)
				else {
					HH.openLoadedPageInNewTab()
				}
				event.preventDefault();
			} else if (!alt && !meta && !ctrl && [38,40,34,33].indexOf(key)!=-1) {//UP,DOWN,PAGE_UP,PAGE_DOWN
				if(!InstantFoxModule.currentQuery.plugin.disableInstant) {
					HH.schedulePreload()
					InstantFoxModule.currentQuery.shadow = '';
				}
			}
		}

		if(key == 32 && ctrl) { // 32 == SPACE
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
		}

		if(simulateInput){
			gURLBar.controller.handleText(true)
			HH.onInput()
			event.preventDefault();
		}
	},
	onInput: function(event) {dump(event)
		var val = gURLBar.value;
		gBrowser.userTypedValue = val;

		var q = HH.getQuery(val, InstantFoxModule.currentQuery)
		if (q) {
			InstantFoxModule.currentQuery = q;
			HH.updateShadowLink(q);
		} else if (InstantFoxModule.currentQuery) {
			InstantFoxModule.currentQuery = null;
			HH.updateShadowLink(q);
		}
	},
	onblur: function(e) {
		// Return power to Site if urlbar really lost focus
        if (HH._isOwnQuery && !gURLBar.mIgnoreFocus && e.originalTarget == gURLBar.mInputField) {
			gURLBar.value = content.document.location;
			gBrowser.userTypedValue = null;
			HH.finishSearch();
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
		HH.findBestShadow(q)
		HH.updateShadowLink(q)
		if(!q.plugin.disableInstant)
			q.shadow ? HH.doPreload(q):HH.schedulePreload(100)
	},
	findBestShadow: function(q){
		q.shadow = ''
		for each(var i in q.results) {
			if (i.title == q.query) {
				q.shadow = i.title
				break
			}
			if (!q.shadow && i.title.toLowerCase().indexOf(q.query)==0)
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
		gURLBar.instantFoxTipNode.textContent = 'hello';
	},
	
	// ****** instant preview ****************************************
	doPreload: function(q, qVal){
		if(this.timeout)
			this._timeout = clearTimeout(this._timeout)

		if(!q.query && !qVal)
			return ''

		var url2go = q.plugin.url;
		if(qVal){
			var query = qVal || q.query || q.domain || ''
		}else
			var query = q.shadow || q.query || q.domain || ''

		url2go = url2go.replace('%q', query);

		if(url2go == q.preloadURL)
			return url2go

		q.preloadURL = url2go

		// see load_flags at http://mxr.mozilla.org/mozilla-central/source/docshell/base/nsIWebNavigation.idl#149
		if(HH._isOwnQuery){
			getWebNavigation().loadURI(url2go, nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE, null, null, null);
			//content.location.replace(url2go);
		}else{
			getWebNavigation().loadURI(url2go, nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE, null, null, null);
			//content.location.assign(url2go);
			HH._isOwnQuery = true;
		}
		return url2go
	},
	schedulePreload: function(delay){
		if (this._timeout)
			return

		this._timeout = setTimeout(function(self){
			self._timeout = null
			self.doPreload(InstantFoxModule.currentQuery)
		}, delay||200, this)
	},
	finishSearch: function() {
		this._isOwnQuery = false
		this.updateShadowLink(null) //
		InstantFoxModule.currentQuery = null;
		if(this.timeout)
			this._timeout = clearTimeout(this._timeout)
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
		var tab=gBrowser.mCurrentTab;
		var newTab = Cc['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore).duplicateTab(window, tab, -1);
		gBrowser.moveTabTo(tab,tab._tPos+1)
		this.onEnter(InstantFoxModule.currentQuery.query)
	},
}

//************************************************************************
// experimental options popup
HH.openOptionsPopup = function(p){
	while(p.hasChildNodes())
		p.removeChild(p.firstChild)
	var i = document.createElement('iframe')
	i.setAttribute('src','chrome://instantfox/content/options.xul')
	p.appendChild(i)
	i.contentWindow.close=HH.closeOptionsPopup
	var h = screen.availHeight*3/4
	i.width=2/5*h
	i.height=h
}

HH.closeOptionsPopup = function(p){
	p =p || document.getElementById('instantFox-options').firstChild
	p.hidePopup()
}

//************************************************************************
window.addEventListener('load', HH.initialize, true);

// modify URLBarSetURI defined in browser.js
function URLBarSetURI(aURI) {
	// auri is null if URLBarSetURI is called from urlbar.handleRevert
	if (HH._isOwnQuery) {
		if (InstantFoxModule.currentQuery.tabId == HH._ctabID){
			return;
		} else { //hide shadow if user switched tabs
			HH.finishSearch();
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
		menu.setAttribute('name', engine.name)
		menu.setAttribute('label', engine.name)
		menu.setAttribute('image', engine.iconURI)
		menu.setAttribute('class', "menuitem-iconic")
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
    var engine = Services.search.getEngineByName(name);
    var submission = engine.getSubmission(selectedText);
    if (!submission) {
        return;
    }
    openLinkIn(submission.uri.spec, e.button!=0?"current":"tab", {postData: submission.postData, relatedToCurrent: true});
}

