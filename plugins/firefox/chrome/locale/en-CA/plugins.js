  InstantFox.Shortcuts = { 
    ga:   'googleApi',
    c:    'calculator',
    f:    'weather',
    g:    'googleFrame',
    i:    'googleImages',
    m:    'googleMaps',
    w:    'wikipedia',
    y:    'youTube',
    yh:   'yahoo',
    b:    'bing',
    t:    'twitter',
    a:    'amazon',
    e:    'ebay',
    gg:		'googleluck',
    wa:   'wolframalpha'
  };
  
  InstantFox.Plugins.extend({
    googleFrame: {
      url: 'http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b',
      json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=en-ca'
    },
    googleImages: {
      url: 'http://www.google.%ld/images?q=%q&hl=%ls',
      json: 'http://suggestqueries.google.com/complete/search?json&ds=i&q=%q'
    },
    googleMaps: {
      url: 'http://maps.google.ca/maps?q=%q',
	  json:false 
    },
    youTube: {
      url: 'http://www.youtube.com/results?search_query=%q',
	  json: 'http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q'
    },
    googleluck: {
      url: 'http://www.google.com/search?hl=%ls&q=%q&btnI=Auf+gut+Gl%C3%BCck!',
  	  json: false
    },
    twitter: {
      url: 'http://search.twitter.com/search?q=%q',
   	  json: false
    },
    amazon: {
       url: 'http://www.amazon.ca/gp/search?ie=UTF8&keywords=%q&tag=609-20&index=aps&linkCode=ur2&camp=15121&creative=330641',
	  json: 'http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4'
    },
    ebay: {
      url: 'http://shop.ebay.%ld/?_nkw=%q',
	  json: 'http://anywhere.ebay.com/services/suggest/?s=0&q=%q'
    },
    yahoo: {
      url: 'http://search.yahoo.com/search?p=%q&ei=UTF-8',
	  json: false
    },
    bing: {
      url: 'http://www.bing.com/search?q=%q&form=QBLH',
	  json: 'http://api.bing.com/osjson.aspx?query=%q&form=OSDJAS'
    },
    wikipedia: {
      url: 'http://en.wikipedia.org/w/index.php?search=%q',
	  json: 'http://en.wikipedia.org/w/api.php?action=opensearch&search=%q'
    },
    wolframalpha: {
      url: 'http://www.wolframalpha.com/input/?i=%q',
	  json: false
    }
  });