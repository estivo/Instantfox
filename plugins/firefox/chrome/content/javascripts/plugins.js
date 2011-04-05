//(function() {
  
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
        if (ret) {
          try {
            // .. Calculate ..
            var vlr = eval('('+ret+')').toString();
            if (vlr != ret) {
              InstantFox.content('<div class="env calculator">'+ret+' = <span class="result">'+vlr+'</span></div>');
              InstantFox.title(ret+' = '+vlr);
            }
          } catch(ex) {}
        }
        
        return { loc: false, id: 'calculator' };
      },
    
      parse: function(vlr){
        try {
          if (vlr.length>0) {
            for(var i=0;i<vlr.length;i++) {
              if (this.scope.indexOf(vlr.charAt(i)) < 0) {
                InstantFox.content('<div class="env calculator">Unkown operation.<br />Available operators: '+this.scope+'</div>');
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
    
    weather: {
      url: 'http://search.instantfox.net/gapi.php?weather=',
      baseUrl: 'http://www.google.com',
    
      // Using Apache-Proxy
      // ProxyPass /gapi http://www.google.com/ig/api
    
      script: function(query) {
        var html = '', self = this,
            locale = '&hl=' + InstantFox._i18n('locale.short');
        
        $.ajax({
          url: this.url + encodeURIComponent(query) + locale,
          method: 'get',
          dataType: 'xml',
          success: function(data) {
            // Reset InstantFox-Content ..
            // .. so that nothing confuses while loading
            InstantFox.content('');
            
            var city = $('city', data);
            
            if(city.length > 0) {
              html += '<h1 class="ccity">'+city.attr('data')+'</h1>';
            }
            
            // Current Condition HTML-Building from XML
            var current = $('current_conditions', data);
            if (current.length > 0) {
              html += '<div class="weather current">';
              html += '<div class="day">Today</div>';
              html += '<img class="icon" src="'+self.baseUrl+current.find('icon').attr('data')+'" />';
              html += '<div class="condition">Condition: '+current.find('condition').attr('data')+'</div>';
              html += '<div class="temp_c">Temperature: '+current.find('temp_c').attr('data')+'°C / '+current.find('temp_f').attr('data')+'°F</div>';
              html += '</div>';
            };
            
            // Forecast HTML-Building from XML
            var forecast = $('forecast_conditions', data);
            if (forecast.length > 0) {
              forecast.each(function(index, value) {
                var dom = $(value);
                html += '<div class="weather forecast">';
                html += '<div class="day">'+dom.find('day_of_week').attr('data')+'</div>';
                html += '<img class="icon" src="'+self.baseUrl+dom.find('icon').attr('data')+'" />';
                html += '<div class="condition">Condition: '+dom.find('condition').attr('data')+'</div>';
                html += '<div class="low">Low: '+dom.find('low').attr('data')+'°</div>';
                html += '<div class="high">High: '+dom.find('high').attr('data')+'°</div>';
                html += '</div>';
              });
            }
            
            // If there were any results, make them visible
            if (html.length > 0) {
              InstantFox.content('<div class="env">'+html+'</div>');
              InstantFox.title(city.attr('data')+' weather');
            }
          }
        });
        
        return { loc: false, id: 'weather' };
      }
    }
  });
//})();