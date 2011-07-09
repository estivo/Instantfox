rawPluginData = {}
rawPluginData.plugins = {
    'Google': {
		key: 'g',
		url: 'http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b',
		json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=%ls'
    },
    'Google Images': {
		key: 'i',
		url: 'http://www.google.%ld/images?q=%q',
		json: 'http://suggestqueries.google.com/complete/search?json&ds=i&q=%q'
    },
    'Google Maps': {
		key: 'm',
		url: 'http://maps.google.com/maps?q=%q&hl=%ls',
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
		json: 'http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q'
    },
    'Amazon': {
		key: 'a',
		url: 'http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325',
		json: 'http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4'
    },
    'Twitter': {
		key: 't',
		url: 'http://twitter.com/#!/search/%q',
    },
    'Weather': {
		key: 'wt',
		url: 'http://weather.instantfox.net/%q',
		json: 'http://maps.google.com/maps/suggest?q=%q&cp=999&hl=%ls&gl=%ls&v=2&json=b',
		hideFromContextMenu: true
    },
    'IMDb': {
		key: 'im',
		url: 'http://www.imdb.com/find?s=all&q=%q',
		json: 'http://sg.media-imdb.com/suggests/%fq/%q.json', // fq = first letter of query
		hideFromContextMenu: true
    },
    'Yahoo': {
		key: 'yh',
		url: 'http://%ld.search.yahoo.com/search?p=%q&ei=UTF-8',
		json: 'http://ff.search.yahoo.com/gossip?output=fxjson&command=%q'
    },
    'Bing': {
		key: 'b',
		url: 'http://www.bing.com/search?q=%q&form=QBLH',
		json: 'http://api.bing.com/osjson.aspx?query=%q&form=OSDJAS'
    },
    'Google Luck': {
		key: 'gg',
		url: 'http://www.google.com/search?q=%q&btnI=1',
		json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=%ls',
		hideFromContextMenu: true
		},
		'Calculator': {
		key: 'c',
		url: 'resource://instantfox/calculator.html#%q',
		hideFromContextMenu: true
	}
};

rawPluginData.localeMap = {'%ls': 'pt', '%ll': 'pt-BR', '%ld': 'com.br'}
