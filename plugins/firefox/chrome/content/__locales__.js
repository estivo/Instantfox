/** devel__( */
var commonPlugins = {
	Google: {
		key: "g",
		url: "http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b",
		json: "http://suggestqueries.google.com/complete/search?json&q=%q&hl=%ls",
		name: "Google"
	},
	GoogleImages: {
		key: "i",
		url: "http://www.google.%ld/images?q=%q&hl=%ls",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&hl=%ls&q=%q",
		name: "Google Images"
	},
	GoogleMaps: {
		key: "m",
		url: "http://maps.google.com/maps?q=%q",
		json: "http://maps.google.%ld/maps/suggest?q=%q&cp=999&hl=%ll&gl=%ll&v=2&json=b",
		name: "Google Maps"
	},
	Wikipedia: {
		key: "w",
		url: "http://%ls.wikipedia.org/wiki/%q",
		json: "http://%ls.wikipedia.org/w/api.php?action=opensearch&search=%q",
		name: "Wikipedia"
	},
	Youtube: {
		key: "y",
		url: "http://www.youtube.com/results?search_query=%q",
		json: "http://suggestqueries.google.com/complete/search?json&hl=%ls&ds=yt&q=%q",
		name: "Youtube"
	},
	Amazon: {
		key: "a",
		url: "http://www.amazon.%ld/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742",
		json: "http://completion.amazon.%ld/search/complete?method=completion&q=%q&search-alias=aps&mkt=4",
		name: "Amazon"
	},
	eBay: {
		key: "e",
		url: "http://shop.ebay.%ld/?_nkw=%q",
		json: "http://anywhere.ebay.com/services/suggest/?s=0&q=%q",
		name: "eBay"
	},
	Twitter: {
		key: "t",
		url: "http://twitter.com/#!/search/%q",
		name: "Twitter"
	},
	Weather: {
		key: "wt",
		url: "http://weather.instantfox.net/%q",
		json: "http://maps.google.com/maps/suggest?q=%q&cp=999&hl=%ls&gl=%ls&v=2&json=b",
		hideFromContextMenu: true,
		name: "Weather"
	},
	LEO: {
		key: "d",
		url: "http://dict.leo.org/?search=%q",
		name: "LEO Eng-Deu Dictionary"
	},
	IMDb: {
		key: "im",
		url: "http://www.imdb.com/find?s=all&q=%q",
		json: "http://sg.media-imdb.com/suggests/%fq/%q.json",
		hideFromContextMenu: true,
		name: "Int. Movie Db"
	},
	GoogleLuck: {
		key: "gg",
		url: "http://www.google.%ld/search?hl=%ls&q=%q&btnI=1",
		json: "http://suggestqueries.google.com/complete/search?json&q=%q&hl=%ls",
		hideFromContextMenu: true,
		name: "Google Luck"
	},
	Calculator: {
		key: "c",
		url: "resource://instantfox/calculator.html#%q",
		hideFromContextMenu: true,
		name: "Calculator"
	},
	GoogleTranslate: {
		key: "gt",
		url: "http://translate.google.com/#auto|%ls|%q",
		name: "Translate"
	},
}

var commonAutoSearch = {
	json: 'http://clients1.google.de/complete/search?client=chrome&hl=%ls&q=%q',
	url: commonPlugins.Google.url,
	instant: "off",
	suggest: "history"
}

/****************************** data *************************
 * locale(name, map:['%ls', '%ll', '%ld'], plugins)
 *****/
