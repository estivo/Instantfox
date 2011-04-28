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
    l:    'leo',
    t:    'twitter',
    a:    'amazon',
    e:    'ebay',
    gg:		'googleluck',
    wa:   'wolframalpha'
  };
  
  InstantFox.Plugins.extend({
    weather: {
      url: 'http://weather.instantfox.net/%q',
      json: 'http://maps.google.de/maps/suggest?q=%q&cp=999&gl=ch&gl=ch&v=2&json=b'
    },
    googleFrame: {
      url: 'http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b',
      json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=ch'
    },
    googleImages: {
      url: 'http://www.google.%ld/images?q=%q&hl=%ls',
      json: 'http://suggestqueries.google.com/complete/search?json&ds=i&q=%q'
    },
    googleMaps: {
      url: 'http://maps.google.com/maps?q=%q',
      json: 'http://maps.google.de/maps/suggest?q=%q&cp=999&gl=ch&gl=ch&v=2&json=b'
    },
    youTube: {
      url: 'http://www.youtube.com/results?search_query=%q',
      json: 'http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q'
    },
    googleluck: {
      url: 'http://www.google.de/search?hl=de&q=%q&btnI=Auf+gut+Gl%C3%BCck!',
  	  json: false
    },
    twitter: {
      url: 'http://twitter.com/#!/search/%q',
   	  json: false
    },
    amazon: {
      url: 'http://www.amazon.de/gp/search?ie=UTF8&keywords=%q&tag=324-21&index=aps&linkCode=ur2&camp=1638&creative=6742',
      json: 'http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4'
    },
    ebay: {
      url: 'http://shop.ebay.%ld/?_nkw=%q',
      json: 'http://anywhere.ebay.de/services/suggest/?s=0&q=%q'
    },
    yahoo: {
      url: 'http://%ld.search.yahoo.com/search?p=%q&ei=UTF-8',
      json: false
    },
    bing: {
      url: 'http://www.bing.com/search?q=%q&form=QBLH',
      json: 'http://api.bing.com/osjson.aspx?query=%q&form=OSDJAS'
    },
    leo: {
      url: 'http://dict.leo.org/?search=%q',
      json: false
    },
    wikipedia: {
      url: 'http://de.wikipedia.org/wiki/%q',
      json: 'http://de.wikipedia.org/w/api.php?action=opensearch&search=%q'
    },
    wolframalpha: {
      url: 'http://www.wolframalpha.com/input/?i=%q',
      json: false
    }
  });