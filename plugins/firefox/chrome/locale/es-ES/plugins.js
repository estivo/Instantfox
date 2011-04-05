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
    e:    'ebay'
  };
  
  InstantFox.Plugins.extend({
    googleFrame: {
      url: 'http://www.google.%ld/#q=%q&fp=1&cad=b'
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
    ebay: {
      url: 'http://shop.ebay.%ld/?_nkw=%q'
    },
    yahoo: {
      url: 'http://%ld.search.yahoo.com/search?p=%q&ei=UTF-8'
    },
    bing: {
      url: 'http://www.bing.com/search?q=%q&form=QBLH'
    },
    wikipedia: {
      url: 'http://%ls.wikipedia.org/w/index.php?search=%q'
    }
  });
  
//})();