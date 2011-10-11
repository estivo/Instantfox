//__devel__(
InstantFox.mouseUI ={
	add: function(){
		this.remove()

		var wrapBox = this.wrapBox = document.createElement('vbox')
		document.getElementById('browser-panel').appendChild(wrapBox)

		wrapBox.setAttribute('onclick', 'InstantFox.mouseUI.onClick(event)')

		wrapBox.className='instantFox-mouseUI'
		var st=wrapBox.style

		var cr=gURLBar.getBoundingClientRect()
		//st.left=cr.right+10+'px'
		st.right=1+'px'
		st.top=cr.bottom+10+'px'

		mainBox=document.createElement('vbox')
		wrapBox.appendChild(mainBox)

		//clear(mainBox)
		for each(var p in InstantFoxModule.Plugins)
			mainBox.appendChild(this.createBox(p))
	},
	remove: function(){
		if(this.wrapBox){
			this.wrapBox.parentNode.removeChild(this.wrapBox)
			this.wrapBox = null
		}
	},

	createBox: function(plugin) {
		var box=document.createElement('hbox')
		box.setAttribute('aID', plugin.id)
		box.setAttribute('align', 'center')
		box.className='instantFox-plugin'
		var image = document.createElement('image')
		image.setAttribute('src', plugin.iconURI)
		image.width=16
		image.height=16
		box.appendChild(image)
		var label=document.createElement('label')
		label.setAttribute('value', plugin.key)
		box.appendChild(label)
		return box
	},
	onClick: function(e){
		var el = e.target
		while(el){
			if(el.hasAttribute('aID'))
				break
			el=el.parentNode
		}
		if(!el)
			return

		var id = el.getAttribute('aID')

		if(el.hasAttribute('selected')){
			InstantFox.onEnter()
			return
		}
		var oldEl = el.parentNode.querySelector('[selected]')
		oldEl && oldEl.removeAttribute('selected')
		el.setAttribute('selected', true)

		gURLBar.value = InstantFoxModule.Plugins[id].key + ' ' + gURLBar.value.replace(/\w+ /, '')
					gURLBar.controller.handleText(true)
			InstantFox.onInput()
	}


}



function clear(node){
	 while (node.lastChild) {
        node.removeChild(node.lastChild);
    }
}


