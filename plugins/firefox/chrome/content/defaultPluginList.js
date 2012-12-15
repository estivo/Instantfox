// firefox modules can't handle unicode charactters
// to get lovely look of unicode characters "\u2665"
// convert this file using __devel__.js \u263a

// list of all firefox locales
// http://mxr.mozilla.org/mozilla-central/source/mobile/chrome/content/languages.properties
EXPORTED_SYMBOLS = ['InstantFoxPluginList'];
InstantFoxPluginList = this;

var avaliableLocales = {}, avaliableLocaleNames = [];
/****************************** data *************************/
var commonPlugins = {
	Google: {
		key: "g",
		url: "http://www.google.%ld/search?hl=%ls&q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&client=firefox&q=%q&hl=%ls",
		name: "Google"
	},
	GoogleImages: {
		key: "i",
		url: "http://www.google.%ld/search?tbm=isch&q=%q&hl=%ls",
		json: "http://suggestqueries.google.com/complete/search?json&client=firefox&ds=i&hl=%ls&q=%q",
		name: "Google Images",
		iconURI: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAB41BMVEUAAAB7wUJ6wUJ6wUJ6wUL1nxn1oBn1oBn1nxl6wUJ6wUJ6wUJrvUT1mxr1nxn1nxlfu0Z8wkLznhv0mhp6wUJWuUdaukfLrSv4rhX1nxl5wUJyv0TQrCnyjhz1kyH2pRj1oBl7wkNbukfzjR3zkxv1liHuMDXuGTf2rxN7wUJeu0apuDfzjhz1nBvuNizwZi/3sxP2pBh9wkGvuTbvoRvuJy/xcC33qRhbl7F2uGOMwT94havnRTzuMjjwTTNRislRjcZ5uVpnvU0rk9Fhjr3aTkPuLTVQkM1PgsKHxD9/w0JfnKsAouPtHCTvQDRRkM1Qjstfn6p2jLHvOzDvQDVQkM1Rkc1RjstOh8Z/h6buLirtGyTvOzHvQDXwQDVPkcftPzdRkc1QkMxRkM0xlNLuNSzwQDXvQDVQkM1Rkc1QkM1Rkc3vQDTvQDXvQDXwQDV7wUL2oBr1nxn2oBl6wUJ7wkN9wkF9wkJ6wUP0lRv3qhf1oBn4rhX3qhb1nhp8wkL0nBruGjLuIzf3qRZ/w0JcukbuLCntIzl+wkFkvEbtGyVPhMRyv0QAmNfuLCruMDVRkc1ViccKltTvQDVRhcUAmdfvQDRRks5RiskcltTwQzdQkM07k9DtGyPvQzdQkMzvPzSgiRCBAAAAcHRSTlMAM9bsfmzq30TnaEIQF1b390JR9nP98873iO4nsPyvO3Vly1783sVB8T/5j+2SiIXyKITTeqTRY0ThWl/g9jAn2cBPbNfJFWXVrOjTge5EeeC0qPBsYPfUstjGvOP+dnp0+pmBR1GEikvl8paC8etfYXu9TgAAAAlwSFlzAAAASAAAAEgARslrPgAAAQJJREFUGNM1j8VWQzEARAco8NDiLsXdXQvF3d3dIQ2vOBR3CQSCFPtUUg7Mbu5i7hnY2Npp8Bd7B0cFToQQZxdXwE1xN9JVLVRiUsmah6eXNzVKQOFD1PUNXz//za0ASul2IKBRg4IREroThnAt1cmlCFMkoqJ3Y2LjEL+nSJBgTkxK3k9JPThMSz/KsMoyj0+ysoGc07PcvF97fsH5RSFQVHxZUmrt+quycvO1oeKmsur2rlqCGlaLuvqG+4dGNPFmCVpYK9D2+NQOdIhOoKubPff0vrz29Q8MvvGhYTAZC3sfGf34FFwIgTHLFxufmASmpme+OeeYnZtf+L+/uLS88gMT2kW5QAjbFwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxMi0wNC0wNlQxMDoxMzowNSswNDowMIQ8zwwAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTItMDQtMDZUMTA6MTM6MDUrMDQ6MDD1YXewAAAAAElFTkSuQmCC"
	},
	GoogleMaps: {
		key: "m",
		url: "http://maps.google.%ld/maps?q=%q",
		json: "http://maps.google.%ld/maps/suggest?q=%q&cp=999&hl=%ll&gl=%ll&v=2&json=b",
		name: "Google Maps",
		iconURI: "http://maps.gstatic.com/favicon.ico"
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
		json: "http://suggestqueries.google.com/complete/search?json&client=firefox&hl=%ls&ds=yt&q=%q",
		name: "Youtube"
	},
	Amazon: {
		key: "a",
		url: "http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325",
		json: "http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4",
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
		json: "http://suggestqueries.google.com/complete/search?json&client=firefox&q=%q&hl=%ls",
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
		name: "Google Translate"
	}
}

