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
      url: 'http://www.google.%ld/#hl=%ls&q=%q&fp=1&cad=b'
    },
    googleImages: {
      url: 'http://www.google.%ld/images?q=%q&hl=%ls'
    },
    googleMaps: {
      url: 'http://maps.google.com/maps?q=%q'
    },
    youTube: {
      url: 'http://www.youtube.com/results?search_query=%q'
    },
    twitter: {
      url: 'http://search.twitter.com/search?q=%q'
    },
    amazon: {
      url: 'http://www.amazon.com/gp/search?ie=UTF8&keywords=%q&tag=406-20&index=aps&linkCode=ur2&camp=1789&creative=9325'
    },
    ebay: {
      url: 'http://shop.ebay.%ld/?_nkw=%q'
    },
    yahoo: {
      url: 'http://search.yahoo.com/search?p=%q&ei=UTF-8'
    },
    bing: {
      url: 'http://www.bing.com/search?q=%q&form=QBLH'
    },
    wikipedia: {
      url: 'http://%ls.wikipedia.org/w/index.php?search=%q'
    },
    wolframalpha: {
      url: 'http://www.wolframalpha.com/input/?i=%q'
    }
  });
  
//})();