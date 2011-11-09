// firefox modules can't handle unicode charactters
// to keep lovely look of unicode character "\u2665" -> "♥" 
// this file is converted into defaultPluginList.js by __devel__.js ☺

// list of all firefox locales
// http://mxr.mozilla.org/mozilla-central/source/mobile/chrome/content/languages.properties
EXPORTED_SYMBOLS = ['InstantFoxPluginList'];
InstantFoxPluginList = this;

var avaliableLocales = {}, avaliableLocaleNames = [];
/****************************** data *************************/
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

/****************************** data *************************
 * locale(name, map:['%ls', '%ll', '%ld'], plugins)
 *****/
locale(["de","de-DE","de"], {
	Google: true,
	GoogleLuck: {
		name: "Google Bilder"
	},
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

locale(["de","de-AT","at"], {
	Google: true,
	GoogleLuck: {
		name: "Google Bilder"
	},
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

locale(["de","de-CH","ch"], {
	Google: true,
	GoogleLuck: {
		name: "Google Bilder"
	},
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
	IMDb: true,
	GoogleLuck: {
		name: "Google Glück"
	},
	Calculator: true,
	GoogleTranslate: true
})

// make en-US default for en-* branch
locale(["en","en-US","com"], {
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

locale(["en","en-AU","com.au"], {
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

locale(["en","en-CA","ca"], {
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

locale(["en","en-GB","co.uk"], {
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

locale(["es","es-ES","es"], {
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

locale(["es","es-AR","com.ar"], {
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

locale(["es","es-MX","com.mx"], {
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

locale(["es","es-CL","cl"], {
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

locale(["fr","fr-FR","fr"], {
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

locale(["it","it-IT","it"], {
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

locale(["nl","nl","nl"], {
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

locale(["pl","pl","pl"], {
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

locale(["pt","pt","pt"], {
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

locale(["pt","pt-BR","com.br"], {
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

locale(["ru","ru","ru"], {
	"Яндекс": {
		key: "y",
		url: "http://yandex.ru/yandsearch?text=%q",
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

locale(["tr","tr","com.tr"], {
	Google: true,
	GoogleImages: {
		name: "Google Görseller",
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&q=%q"
	},
	GoogleMaps: {
		url: "http://maps.google.com/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	Weather: {
		name: "Hava durumu"
	},
	IMDb: {
		name: "IMDb"
	},
	Calculator: true,
	GoogleTranslate: true
})

locale(["ja","ja","co.jp"], {
	Google: true,
	GoogleImages: {
		name: "Google 画像検索"
	},
	GoogleMaps: {
		name: "Google マップ - 地図検索",
		url: "http://maps.google.co.jp/maps?q=%q&hl=%ls"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.co.jp/s?ie=UTF8&x=17&ref_=nb_sb_noss&y=11&field-keywords=%q&url=search-alias%3Daps&_encoding=UTF8&tag=7098-22&linkCode=ur2&camp=247&creative=7399"
	},
	Twitter: true,
	Weather: {
		name: "湿潤剤"
	},
	Calculator: {
		name: "ポケット電卓"
	},	
	GoogleTranslate: {
		name: "Google 翻訳"
	}
})

locale(["zh","zh-CN","cn"], {
	Google: {
		url: "http://www.google.com.hk/#hl=%ls&q=%q&fp=1&cad=b",
		json: "http://www.google.com.hk/complete/search?json&q=%q&hl=%ls",
		name: "Google 主页"
	},
	GoogleImages: {
		url: "http://www.google.com.hk/images?q=%q&hl=%ls",
		json: "http://suggestqueries.google.com/complete/search?json&ds=i&hl=%ls&q=%q",
		name: "Google 图片"
	},
	GoogleMaps: {
		url: "http://ditu.google.cn/maps?q=%q",
		json: "http://ditu.google.%ld/maps/suggest?q=%q&cp=999&hl=%ll&gl=%ll&v=2&json=b",
		name: "Google 地图"
	},
	Baidu: {
		key: "b",
		url: "http://www.baidu.com/s?wd=%q&rsv_bp=0&rsv_spt=3&inputT=625",
		json: "http://suggestion.baidu.com/su?wd=%q&p=3&cb=window.bdsug.sug",
		name: "Baidu"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.cn/s?ie=UTF8&x=0&ref_=nb_sb_noss&y=0&field-keywords=%q&url=search-alias%3Daps&_encoding=UTF8&tag=80e0-23&linkCode=ur2&camp=536&creative=3132"
	},
	Twitter: true,
	Weather: {
		name: "天气"
	},
	Calculator: {
		name: "袖珍计算器"
	},	
	GoogleTranslate: {
		name: "Google 翻译"
	}
})

locale(["sv","sv-SE","se"], {
	Google: true,
	GoogleImages: {
		name: "Google Bilder"
	},
	GoogleMaps: {
		name: "Google Kartor"
	},	
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	Twitter: true,
	Weather: true,
	IMDb: true,
	GoogleLuck: true,
	Calculator: true,
	GoogleTranslate: true
})

/*************************end of data  section *************************
 * locale(namemap:['%ls', '%ll', '%ld'], plugins)
 * folder name must be '%ll'
 *****/
function extend(a, b){
	var o = {}
	for(var i in a)
		o[i] = a[i]
	for(var i in b)
		o[i] = b[i]
	return o
}
function locale(localeNames, plugins, autoSearch){
	var loc = {}
	var spec = localeNames[1]
	//============================
	loc.plugins = {}
	for(var i in plugins){
		loc.plugins[i]=extend(commonPlugins[i], plugins[i])
	}

	//============================
	loc.localeMap = {}
	;['%ls', '%ll', '%ld'].forEach(function(x, i)loc.localeMap[x] = localeNames[i])
	
	if (!autoSearch) {
		var goog = loc.plugins.Google || commonPlugins.Google
		autoSearch = {
			json: 'http://clients1.google.com/complete/search?client=chrome&hl=%ls&q=%q',
			url: goog.url,
			instant: "off",
			suggest: false,
			minQChars: 5
		}
	}
	
	loc.autoSearch = autoSearch

	avaliableLocales[spec] = loc
	avaliableLocaleNames.push(spec)
}



/*************************code from XPIProvider.jsm *************************/
var PREF_MATCH_OS_LOCALE = "intl.locale.matchOS";
var PREF_SELECTED_LOCALE = "general.useragent.locale";
/**
 * A helpful wrapper around the prefs service that allows for default values
 * when requested values aren't set.
 */
var Prefs = {
  getDefaultCharPref: function(aName, aDefaultValue) {
    try {
      return Services.prefs.getDefaultBranch("").getCharPref(aName);
    } catch(e){}
    return aDefaultValue;
  },

  getCharPref: function(aName, aDefaultValue) {
    try {
      return Services.prefs.getCharPref(aName);
    } catch(e){}
    return aDefaultValue;
  },

  getComplexValue: function(aName, aType, aDefaultValue) {
    try {
      return Services.prefs.getComplexValue(aName, aType).data;
    } catch(e){}
    return aDefaultValue;
  },

  getBoolPref: function(aName, aDefaultValue) {
    try {
      return Services.prefs.getBoolPref(aName);
    } catch(e){}
    return aDefaultValue;
  },

  getIntPref: function(aName, defaultValue) {
    try {
      return Services.prefs.getIntPref(aName);
    } catch(e){}
    return defaultValue;
  },

  clearUserPref: function(aName) {
    if (Services.prefs.prefHasUserValue(aName))
      Services.prefs.clearUserPref(aName);
  }
}
/**
 * Gets the currently selected locale for display.
 * @return  the selected locale or "en-US" if none is selected
 */
function getLocale() {
  if (Prefs.getBoolPref(PREF_MATCH_OS_LOCALE, false))
    return Services.locale.getLocaleComponentForUserAgent();
  let locale = Prefs.getComplexValue(PREF_SELECTED_LOCALE, Components.interfaces.nsIPrefLocalizedString);
  if (locale)
    return locale;
  return Prefs.getCharPref(PREF_SELECTED_LOCALE, "en-US");
}

/**
 * Selects the closest matching locale from a list of locales.
 */
function findClosestLocale(avaliableLocales, desiredLocale) {
  let appLocale = getLocale();

  // Holds the best matching localized resource
  var bestmatch = null;
  // The number of locale parts it matched with
  var bestmatchcount = 0;
  // The number of locale parts in the match
  var bestpartcount = 0;

  var matchLocales = [desiredLocale.toLowerCase(), appLocale.toLowerCase()];
  /* If the current locale is English then it will find a match if there is
     a valid match for en-US so no point searching that locale too. */
  if (matchLocales[1].substring(0, 3) != "en-")
    matchLocales.push("en-us");

  for each (var locale in matchLocales) {
    var lparts = locale.split("-");
    for each (let localeName in avaliableLocales) {		
        let found = localeName.toLowerCase();
        // Exact match is returned immediately
        if (locale == found)
          return localeName;

        var fparts = found.split("-");
        /* If we have found a possible match and this one isn't any longer
           then we dont need to check further. */
        if (bestmatch && fparts.length < bestmatchcount)
          continue;

        // Count the number of parts that match
        var maxmatchcount = Math.min(fparts.length, lparts.length);
        var matchcount = 0;
        while (matchcount < maxmatchcount &&
               fparts[matchcount] == lparts[matchcount])
          matchcount++;

        /* If we matched more than the last best match or matched the same and
           this locale is less specific than the last best match. */
        if (matchcount > bestmatchcount ||
           (matchcount == bestmatchcount && fparts.length < bestpartcount)) {
          bestmatch = localeName;
          bestmatchcount = matchcount;
          bestpartcount = fparts.length;
        }
    }
    // If we found a valid match for this locale return it
    if (bestmatch)
      return bestmatch;
  }
  return "en-US";
}
/*************************end of locale finding code *************************/

preprocessRawData = function (pluginData, pluginLoader){
	var localeRe=/%l(?:s|l|d)/g;

	function replacer(m) pluginData.localeMap[m]

	var newPlugins = {}

	for(var i in pluginData.plugins) {
		var p = pluginData.plugins[i];
		if(!p || !p.url)
			continue

		p.url = p.url.replace(localeRe, replacer)
		p.domain = pluginLoader.extendedDomainFromURL(p.url)

		p.name = p.name || i
		p.id = i.toLowerCase()
		p.iconURI = p.iconURI || pluginLoader.getFavicon(p.url);

		if(p.json)
			p.json = p.json.replace(localeRe, replacer)
		else
			p.json = ''

		p.type = 'default'

		// handle user modifiable props
		pluginLoader.defPropNames.forEach(function(propName){
			p['def_'+propName] = p[propName]
		})

		newPlugins[p.id] = p
	}
	pluginData.plugins = newPlugins
	//-------
	var p = pluginData.autoSearch
	if(p){
		p.json = p.json.replace(localeRe, replacer)
		p.url = p.url.replace(localeRe, replacer)
	}
	return pluginData
}

getString = function(InstantFoxModule){
	return JSON.stringify(getData(InstantFoxModule), null, 4)
}
getData = function(InstantFoxModule){
	InstantFoxModule.avaliableLocaleNames = avaliableLocaleNames
	var name = findClosestLocale(avaliableLocaleNames, InstantFoxModule.selectedLocale);
	var pluginData = avaliableLocales[name]
	if (!pluginData) {
		name = "en-US"
		pluginData = avaliableLocales[name]
	}
	preprocessRawData(pluginData, InstantFoxModule.pluginLoader)
	//Components.utils.reportError(name)
	return pluginData
}




