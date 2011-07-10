rawPluginData = {}
rawPluginData.plugins = {
    'Google': {
		key: 'g',
		url: 'http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b',
		json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=%ls'
    },
    'Google Images': {
		key: 'i',
		url: 'http://www.google.%ld/images?q=%q&hl=%ls',
		json: 'http://suggestqueries.google.com/complete/search?json&ds=i&hl=%ls&q=%q'
    },
    'Google Maps': {
		key: 'm',
		url: 'http://maps.google.com/maps?q=%q',
		json: 'http://maps.google.%ld/maps/suggest?q=%q&cp=999&hl=%ll&gl=%ll&v=2&json=b'
    },
    'Wikipedia': {
		key: 'w',
		url: 'http://%ls.wikipedia.org/wiki/%q',
		json: 'http://%ls.wikipedia.org/w/api.php?action=opensearch&search=%q'
    },
    'Youtube': {
		key: 'y',
		url: 'http://www.youtube.com/results?search_query=%q',
		json: 'http://suggestqueries.google.com/complete/search?json&hl=%ls&ds=yt&q=%q'
    },
    'Amazon': {
		key: 'a',
		url: 'http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742',
		json: 'http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4'
    }, 
    'eBay': {
		key: 'e',
		url: 'http://shop.ebay.%ld/?_nkw=%q',
		json: 'http://anywhere.ebay.com/services/suggest/?s=0&q=%q'
    },
    'Twitter': {
		key: 't',
		url: 'http://twitter.com/#!/search/%q',
    },   
    'Wetter': {
		key: 'wt',
		url: 'http://weather.instantfox.net/%q',
		json: 'http://maps.google.com/maps/suggest?q=%q&cp=999&hl=%ls&gl=%ls&v=2&json=b',
		hideFromContextMenu: true
    },
    'LEO Eng-Deu Dictionary': {
		key: 'd',
		url: 'http://dict.leo.org/?search=%q',
		json: false
    },
    'Int. Movie Db': {
		key: 'im',
		url: 'http://www.imdb.com/find?s=all&q=%q',
		json: 'http://sg.media-imdb.com/suggests/%fq/%q.json', // fq = first letter of query
		hideFromContextMenu: true
    },
    'Google Glück': {
		key: 'gg',
		url: 'http://www.google.%ld/search?hl=%ls&q=%q&btnI=1',
		json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=%ls',
		hideFromContextMenu: true
		},
		'Calculator': {
		key: 'c',
		url: 'resource://instantfox/calculator.html#%q',
		hideFromContextMenu: true
		}
};

rawPluginData.localeMap = {'%ls': 'de', '%ll': 'de-AT', '%ld': 'at'}
