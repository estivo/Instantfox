(function() {
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
    e:    'ebay'
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
      url: 'http://www.amazon.it/gp/search?ie=UTF8&keywords=%q&tag=805-21&index=blended&linkCode=ur2&camp=3370&creative=23322'
    },
    ebay: {
      url: 'http://shop.ebay.%ld/?_nkw=%q'
    },
    yahoo: {
      url: 'http://%ld.search.yahoo.com/search?p=%q&ei=UTF-8'
    },
    bing: {
      url: 'http://www.bing.com/search?q=%q&form=QBLH'
    },
    leo: {
      url: 'http://dict.leo.org/?search=%q'
    },
    wikipedia: {
      url: 'http://%ls.wikipedia.org/w/index.php?search=%q'
    }
  });
  
})();