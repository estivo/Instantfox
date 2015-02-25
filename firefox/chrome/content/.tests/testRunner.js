itest = {}
;(function(){

this.qs = function(x, doc){
	return (doc||document).querySelector(x)
}
this.qsa = function(x, doc){
	return Array.slice((doc||document).querySelectorAll(x))
}

this.key = function(aKey, aEvent, aWindow) {
    aEvent = aEvent || {};
	if (!aWindow)
		aWindow = window;

	var utils = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
 
    var keyCode = 0, charCode = 0;
    if (aKey.indexOf("VK_") == 0)
		keyCode = KeyboardEvent["DOM_" + aKey];
    else
		charCode = aKey.charCodeAt(0);

    var modifiers = 0//_parseModifiers(aEvent);

    if (aEvent.type) {
		utils.sendKeyEvent(aEvent.type, keyCode, charCode, modifiers);
    }else {
		var keyDownDefaultHappened = utils.sendKeyEvent("keydown", keyCode, charCode, modifiers);
		utils.sendKeyEvent("keypress", keyCode, charCode, modifiers, !keyDownDefaultHappened);
		utils.sendKeyEvent("keyup", keyCode, charCode, modifiers);
	}
}

this.type = function(str, aWindow){
	for each(var i in str)
		this.key(i, null, aWindow)
}

this.mouse = function(node, offsetX, offsetY, event, win){
    win = win || node.ownerDocument.defaultView;
    var utils = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);

    if (!utils)
        return;

    event = event || {};

    var button = event.button || 0;
    var clickCount = event.clickCount || 1;

    var rects = node.getClientRects();

    var rect = rects[0];

    var frameOffset = this.getFrameOffset(node);

    // Hit the middle of the button
    // (Clicks to hidden parts of the element doesn't open the context menu).
    offsetX = offsetX || 0.5 * Math.max(1, rect.width);
    offsetY = offsetY || 0.5 * Math.max(1, rect.height);
    var left = frameOffset.left + rect.left + offsetX;
    var top = frameOffset.top + rect.top + offsetY;

    if (event.type) {
        utils.sendMouseEvent(event.type, left, top, button, clickCount, 0);
    } else {
        utils.sendMouseEvent("mousedown", left, top, button, clickCount, 0);
        utils.sendMouseEvent("mouseup", left, top, button, clickCount, 0);
    }
}

this.getFrameOffset = function(win) {
    var top = 0;
    var left = 0;
    var frameElement;
    while(frameElement = win.frameElement) {
        top += win.frameElement.top;
        left += win.frameElement.left;
    }
    return {left: left, top: top};
}

this.test = function(name, test, delay) {
	
}
this.run = function(){
	this.initLog()
	this.i = 0
	this.runNext()
}
this.runNext = function(){
	this.test = testList[this.i++]
	if(!this.test){
		dump('all tests finished')
		return	
	}
	itest.qs("toolbarspring[flex='1']").textContent="running test: " + this.test.name
	this.prepare2test()
}
this.prepare2test = function(){
	var self = this
	var test = this.test
	var name = test.name
	var fList = test.run
	var f, i = 0, r
	
	if (typeof fList == "function"){
		f = fList
		fList = []
	}else{
		f = fList[i++]
	}
	
    window.focus()
	function run(){
		try{
			r = f.call(test)
		}catch(e){
			Cu.reportError(name+":(Failed to run")		
			Cu.reportError(e)
		}
		f = fList[i++]

		if (f)
			setTimeout(run, r || 0)
		else
			self.testResults()
	}
	run()
}
this.testResults = function(){
	var name = this.test.name
	var test = this.test
	var self = this
	var wholeDelay, delay = 0
	function waitAndTest(delay){
		wholeDelay += delay
		if (wholeDelay > 10000){
			Cu.reportError(name+":(timed out")
			return itest.runNext()
		}
		setTimeout(function(){
			try{
				var result = test.test()
				if (typeof result == "number"){
					return waitAndTest(result)
				}
				
				if (result)
					dump(name, ':)Pass')
				else
					Cu.reportError(name+":(Fail")
			}catch(e){
				Cu.reportError(name+":(Fail")		
				Cu.reportError(e)		
			}
			self.runNext()
		}, delay)
	}
	waitAndTest(test.delay||0)
}

this.initLog = function(x){
	this.$logData = []
	//dump.clear()
}
this.log = function(x){
	dump(x)
	this.$logData.push({data:x, type:''})
}
this.error = function(x){
	Cu.reportError(name+":(Failed to run")	
	this.$logData.push({data:x, type:'error'})
}
this.success = function(x){
	this.$logData.push({data:x, type:'pass'})
}
this.showLog = function(){
	
}
this.check = function(str, val){
	var temp = eval(str)
	if (temp == val)
		return true
	
	dump(str, temp, val)
	return fale
}
}).call(itest)

