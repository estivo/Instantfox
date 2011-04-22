//(function() {
  // @TODO: Handle Shortcuts in Config
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
    wa:   'wolframalpha'
  };
  
  InstantFox.Plugins.extend({
    googleFrame: {
      url: 'http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b',
      json: 'http://suggestqueries.google.com/complete/search?json&q=%q&hl=nl'
    },
    googleImages: {
      url: 'http://www.google.%ld/images?q=%q&hl=%ls',
      json: 'http://suggestqueries.google.com/complete/search?json&ds=i&q=%q'
    },
    googleMaps: {
      url: 'http://maps.google.com/maps?q=%q',
	  json:false //json: 'http://maps.google.de/maps/suggest?q=%q&cp=1&hl=de&gl=de&v=2&json=b' !leads into syntax error!
    },
    youTube: {
      url: 'http://www.youtube.com/results?search_query=%q',
	  json: 'http://suggestqueries.google.com/complete/search?json&ds=yt&q=%q'
    },
    twitter: {
      url: 'http://search.twitter.com/search?q=%q',
   	  json: false
    },
    amazon: {
      url: 'http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325',
	  json: 'http://completion.amazon.co.uk/search/complete?method=completion&q=%q&search-alias=aps&mkt=4'
    },
    ebay: {
      url: 'http://shop.ebay.%ld/?_nkw=%q',
	  //json: 'http://include.ebaystatic.com/autofill/f/77/1300464103%q.js' // /t/e/s/t.js
	  json: 'http://anywhere.ebay.com/services/suggest/?s=0&q=%q' // from firefoxes searchservice
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
      url: 'http://nl.wikipedia.org/w/index.php?search=%q',
	  json: 'http://nl.wikipedia.org/w/api.php?action=opensearch&search=%q'
    },
    wolframalpha: {
      url: 'http://www.wolframalpha.com/input/?i=%q',
	  json: false
    }
  });
  
//})();