locale("de", ["de","de-DE","de"], {
	Google: true,
	GoogleImages: true,
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: {
		name: "Wetter"
	},
	LEO: true,
	IMDb: true,
	GoogleLuck: {
		name: "Google Glück"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("de-AT", ["de","de-AT","at"], {
	Google: true,
	GoogleImages: true,
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: {
		name: "Wetter"
	},
	LEO: true,
	IMDb: true,
	GoogleLuck: {
		name: "Google Glück"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("de-CH", ["de","de-CH","ch"], {
	Google: true,
	GoogleImages: true,
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: {
		name: "Wetter"
	},
	LEO: true,
	IMDb: true,
	GoogleLuck: {
		name: "Google Glück"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("en-AU", ["en","en-AU","com.au"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("en-CA", ["en","en-CA","ca"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.ca/gp/search?ie=UTF8&keywords=%q&tag=609-20&index=aps&linkCode=ur2&camp=15121&creative=330641",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("en-GB", ["en","en-GB","co.uk"], {
	Google: {
		url: "http://www.google.%ld/#q=%q&fp=1&cad=b"
	},
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.co.uk/gp/search?ie=UTF8&keywords=%q&tag=509-21&index=aps&linkCode=ur2&camp=1634&creative=6738",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("en-US", ["en","en-US","com"], {
	Google: {
		url: "http://www.google.%ld/#q=%q&fp=1&cad=b"
	},
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("es-AR", ["es","es-AR","com.ar"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q",
		name: "Google Imágenes"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		key: "gs",
		url: "http://www.google.com/search?q=%q&btnI=1",
		name: "Google Suerte"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: true
})

locale("es-ES", ["es","es-ES","es"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q",
		name: "Google Imágenes"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls",
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		key: "gs",
		url: "http://www.google.com/search?q=%q&btnI=1",
		name: "Google Suerte"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: true
})

locale("es-MX", ["es","es-MX","com.mx"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q",
		name: "Google Imágenes"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		key: "gs",
		url: "http://www.google.com/search?q=%q&btnI=1",
		name: "Google Suerte"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: true
})

locale("es-CL", ["es","es-CL","cl"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q",
		name: "Google Imágenes"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls",
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		key: "gs",
		url: "http://www.google.com/search?q=%q&btnI=1",
		name: "Google Suerte"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: true
})

locale("fr", ["fr","fr-FR","fr"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.fr/gp/search?ie=UTF8&keywords=%q&tag=604-21&index=aps&linkCode=ur2&camp=1642&creative=6746",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tempo"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1",
		name: "Google Chance"
	},
	Calculator: {
		name: "Calculateur"
	},
	GoogleTranslate: true
})

locale("it", ["it","it-IT","it"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.it/gp/search?ie=UTF8&keywords=%q&tag=805-21&index=blended&linkCode=ur2&camp=3370&creative=23322",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("nl", ["nl","nl","nl"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.co.uk/gp/search?ie=UTF8&keywords=%q&tag=509-21&index=aps&linkCode=ur2&camp=1634&creative=6738",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: {
		key: "wrcalc",
		name: "Weer"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("pl", ["pl","pl","pl"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls",
		name: "Google Mapy"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: {
		key: "wy",
		name: "Wyziewy"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1",
		name: "Google Szczęścia"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("pt", ["pt","pt","pt"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	eBay: true,
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("pt-BR", ["pt","pt-BR","com.br"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("ru", ["ru","ru","ru"], {
	"Яндекс": {
		key: "y",
		url: "http://yandex.ru/yandsearch?text=%q&lr=99",
		json: "http://suggest.yandex.net/suggest-ff.cgi?part=%q",
		name: "Яндекс"
	},
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: {
		key: "yt",
		json: "http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q"
	},
	Amazon: {
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4"
	},
	Twitter: true,
	Weather: {
		name: "Погода"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		url: "http://www.google.com/search?q=%q&btnI=1"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale("tr", ["tr","tr","com.tr"], {
	Google: true,
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Twitter: true,
	Weather: true,
	IMDb: {
		name: "IMDb"
	},
	Calculator: true,
	GoogleTranslate: true
})
/*************************end of data  section *************************
 * locale(name, map:['%ls', '%ll', '%ld'], plugins)
 *****/
function extend(a, b){
	var o = {}
	for(var i in a)
		o[i] = a[i]
	for(var i in b)
		o[i] = b[i]
	return o
}
function locale(name, mapArray, plugins, autoSearch){
	var loc = {}
	var spec = InstantFoxModule.pluginLoader.getPluginFileSpec(name)
	dump(spec)
	var file = makeURI(spec).QueryInterface(Ci.nsIFileURL).file
	if(!file.exists())
		file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0644)
	//============================
	loc.plugins = {}
	for(var i in plugins){
		loc.plugins[i]=extend(commonPlugins[i], plugins[i])
	}

	//============================
	loc.localeMap = {}
	;['%ls', '%ll', '%ld'].forEach(function(x, i)loc.localeMap[x] = mapArray[i])
	
	loc.autoSearch = autoSearch || commonAutoSearch

	writeToFile(file, JSON.stringify(loc, null, 4))
}




/****utils**************** /


function makeReq(href) {
	var req = new XMLHttpRequest;
	req.open("GET", href, false);
	try {
		req.send(null);
	} catch (e) {
	}
	return req.responseText;
}
function removeCommon(p, pc){
	var o={}
	for(var i in p){
		o[i]={}
		var isDifferent = false
		var p1 = p[i], p2 = pc[i]||{}
		for(var j in p1){
			if(p1[j]!=p2[j]){
				isDifferent = true
				o[i][j] = p1[j]
			}
		}
		if(!isDifferent)
			o[i]=true
	}
	return o
}
function unjsonify(locale){
	var spec = InstantFoxModule.pluginLoader.getPluginFileSpec(locale)
	var t = makeReq(spec)
	var obj = JSON.parse(t)

	obj.plugins = removeCommon(obj.plugins, commonPlugins)

	var t1 = JSON.stringify(obj.plugins, null, 1)
		.replace(/^ +/mg, function(x) Array(x.length+1).join('\t') )
		.replace(/"(\w+)"\:/g, '$1:')

	var t2 = JSON.stringify(['%ls', '%ll', '%ld'].map(function(x)obj.localeMap[x]))

	return 'locale("'+locale+'", '+t2+', '+t1+')'
}

var a='',jn, jn1=jn
InstantFoxModule.pluginLoader.getAvaliableLocales(function(locales) {
	a = locales.map(unjsonify).join('\n\n')
	a = a.replace(/"(\w+)"\:/g, '$1:')
	gClipboardHelper.copyString(a)
	jn1.say(a)
})

/**************************/