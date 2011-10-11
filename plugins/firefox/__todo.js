/*s=document.createElement('vbox')

gURLBar.parentNode.parentNode.appendChild(s)*/

s.className='searchbar-textbox'
s.style.backgroundColor= "-moz-field";
s.appendChild

r=document.createElement('image')

s.appendChild(r)

//r.src='moz-anno:favicon:http://www.google.am/favicon.ico'

s.align='center'
s.pack='center'
r.style.padding='0 10px'








http://translate.google.com/translate_t?q=g&bav=on.2,or.r_gc.r_pw.&um=1&ie=UTF-8&sa=N&hl=en&tab=wT

http://translate.google.com/translate_t?
	q=g&
	bav=on.2,or.r_gc.r_pw.&
	um=1&ie=UTF-8&
	sa=N&
	hl=en&
	tab=wT
		#la|en|vita di oculus ra
		#auto|en|%q

http://translate.google.com/translate?
	sl=auto&
	tl=en&
	u=http://piro.sakura.ne.jp/latest/blosxom/life/2011-07-24_gym.htm
	
	


if(b&&b.parentNode)
	b.parentNode.removeChild(b)
var b=document.createElement('vbox')

var bi=document.createElement('vbox')
bi.className='ou'
b.appendChild(bi)

for each(p in InstantFoxModule.Plugins){
	i=document.createElement('image')
	i.setAttribute('src',p.iconURI)
b1=document.createElement('hbox')
	b1.appendChild(i)
b2=document.createElement('vbox')
	b1.appendChild(b2)
b2.setAttribute('flex',1)
b1.className='op'
	bi.appendChild(b1)
}

gURLBar.parentNode.appendChild(b)

b.style.position='fixed'
b.style.top=gURLBar.getBoundingClientRect().bottom+'px'
b.style.right='10px'
b.style.zIndex='1000'

//b.style.position='relative'

shadia.inspect(b)






function makeReqAsync(href, callback) {
    req = new XMLHttpRequest;
    req.open("GET", href, true);
    req.overrideMimeType("text/plain");
    req.onload= function(){callback(req.responseText);};
    req.send(null);
}
function processRequest(html){
	var ei = html.lastIndexOf('</body>')
	var si = html.indexOf('<body')
	
	var match = html.slice(0, si).match(/<title>(.*?)<\/title>/)
	var title = match ? match[1]:''
	
	var bodyHTML = html.slice(si, ei+7)
	var bi = bodyHTML.indexOf('>')
	var attrText = bodyHTML.substring(5, bi)

	
	var el = content.document.body
	el.innerHTML = bodyHTML
	// update attributes
	var attrs = el.attributes
	for(var i = attrs.length; i--;)
		el.removeAttribute(attrs[i].nodeName)
	
	var reg = /(\w+)(?:\s*=\s*(".*?"|'.*?'|[^'">\s]+))?/g;
	var match, attrs = [];
	while (match = reg.exec(attrText)) {	
		var t2 = match[2] || ''
		if(t2 && (t2[0]=='"' || t2[0]=="'"))
			t2 = t2.slice(1, -1)
		attrs.push([match[1], t2])
	}
	attrs.forEach(function(x)el.setAttribute(x[0],x[1]))
	// update url	
	content.document.title = title
	content.history.replaceState(null, title, url)
}


content.document.body.style.opacity='0.5'
url = 'http://www.google.com/search?q=hello'
makeReqAsync(url, processRequest)

	b.docShell.isOffScreenBrowser=true
	b.docShell.isActive=false



	

content.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils).
sendNativeKeyEvent(
18,
0,
0,
'\x300000000???©©??§§§¦¦¦???¤¤¤??????????',
''
)

content.document.getElementById("lst-ib").value='npp'
a=31
a.toString(16)
