  /**
   * Plugins for Shortcuts
   * Defining: InstantFox.Plugins.extend(obj Plugin);
   * Initialisation: Plugin.init(obj win) | Called when extension window is loaded
   * Call: Plugin.script(string query) | Called when Shortcut matches Plugin
   */
  
  InstantFox.Plugins.extend({
    googleApi: {
      file: 'https://www.google.com/jsapi',
      suggestUrl: 'http://suggestqueries.google.com/complete/search',
      
      init: function(win) {
        this.win = win;
      },
      
      script: function(query) {
        return { loc: this.search(encodeURIComponent(query)), id: 'googleApi' };
        // @TODO: Enable Suggestion Feature
        // this.suggest(query);
      },
      
      search: function(query, callback) {
        // this.win.googleSearch(query);
        var first = false;
        
        try {
          this.win.proxy(function() {
            // google.setOnLoadCallback(function() {
            setTimeout(function(self) {
              if(typeof self.searchControl == 'undefined') first = true;

              var google = self.google;
              if(first) {
                // Create a search control
                self.searchControl = new google.search.SearchControl(null);

                // Add in a full set of searchers
                self.searchControl.addSearcher(new google.search.WebSearch());
                self.searchControl.addSearcher(new google.search.ImageSearch());
                self.searchControl.addSearcher(new google.search.VideoSearch());
                self.searchControl.addSearcher(new google.search.BlogSearch());

                // Draw Modes
                var drawOptions = new google.search.DrawOptions();
                drawOptions.setDrawMode(google.search.SearchControl.DRAW_MODE_TABBED);

                // Tell the searcher to draw itself and tell it where to attach
                self.searchControl.draw(self.document.getElementById('container'), drawOptions);
                self.searchControl.enableAds('pub-8835926515142949');
              }

              self.searchControl.execute(query);

              if(first) {
                self.googleStyles();
              };
            }, 0, this);
            // });
          });
        } catch(ex) { InstantFox.log(ex); }
      }
    },
  
    calculator: {
      // Accepted Chars
      scope: "0123456789.+-*/%(, )",
	  
      script: function(query) {
        var ret = this.parse(query);
        var url = "http://search.instantfox.net/#c "+ret;
        if (ret) {
          try {
            // .. Calculate ..
            var vlr = eval('('+ret+')').toString();
            if (vlr != ret) {
              //InstantFox.content('<div class="env calculator">'+ret+' = <span class="result">'+vlr+'</span></div>');
			  InstantFox.attr_create('env calculator',ret+' = ','result',vlr);
			  InstantFox.title(ret+' = '+vlr);
            }
          } catch(ex) {}
        }
        
        return { loc: url, id: 'calculator' };
      },
    
      parse: function(vlr){
        try {
          if (vlr.length>0) {
            for(var i=0;i<vlr.length;i++) {
              if (this.scope.indexOf(vlr.charAt(i)) < 0) {
                //InstantFox.content('<div class="env calculator">Unkown operation.<br />Available operators: '+this.scope+'</div>');
				InstantFox.attr_create('env calculator','Unkown operation. Available operators:'+this.scope);
				return null;
              }
            };
            return vlr;
          }
        } catch(ex) {
          return null;
        }
      }
    },

  });