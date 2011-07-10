/** devel__( */
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



function addPrerenderBrowser() {
	var s=document.getElementById("sidebar")
	var b = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "browser");
	b.setAttribute("type", "content");
	s.parentNode.appendChild(b)
	b.id='prerender-browser'
	b.flex=1

	b.docShell.useGlobalHistory=false
	b.docShell.isOffScreenBrowser=true
	b.docShell.isActive=false
	return b
}

//b=addPrerenderBrowser()

b.webNavigation.loadURI('about:config',null,null,null,null)
	

//b._webNavigation
//b._fastFind=gBrowser.fastFind

b.stop()

b.docShell.isActive=false


let flags = Ci.nsIWebNavigation.LOAD_FLAGS_NONE;

            flags |= Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP;


            flags |= Ci.nsIWebNavigation.LOAD_FLAGS_FROM_EXTERNAL;

        try {
            b.loadURIWithFlags('http://google.com', flags, null, null, null);
        } catch (ex) {
            Cu.reportError(ex);
        }
/**/


b2=gBrowser.mCurrentBrowser
b1=b

var fieldsToSwap = ["_docShell", "_webBrowserFind", "_contentWindow", "_webNavigation"];
var b1Vals= {};
var b2Vals= {};
for each (var field in fieldsToSwap) {
	b1Vals[field] = b1[field];
	b2Vals[field] = b2[field];
}
b1.QueryInterface(Ci.nsIFrameLoaderOwner).swapFrameLoaders(b2);
for each (var field in fieldsToSwap) {
	b1[field] = b2Vals[field];
	b2[field] = b1Vals[field];
}

b1._fastFind==b2.fastFind


   /* var ourTabBrowser = this.getTabBrowser();
    if (ourTabBrowser != null != (aOtherBrowser.getTabBrowser() != null)) {
        throw "Unable to perform swap on <browsers> if one is in a <tabbrowser> and one is not";
    }
    if (!ourTabBrowser) {
        fieldsToSwap.push("_fastFind");
    }*/

	content.document.getElementById('lpu').href

b.loadURI('http://www.google.com/url?sa=f&rct=j&url=http://www.youtube.com/&q=youtube&usg=AFQjCNHrwkxoJgICbl8bUFiXz2Hn__NzUg')