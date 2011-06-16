rawPluginData = {}
rawPluginData.plugins = {
    weather: {
		key: 'f',
		url: 'http://weather.instantfox.net/%q',
		json: 'http://maps.google.com/maps/suggest?q=%q&cp=999&hl=%ls&gl=%ls&v=2&json=b',
		hideFromContextMenu: true
    },
    google: {
		key: 'g',
		url: 'http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b',
		json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=de'
    },
    googleImages: {
		key: 'gi',
		url: 'http://www.google.%ld/images?q=%q&hl=%ls',
		json: 'http://suggestqueries.google.com/complete/search?json&ds=i&q=%q'
    },
    googleMaps: {
		key: 'm',
		url: 'http://maps.google.com/maps?q=%q',
		json: 'http://maps.google.%ld/maps/suggest?q=%q&cp=999&hl=%ll&gl=%ll&v=2&json=b'
    },
    youTube: {
		key: 'y',
		url: 'http://www.youtube.com/results?search_query=%q',
		json: 'http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q'
    },
    googleluck: {
		key: 'gg',
		url: 'http://www.google.com/search?hl=%ls&q=%q&btnI=Auf+gut+Gl%C3%BCck!',
		hideFromContextMenu: true
	},
    twitter: {
		key: 't',
		url: 'http://search.twitter.com/search?q=%q',
    },
    Amazon: {
		key: 'a',
		url: 'http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325',
		json: 'http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4'
    },
    eBay: {
		key: 'e',
		url: 'http://shop.ebay.%ld/?_nkw=%q',
		json: 'http://anywhere.ebay.com/services/suggest/?s=0&q=%q'
    },
    Yahoo: {
		key: 'yh',
		url: 'http://search.yahoo.com/search?p=%q&ei=UTF-8',
		json: 'http://ff.search.yahoo.com/gossip?output=fxjson&command=%q'
    },
    Bing: {
		key: 'b',
		url: 'http://www.bing.com/search?q=%q&form=QBLH',
		json: 'http://api.bing.com/osjson.aspx?query=%q&form=OSDJAS'
    },
    leo: {
		key: 'l',
		url: 'http://dict.leo.org/?search=%q',
		json: false
    },
    Wikipedia: {
		key: 'w',
		url: 'http://%ls.wikipedia.org/wiki/%q',
		json: 'http://%ls.wikipedia.org/w/api.php?action=opensearch&search=%q'
    },
    'Wolfram|Alpha': {
		key: 'wa',
		url: 'http://www.wolframalpha.com/input/?i=%q'
    },
    imdb: {
        key: 'imdb',
        url: 'http://www.imdb.com/find?s=all&q=%q',
        json: 'http://sg.media-imdb.com/suggests/%fq/%q.json', // fq = first letter of query
		hideFromContextMenu: true
    },
	calculator: {
		key: 'c',
		url: 'resource://instantfox/calculator.html#%q',
		hideFromContextMenu: true
	}
};

rawPluginData.localeMap = {'%ls': 'de', '%ll': 'de-DE', '%ld': 'de'}
