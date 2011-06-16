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