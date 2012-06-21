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

			if (!selectedText) {
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



        el = document.getElementById("ss")
popupEvents = function() {
    var lastMouseEvent, timer, tooltip, isTooltipOpen, right;
    el.addEventListener("mousemove", function(e){
        lastMouseEvent = e
        if (!timer)
            timer = setTimeout(updateTooltip, 100)
        if (isTooltipOpen)
            tooltip.moveTo(right, e.screenY+10)
    }) 
        
    el.addEventListener("mouseout", function(e){
        lastMouseEvent = e
        if (!timer)
            timer = setTimeout(updateTooltip, 100)
    })
    var updateTooltip = function() {
        timer = null;
        if (!tooltip) {
            tooltip = document.createElement("tooltip");
            document.documentElement.appendChild(tooltip);
            tooltip.textContent = InstantFoxModule.getString("context.Drag");
        }
        var rect = el.getBoundingClientRect();
        var x = lastMouseEvent.clientX
        right = lastMouseEvent.screenX - x + rect.right + 5
        if (shouldShow(x, rect)) {
            if (!isTooltipOpen){
                isTooltipOpen = true  
                tooltip.showPopup(null, right, lastMouseEvent.screenY, "tooltip")
                // el.removeAttribute("tooltiptext")
            }
        } else {
            if (isTooltipOpen){
                tooltip.hidePopup()
                isTooltipOpen = false
                // el.setAttribute("tooltiptext", "click")
            }
        }       
    }
    
    function shouldShow(x, rect) {
        return (x < rect.right - 2 && x > rect.right - 30)
    }    
    function isOutside(x, y, rect) {
        if (rect.left > x || rect.right + 10 < x)
            return true
        if (rect.top > y || rect.bottom < y)
            return true
    }
    function getChild(y) {
        var ch = el.children
        for(var i = 0; i < ch.length; i++) {                    
            var rect = ch[i].getBoundingClientRect()
            var top = rect.top - (ch[i].dy || 0)
            var bottom = rect.bottom - (ch[i].dy || 0)
            if (top < y &&  bottom > y)
                return {index: i, el: ch[i]}
        }
    }
    function translate(el, dx, dy) {
        el.style.MozTransform="translate(" + dx + "px," + dy + "px)"
        el.dy = dy
    }
            
    el.addEventListener("mousedown", function(e) {
        if (!isTooltipOpen) {
            return
        } else {
            tooltip.hidePopup()
            isTooltipOpen = false;
            if (timer)
                clearTimeout(timer)
        }
        
        var startY = e.clientY
        var drag = {}
        var drag = getChild(startY)
        if (!drag)
            return
        var dragEl = drag.el
        var dragElRect = dragEl.getBoundingClientRect()
        var h = dragElRect.height
        var dragOffset = - startY + dragElRect.top + h/2

        var rect2 = el.getBoundingClientRect()
        dragEl.setAttribute("_moz-menuactive", true)
        dragEl.setCapture(true)
            
        var movedElements = []
        var current, onMove, onUp;
        el.addEventListener("mousemove", onMove = function(e) {
            var {clientX: x, clientY: y} = e;
            if (isOutside(x, y, rect2)) {
                var d = 0
                dragEl.style.opacity =  "0.1"
                translate(dragEl, 50, 0)
                for(var i = movedElements.length; i--;){
                    translate(movedElements[i], 0, 0)
                }
                current = null
            } else {
                var d = e.clientY -  startY
                
                dragEl.style.opacity =  ""
                translate(dragEl, 10, d)

                current = getChild(y + dragOffset) || current
                if (current) {
                    for(var i = movedElements.length; i--;){
                        translate(movedElements[i], 0, 0)
                    }
                    movedElements=[]
                    if (current.index > drag.index) {
                        var ch = el.children
                        for(var i = drag.index+1; i < current.index+1; i++) {
                            var elt = ch[i];
                            movedElements.push(elt)
                            translate(elt, 0, -h)
                        }
                    } else if (current.index < drag.index) {
                        var ch = el.children
                        for(var i = drag.index-1; i > current.index-1; i--) {
                            var elt = ch[i];
                            movedElements.push(elt)
                            translate(elt, 0, h)
                        }
                    }
                }
            }
                 
            e.preventDefault()
            e.stopPropagation()
        }, true)
            
        el.addEventListener("mouseup", onUp = function(e) {
            el.removeEventListener("mouseup", onUp, true)
            el.removeEventListener("mousemove", onMove, true)
            translate(dragEl, 0, 0)
            for(var i = movedElements.length; i--;) {
                translate(movedElements[i], 0, 0)
            }
            dragEl.style.cssText="" 
            
            if (current) {
                if (current.index > drag.index)
                    el.insertBefore(drag.el, current.el.nextSibling)
                else if (current.index < drag.index)
                    el.insertBefore(drag.el, current.el)
            } else {
                el.removeChild(drag.el)
            }
            e.preventDefault()
            e.stopPropagation()
        }, true)            
    })
}