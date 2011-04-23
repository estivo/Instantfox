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
        var url = "http://search.instantfox.net/#c "+ret;
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
        
        return { loc: url, id: 'calculator' };
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
      url: 'http://search.instantfox.net/gapi.php?weather=%q&hl=%ls',
      baseUrl: 'http://www.google.com',
    
      // Using Apache-Proxy
      // ProxyPass /gapi http://www.google.com/ig/api
    
      script: function(query) {
        var html = '', self = this;
			
        function cloneArray(array) {
			var newArray = [];
			for (var i = 0; i < array.length; ++i) {
				 newArray.push(array[i]);        
			}
			return newArray;
		}
		
		function FtoC(F)(F - 32) * 5/9 
		function FAndC(F)Math.round(FtoC(parseFloat(F)))+'°C / '+F+'°F'
		function getData(dom,name){
			try{
				if(name)
					return escapeHTML(dom.querySelector(name).getAttribute('data'))
				else
					return escapeHTML(dom.getAttribute('data'))
			}catch(e){return ''}
		}
		function escapeHTML(str) str.replace(/[&"<>]/g, function(m)"&"+escapeMap[m]+";");
		var escapeMap = { "&": "amp", '"': "quot", "<": "lt", ">": "gt" }
		
        this.ajax({
          url: this.url.replace('%q', encodeURIComponent(query)),
          method: 'get',
          dataType: 'xml',
          success: function(data) {
            // Reset InstantFox-Content ..
            // .. so that nothing confuses while loading
            InstantFox.content('');
            var doc = data.target.responseXML
            var city = doc.querySelectorAll('city');
            
            if(city.length > 0) {
              html += '<h1 class="ccity">'+getData(city[0])+'</h1>';
            }
            
            // Current Condition HTML-Building from XML
            var current = doc.querySelectorAll('current_conditions');
            if (current.length > 0) {
			  current = current[0]
              html += '<div class="weather current">';
              html += '<div class="day">Today</div>';
              html += '<img class="icon" src="'+self.baseUrl+getData(current,'icon')+'" />';
              html += '<div class="condition">Condition: '+getData(current,'condition')+'</div>';
              html += '<div class="temp_c">Temperature: '+getData(current,'temp_c')+'°C / '
			                        +getData(current,'temp_f')+'°F</div>';
              html += '</div>';
            };
            
            // Forecast HTML-Building from XML
            var forecast = cloneArray(doc.querySelectorAll('forecast_conditions'));
            if (forecast.length > 0) {
              forecast.forEach(function(dom) {                
                html += '<div class="weather forecast">';
                html += '<div class="day">'+getData(dom,'day_of_week')+'</div>';
                html += '<img class="icon" src="'+self.baseUrl+getData(dom,'icon')+'" />';
                html += '<div class="condition">Condition: '+getData(dom,'condition')+'</div>';
                html += '<div class="low">Low: '+FAndC(getData(dom,'low'))+'</div>';
                html += '<div class="high">High: '+FAndC(getData(dom,'high'))+'</div>';
                html += '</div>';
              });
            }
            
            // If there were any results, make them visible
            if (html.length > 0) {
              InstantFox.content('<div class="env">'+html+'</div>');
              InstantFox.title(getData(city[0])+' weather');
            }
          }
        });
        
        return { loc: false, id: 'weather' };
      },
	  ajax: function(o){
	    var req = new XMLHttpRequest() 
		req.open("GET", o.url, true); 
		req.onload = o.success;
	    try {
          req.send(null);
        } catch (e) {}
	  }
    }
  });
//})();