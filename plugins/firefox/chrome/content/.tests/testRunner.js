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
	this.$logData = []
	this.i = 0
	this.runNext()
}
this.runNext = function(){
	var test = testList[this.i++]
	if(!test){
		dump('all tests finished')
		return	
	}
	var name = test.name
	try{
		test.run()
	}catch(e){
		Cu.reportError(name+":(Failed to run")		
		Cu.reportError(e)
	}
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
			itest.runNext()
		}, delay)
	}
	waitAndTest(test.delay||0)
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
		itest.key('w')
		itest.key(' ')
		itest.key('-')
		itest.key('-')
                
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
		itest.error()
	},
}, {
	name: 'wikipedia suggest rules ',
	run: function() {
	},
	test: function(){
		var p = {url:'http://am.wikipedia.org/%q', id:'id'}

		InstantFoxModule.bp.fixupPlugin(p)

		return p.domain == "http://am.wikipedia.org" &&
			p.iconURI == "http://g.etfv.co/http://am.wikipedia.org" &&
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
	name: 'check plugin integrity after update',
	run: function() {
	},
	test: function(){		
	},
	delay:100
}]
	



itest.run()