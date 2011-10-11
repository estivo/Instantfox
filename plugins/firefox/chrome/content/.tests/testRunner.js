itest = {}
;(function(){

this.key = function(aKey, aEvent, aWindow) {
	aEvent = aEvent || {};
	if (!aWindow)
		aWindow = window;

	var utils = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
 
    var keyCode = 0, charCode = 0;
    if (aKey.indexOf("VK_") == 0)
		keyCode = getKeyEvent(aWindow)["DOM_" + aKey];
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
	setTimeout(function(){
		try{
			if(test.test())
				dump(name, ':)Pass')
			else
				Cu.reportError(name+":(Fail")
		}catch(e){
			Cu.reportError(name+":(Fail")		
			Cu.reportError(e)		
		}
		itest.runNext()
	}, test.delay||0)
}
}).call(itest)

testList = [{
	name: 'FS#152 - instant does not work, if suggest is not checked',
	run: function(){
		var p = InstantFoxModule.Plugins.google
		p.key = 'g'
		p.disableSuggest = true
		p.disableInstant = false	
		
		window.focus()
		itest.mouse(gURLBar)
		gURLBar.select()
		itest.key('g')
		itest.key(' ')
		itest.key('-')
		itest.key('-')
	},
	test: function(){
		return content.location.href.indexOf('--')!=0
	},
	delay:100
},{
	name: 'wikipedia suggest rules ',
	run: function(){
		var p = InstantFoxModule.Plugins.google
		p.key = 'g'
		p.disableSuggest = true
		p.disableInstant = false	
		
		window.focus()
		itest.mouse(gURLBar)
		gURLBar.select()
		itest.key('g')
		itest.key(' ')
		itest.key('-')
		itest.key('-')
	},
	test: function(){
		var p = {url:'http://am.wikipedia.org/%q', id:'id'}

		InstantFoxModule.bp.fixupPlugin(p)

		return p.domain == "http://am.wikipedia.org" &&
			p.iconURI == "http://g.etfv.co/http://am.wikipedia.org" &&
			p.name == "am.wikipedia.org" &&
			p.json.indexOf("wikipedia")>0
	},
	delay:100
}]
	



itest.run()