/****************************** data *************************
 * locale(name, map:['%ls', '%ll', '%ld'], plugins)
 *****/
locale(["de","de-DE","de"], {
	Google: true,
	GoogleImages: {
		name: "Google Bilder",
		key: "b"
	},
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/707-53477-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229487&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: {
		name: "Wetter"
	},
	LEO: true,
	IMDb: true,
	GoogleLuck: {
		name: "Google Gl\u00fcck",
		key: "gg"
	},
	Calculator: true,
	GoogleTranslate: {
		name: "Google Translate / \u00dcbersetzung"
	}
})

locale(["de","de-AT","at"], {
	Google: true,
	GoogleImages: {
		name: "Google Bilder",
		key: "b"
	},
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/705-53470-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229515&kwid=902099&mtid=824&kw=lg&&icep_uq=%q"
	},
	Twitter: true,
	Weather: {
		name: "Wetter"
	},
	LEO: true,
	IMDb: true,
	GoogleLuck: {
		name: "Google Gl\u00fcck",
		key: "gg"
	},
	Calculator: true,
	GoogleTranslate: {
		name: "Google Translate / \u00dcbersetzung"
	}
})

locale(["de","de-CH","ch"], {
	Google: true,
	GoogleImages: {
		name: "Google Bilder",
		key: "b"
	},
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/5222-53480-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229536&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: {
		name: "Wetter"
	},
	LEO: true,
	IMDb: true,
	GoogleLuck: {
		name: "Google Gl\u00fcck",
		key: "gg"
	},
	Calculator: true,
	GoogleTranslate: {
		name: "Google Translate / \u00dcbersetzung"
	}
})