testList = [{
	name: 'FS#152 - instant does not work, if suggest is not checked',
	run: function(){
		var p = InstantFoxModule.Plugins.wikipedia
		p.key = 'w'
		p.disableSuggest = true
		p.disableInstant = false
		
		window.focus()
		itest.mouse(gURLBar)
		gURLBar.select()
		itest.type('w --')
                
        p.disableSuggest = false
	},
	test: function(){
        var pl = InstantFox.pageLoader
		if (pl.isActive){
			var href = pl.preview.contentDocument.location.href
			dump(href)
			if (href == "about:blank")
				return 200 // wait
			return pl.preview.contentDocument.location.href.indexOf('--')!=-1
		}
	},
	delay:200
}, {
    name: "escape",
    run: function(){
        itest.key('VK_ESCAPE')        
    },
    test: function(){
        var pl = InstantFox.pageLoader
        if(!pl.isActive)
            return true 
    }
}, {
	name: 'click on popup',
	run: function() {
        
	},
	test: function(){
		//itest.error()
		return true	
	},
}, {
	name: 'wikipedia suggest rules ',
	run: function() {
	},
	test: function(){
		var p = {url:'http://am.wikipedia.org/%q', id:'id'}

		InstantFoxModule.bp.fixupPlugin(p)

		return p.domain == "http://am.wikipedia.org" &&
			p.iconURI == "http://www.google.com/s2/favicons?domain=http://am.wikipedia.org" &&
			p.name == "am.wikipedia.org" &&
			p.json.indexOf("wikipedia")>0
	},
}, {
	name: 'reset plugins to default',
	run: function() {
		itest.mouse(itest.qs("#instantFox-options"))
	},
	test: function(){
		var doc = itest.qs("panel#instantfox-popup iframe").contentDocument
		itest.mouse(itest.qsa("tab", doc)[1])
		
		doc.defaultView.resetAllPlugins(true)
		return true
	},
	delay:500
}, {
	name: 'customize plugins',
	run: [function() {
		var pl = InstantFoxModule.Plugins
		
		var p = pl.google
		p.url = p.def_url = "def://json/%q"
		p.key = 'q'
		
		var p = pl.googleimages
		p.name = "modified"
		p.json = "new-json%q"
		p.url = "http://io/%q"
		
		var p = {
		   "url": "def_url",
		   "def_url": "def_url",
		   "json": "def_url",
		   "def_json": "def_url",
		   "domain": "dom",
		   "type": "default",
		   "name": "remove",
		   "def_name": "remove",
		   "id": "remove",
		   "key": "r",
		   "def_key": "r",
		}		
		pl[p.id] = p
		
		var p = {
		   "url": "def_url",
		   "json": "def_url",
		   "domain": "dom",
		   "type": "user",
		   "name": "doNotRemove",
		   "id": "doNotRemove",
		   "key": "doNotRemove",
		   "def_key": "r",
		   "def_url": "def_url",
		   "def_name": "remove",
		   "def_json": "def_url"
		}
		pl[p.id] = p
		
		for each(var p in pl)
			if (p.type == "browserSearch")
				p.disabled = true
		var doc = itest.qs("panel#instantfox-popup iframe").contentDocument
		doc.defaultView.rebuild()
		doc.defaultView.focus()
				
    	itest.mouse(itest.qsa("tab", doc)[0])
        itest.mouse(itest.qs("#add", doc))
		
	}, function() {
		var doc = itest.qs("panel#instantfox-popup iframe").contentDocument
		var t = itest.qs("#edit-box textbox[aID=name]", doc)
		t.focus()
		itest.type("name")
		
		var t = itest.qs("#edit-box textbox[aID=url]", doc)
		t.focus()
		itest.type("http://me/%q")
		dump(t.value)
		return 300
	}, function() {
		var doc = itest.qs("panel#instantfox-popup iframe").contentDocument
		itest.mouse(itest.qs("#edit-box slickbutton[label=OK]", doc))
		return 300
	}, function() {	
		dump(InstantFoxModule.Plugins.user0)
		var doc = itest.qs("panel#instantfox-popup iframe").contentDocument
		itest.mouse(itest.qs("slickbutton[label=OK]", doc))		
		return 100
	}],
	test: function(){
		var pl = InstantFoxModule.Plugins
		if (!pl.user0)
			return 100
		var success = true
			&& pl.remove
			&& pl.doNotRemove
			&& pl.google.url.indexOf("google") == -1
			&& pl.googleimages.url == "http://io/%q"
				&& pl.googleimages.name == "modified"
			&& pl.user0
			&& pl.doNotRemove
			
		for each(var p in pl)
			if (p.type == "browserSearch")
				success = success && p.disabled
		
		
		return success
	},
	delay:100
}, {
	name: 'check plugin integrity after update',
	run: function() {
		instantFoxDevel.testFirstRun()
	},
	test: function(){
		var pl = InstantFoxModule.Plugins
		var success = true
			&& !pl.remove
			&& pl.doNotRemove
			&& pl.google.url.indexOf("google") != -1
			&& pl.googleimages.url == "http://io/%q"
				&& pl.googleimages.name == "modified"
			&& pl.user0
			&& pl.doNotRemove
			
		for each(var p in pl)
			if (p.type == "browserSearch")
				success = success && p.disabled
		
		return success
	},
	delay:500
}, {
	name: 'default search enabled',
	run: function() {
		InstantFoxModule.autoSearch.disabled=false
		window.focus()
		itest.mouse(gURLBar)
		gURLBar.select()
		itest.type('abc')

	},
	test: function(){
		var ch = gURLBar.popup.richlistbox.children
		for (var i = 0; i < ch.length; i++) {
			if (ch[i].image == "chrome://instantfox/content/skin/button-logo.png")
				return true
		}
	},
	delay:500
}, {
	name: 'default search disabled',
	run: function() {
		InstantFoxModule.autoSearch.disabled=true
		window.focus()
		itest.mouse(gURLBar)
		gURLBar.select()
		itest.type('abc')
	},
	test: function(){
		var ch = gURLBar.popup.richlistbox.children
		for (var i = 0; i < ch.length; i++) {
			if (ch[i].image == "chrome://instantfox/content/skin/button-logo.png")
				return false
		}
	},
	delay:500
}]
	



itest.run()