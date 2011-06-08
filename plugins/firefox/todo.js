function makeReqAsync(href, callback) {
    req = new XMLHttpRequest;
    req.open("GET", href, true);
    req.overrideMimeType("text/plain");
    req.onload= function(){callback(req.responseText);};
    req.send(null);
}

content.document.body.style.opacity='0.5'
makeReqAsync('http://en.wikipedia.org/wiki/H',function(x){
	cb=x
	var ei=x.lastIndexOf('</body>')
	var si=x.indexOf('<body')

	content.document.body.innerHTML=cb.slice(si,ei+7)
	content.document.body.style.opacity='1'
})





content.history.replaceState

var stateObj = { foo: "bar" };
content.history.pushState
content.document.title='poi'
content.history.replaceState('', "page 2", "/op/777bar.html");