// make en-US default for en-* branch
locale(["en","en-US","com"], {
	Google: {
		url: "http://www.google.%ld/search?q=%q"
	},
	GoogleImages: {
		url: "http://www.google.%ld/images?q=%q",
		json: "http://suggestqueries.google.com/complete/search?json&client=firefox&ds=i&q=%q"
	},
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: {
		json: "http://suggestqueries.google.com/complete/search?json&client=firefox&ds=yt&q=%q"
	},
	Amazon: true,
	eBay: {
		url: "http://rover.ebay.com/rover/1/711-53200-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229466&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
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

locale(["en","en-AU","com.au"], {
	Google: true,
	GoogleImages: true,
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	eBay: {
		url: "http://rover.ebay.com/rover/1/705-53470-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229515&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: true,
	IMDb: true,
	GoogleLuck: true,
	Calculator: true,
	GoogleTranslate: true
})

locale(["en","en-CA","ca"], {
	Google: true,
	GoogleImages: true,
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.ca/gp/search?ie=UTF8&keywords=%q&tag=609-20&index=aps&linkCode=ur2&camp=15121&creative=330641"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/706-53473-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229529&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: true,
	IMDb: true,
	GoogleLuck: true,
	Calculator: true,
	GoogleTranslate: true
})

locale(["en","en-GB","co.uk"], {
	Google: true,
	GoogleImages: true,
	GoogleMaps: true,
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.co.uk/gp/search?ie=UTF8&keywords=%q&tag=509-21&index=aps&linkCode=ur2&camp=1634&creative=6738"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/710-53481-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229508&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: true,
	IMDb: true,
	GoogleLuck: true,
	Calculator: true,
	GoogleTranslate: true
})

locale(["es","es-ES","es"], {
	Google: true,
	GoogleImages: {
		name: "Google Im\u00e1genes"
	},
	GoogleMaps: {
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.es/gp/search?ie=UTF8&keywords=%q&tag=608-21&index=aps&linkCode=ur2&camp=3626&creative=24790"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/1185-53479-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229501&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google Suerte",
		key: "gs"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: {
		name: "Google Traductor"	
	}
})

locale(["es","es-AR","com.ar"], {
	Google: true,
	GoogleImages: {
		name: "Google Im\u00e1genes"
	},
	GoogleMaps: {
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google Suerte",
		key: "gs"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: {
		name: "Google Traductor"	
	}
})

locale(["es","es-MX","com.mx"], {
	Google: true,
	GoogleImages: {
		name: "Google Im\u00e1genes"
	},
	GoogleMaps: {
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google Suerte",
		key: "gs"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: {
		name: "Google Traductor"	
	}
})

locale(["es","es-CL","cl"], {
	Google: true,
	GoogleImages: {
		name: "Google Im\u00e1genes"
	},
	GoogleMaps: {
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tiempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google Suerte",
		key: "gs"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: {
		name: "Google Traductor"	
	}
})

locale(["fr","fr-FR","fr"], {
	Google: true,
	GoogleImages: {
		name: "Google Images"
	},
	GoogleMaps: {
		name: "Google Maps"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.fr/gp/search?ie=UTF8&keywords=%q&tag=604-21&index=aps&linkCode=ur2&camp=1642&creative=6746"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/709-53476-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229480&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google Chance",
		key: "gc"
	},
	Calculator: {
		name: "Calculateur"
	},
	GoogleTranslate: {
		name: "Google Traduction"	
	}
})

locale(["it","it-IT","it"], {
	Google: true,
	GoogleImages: {
		name: "Google Immagini"
	},
	GoogleMaps: {
		name: "Google Mappe"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.it/gp/search?ie=UTF8&keywords=%q&tag=805-21&index=blended&linkCode=ur2&camp=3370&creative=23322"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/724-53478-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229494&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google Fortunato",
		key: "gf"
	},
	Calculator: {
		name: "Calculateur"
	},
	GoogleTranslate: {
		name: "Google Traduttore"	
	}
})

locale(["nl","nl","nl"], {
	Google: true,
	GoogleImages: {
		key: "i",
		name: "Google Images / Afbeeldingen"
	},
	GoogleMaps: {
		name: "Google Maps"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.co.uk/gp/search?ie=UTF8&keywords=%q&tag=509-21&index=aps&linkCode=ur2&camp=1634&creative=6738"
	},
	eBay: {
		url: "http://rover.ebay.com/rover/1/1346-53482-19255-0/1?icep_ff3=9&pub=5574841060&toolid=10001&campid=5337149391&customid=&icep_sellerId=&icep_ex_kw=&icep_sortBy=12&icep_catId=&icep_minPrice=&icep_maxPrice=&ipn=psmain&icep_vectorid=229557&kwid=902099&mtid=824&kw=lg&icep_uq=%q"
	},
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tempo"
	},
	IMDb: true,
	Calculator: true,
	GoogleTranslate: {
		name: "Google Vertaling",
		key: "v"
	}

})

locale(["pl","pl","pl"], {
	Google: true,
	GoogleImages: {
		name: "Google Grafika"
	},
	GoogleMaps: {
		name: "Google Mapy"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	eBay: true,
	Twitter: true,
	Weather: {
		key: "wy",
		name: "Wyziewy"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google Szcz\u0119\u015bcia",
		key: "gf"
	},
	Calculator: {
		name: "Kalkulator",
		key: "k"
	},
	GoogleTranslate: {
		name: "Google T\u0142umacz"
	}
})

locale(["pt","pt","pt"], {
	Google: true,
	GoogleImages: {
		name: "Google Imagens"
	},
	GoogleMaps: {
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	eBay: true,
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google com Sorte",
		key: "gf"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: {
		name: "Google Tradutor"
	}
})

locale(["pt","pt-BR","com.br"], {
	Google: true,
	GoogleImages: {
		name: "Google Imagens"
	},
	GoogleMaps: {
		name: "Google Mapas"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	Twitter: true,
	Weather: {
		key: "to",
		name: "Tempo"
	},
	IMDb: true,
	GoogleLuck: {
		name: "Google com Sorte",
		key: "gf"
	},
	Calculator: {
		name: "Calculadora"
	},
	GoogleTranslate: {
		name: "Google Tradutor"
	}
})

locale(["ru","ru","ru"], {
	Yandex: {
		key: "y",
		url: "http://yandex.ru/yandsearch?text=%q",
		json: "http://suggest.yandex.net/suggest-ff.cgi?part=%q",
		name: "\u042f\u043d\u0434\u0435\u043a\u0441"
	},
	Google: true,
	GoogleImages: {
		name: "Google \u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0438"
	},
	GoogleMaps: {
		name: "Google \u041a\u0430\u0440\u0442\u044b"
	},
	Wikipedia: true,
	Youtube:  {
		key: "yt"
	},
	Amazon: true,
	Twitter: true,
	Weather: {
		name: "Weather / \u043f\u043e\u0433\u043e\u0434\u0430"
	},
	IMDb: true,
	Calculator: {
		name: "\u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440"
	},
	GoogleTranslate: {
		name: "Google \u041f\u0435\u0440\u0435\u0432\u043e\u0434\u0447\u0438\u043a"
	}
})

locale(["tr","tr","com.tr"], {
	Google: true,
	GoogleImages: {
		name: "Google G\u00f6rseller"
	},
	GoogleMaps: {
		name: "Google Haritalar",
		url: "http://maps.google.com/maps?q=%q",
		json: "http://maps.google.com/maps/suggest?q=%q&cp=999&hl=%ll&gl=%ll&v=2&json=b",
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	Weather: {
		name: "Weather / Hava",
		key: "h"
	},
	IMDb: true,
	Calculator: {
		name: "Hesap Makinesi"
	},
	GoogleTranslate: {
		name: "Google \u00c7eviri",
		key: "gc"
	}
})

locale(["ja","ja","co.jp"], {
	Google: true,
	GoogleImages: {
		name: "Google \u753b\u50cf\u691c\u7d22"
	},
	GoogleMaps: {
		name: "Google \u30de\u30c3\u30d7 - \u5730\u56f3\u691c\u7d22"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: {
		url: "http://www.amazon.co.jp/s?ie=UTF8&x=17&ref_=nb_sb_noss&y=11&field-keywords=%q&url=search-alias%3Daps&_encoding=UTF8&tag=7098-22&linkCode=ur2&camp=247&creative=7399"
	},
	Twitter: true,
	Weather: {
		name: "\u6e7f\u6f64\u5264"
	},
	Calculator: {
		name: "\u30dd\u30b1\u30c3\u30c8\u96fb\u5353"
	},	
	GoogleTranslate: {
		name: "Google \u7ffb\u8a33"
	}
})

locale(["zh","zh-CN","cn"], {
	Google: {
		url: "http://www.google.com.hk/#hl=%ls&q=%q&fp=1&cad=b",
		json: "http://www.google.com.hk/complete/search?json&q=%q&hl=%ls",
		name: "Google \u4e3b\u9875"
	},
	GoogleImages: {
		url: "http://www.google.com.hk/images?q=%q&hl=%ls",
		json: "http://suggestqueries.google.com/complete/search?json&client=firefox&ds=i&hl=%ls&q=%q",
		name: "Google \u56fe\u7247"
	},
	GoogleMaps: {
		url: "http://ditu.google.cn/maps?q=%q",
		json: "http://ditu.google.%ld/maps/suggest?q=%q&cp=999&hl=%ll&gl=%ll&v=2&json=b",
		name: "Google \u5730\u56fe"
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
		name: "\u5929\u6c14"
	},
	Calculator: {
		name: "\u8896\u73cd\u8ba1\u7b97\u5668"
	},	
	GoogleTranslate: {
		name: "Google \u7ffb\u8bd1"
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
	GoogleTranslate: {
		name: "Google \u00d6vers\u00e4tt",
		key: "o"
	}
})

locale(["cs","cs","cz"], {
	Google: true,
	GoogleImages: {
		key: "o",
		name: "Google Obr\u00e1zky"
	},
	GoogleMaps: {
		name: "Google Mapy"
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	Weather: {
		key: "po",
		name: "Po\u010das\u00ed"
	},
	IMDb: true,
	GoogleLuck: {
		key: "gz",
		name: "Google Zkus\u00edm \u0161t\u011bst\u00ed"
	},
	Calculator: {
		name: "Kalkula\u010dka",
		key: "k"
	},
	GoogleTranslate: {
		name: "Google P\u0159eklada\u010d",
		key: "p"
	}
})

locale(["hu","hu","hu"], {
	Google: true,
	GoogleImages: {
		key: "k",
		name: "Google K\u00e9pek"
	},
	GoogleMaps: {
		name: "Google Maps / T\u00e9rk\u00e9p"
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	Weather: {
		key: "id",
		name: "Id\u0151j\u00e1r\u00e1s"
	},
	IMDb: {
		name: "IMDb"
	},
	GoogleLuck: {
		key: "gz",
		url: "http://www.google.com/search?q=%q&btnI=1",
		name: "Google Zkus\u00edm \u0161t\u011bst\u00ed"
	},
	Calculator: {
		name: "Sz\u00e1mol\u00f3g\u00e9p",
		key: "s"
	},
	GoogleTranslate: {
		name: "Google Ford\u00edt\u00f3",
		key: "f"
	}
})

locale(["ro","ro-RO","ro"], {
	Google: true,
	GoogleImages: {
		name: "Google Imagini"
	},
	GoogleMaps: {
		name: "Google H\u0103r\u0163i"
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	Weather: {
		key: "v",
		name: "Vreme"
	},
	IMDb: true,
	Calculator: {
		name: "Calculator",
		key: "c"
	},
	GoogleTranslate: {
		name: "Google Traducere",
	}
})

locale(["zh","zh-TW","com.tw"], {
	Google: true,
	GoogleImages: {
		name: "Google Images / \u5716\u7247"
	},
	GoogleMaps: {
		name: "Google Maps / \u5730\u5716"
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	IMDb: {
		name: "IMDb"
	},
	GoogleTranslate: {
		name: "Google Translate / \u7ffb\u8b6f"
	}
})

locale(["el","el","gr"], {
	Google: true,
	GoogleImages: {
		name: "Google \u0395\u03b9\u03ba\u03cc\u03bd\u03b5\u03c2",
		key: "e"
	},
	GoogleMaps: {
		name: "Google \u03a7\u03ac\u03c1\u03c4\u03b5\u03c2",
		key: "x"
	},
	Wikipedia: true,
	Youtube: true,
	Amazon: true,
	Twitter: true,
	Weather: {
		key: "k",
		name: "\u03ba\u03b1\u03b9\u03c1\u03cc\u03c2"
	},
	IMDb: true,
	Calculator: {
		name: "Calculator / \u03b1\u03c1\u03b9\u03b8\u03bc\u03bf\u03bc\u03b7\u03c7\u03b1\u03bd\u03ae"
	},
	GoogleTranslate: {
		name: "Google Translate / \u039c\u03b5\u03c4\u03ac\u03c6\u03c1\u03b1\u03c3\u03b7"
	}
})

locale(["fi","fi","fi"], {
	Google: true,
	GoogleImages: {
		key: "k",
		name: "Google Kuvahaku"
	},
	GoogleMaps: {
		name: "Google Kartat"
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	Weather: {
		key: "S\u00e4\u00e4",
		name: "s"
	},
	Calculator: {
		name: "Laskin",
		key: "l"
	},
	GoogleTranslate: {
		name: "Google K\u00e4\u00e4nt\u00e4j\u00e4",
		key: "k"
	}
})

locale(["ko","ko","co.kr"], {
	Google: true,
	GoogleImages: {
		name: "Google Images / \uac80\uc0c9"
	},
	GoogleMaps: {
		name: "Google Maps / \uc9c0\ub3c4"
	},
	Wikipedia: true,
	Youtube: true,
	Twitter: true,
	GoogleTranslate: {
		name: "Google Translate / \ubc88\uc5ed"
	}
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
			suggest: true,
			minQChars: 2,
			disabled: true
		}
	}
	
	loc.autoSearch = autoSearch

	avaliableLocales[spec] = loc
	avaliableLocaleNames.push(spec)
}



/*************************code from XPIProvider.jsm *************************/
Components.utils.import("resource://gre/modules/Services.jsm");

var PREF_MATCH_OS_LOCALE = "intl.locale.matchOS";
var PREF_SELECTED_LOCALE = "general.useragent.locale";
/**
 * An unhelpful wrapper around the prefs service that hides errors
 * when something is wrong
 */
var Prefs = {
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

  var matchLocales = [appLocale.toLowerCase()];
  if (desiredLocale)
    matchLocales.unshift(desiredLocale.toLowerCase())
  /* If the current locale is English then it will find a match if there is
     a valid match for en-US so no point searching that locale too. */
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

	for (var i in pluginData.plugins) {
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
	if(p) {
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




