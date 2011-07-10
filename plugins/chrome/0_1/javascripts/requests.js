	var InstantFoxReq = {
		processed_results:false,
		imdb_lastres:'',
		xhttpreq:false,
		
		call_suggest:'', // pointer to suggest function
		plugin:'',
		pluginkey:'',
		query:'',
		
		ld:'',
		ls:'',
		fq:'',
		ll:'', // not in use by this time
			
				
		_i18n: function(langs){
			return chrome.i18n.getMessage(langs);
		},
		
		imdburl: function(url2tidy){
			//if (url2tidy.length > 20) url2tidy = url2tidy.substr(0, 20);
			url2tidy = url2tidy.replace(/^\s*/, "").replace(/[ ]+/g, "_");
			url2tidy = url2tidy.replace(/[\u00e0\u00c0\u00e1\u00c1\u00e2\u00c2\u00e3\u00c3\u00e4\u00c4\u00e5\u00c5\u00e6\u00c6]/g, "a").replace(/[\u00e7\u00c7]/g, "c").replace(/[\u00e8\u00c8\u00e9\u00c9\u00ea\u00ca\u00eb\u00cb]/g, "e").replace(/[\u00ec\u00cd\u00ed\u00cd\u00ee\u00ce\u00ef\u00cf]/g, "i").replace(/[\u00f0\u00d0]/g, "d").replace(/[\u00f1\u00d1]/g, "n").replace(/[\u00f2\u00d2\u00f3\u00d3\u00f4\u00d4\u00f5\u00d5\u00f6\u00d6\u00f8\u00d8]/g, "o").replace(/[\u00f9\u00d9\u00fa\u00da\u00fb\u00db\u00fc\u00dc]/g, "u").replace(/[\u00fd\u00dd\u00ff]/g, "y").replace(/[\u00fe\u00de]/g, "t").replace(/[\u00df]/g, "ss");
			return url2tidy = url2tidy.replace(/[\W]/g, "")
		},

		
		callback: function(rtoparse){
			console.log("rtoparse is: "+rtoparse);		
			if('m,f'.indexOf(this.pluginkey)!=-1){
				 rtoparse = rtoparse.replace(/(\w+):/gi, '"\$1":');
			}
			if(this.pluginkey=='imdb'){
				 // from { to } other is invalid!
				 var sposp = rtoparse.indexOf('{');
				 var eposp = rtoparse.lastIndexOf('}');
				 rtoparse = rtoparse.substr(sposp,(eposp-(sposp-1))); // include last sign so -1
			}
			
			try{
				var xhr_return = JSON.parse(rtoparse);
				if(this.pluginkey=='imdb' && xhr_return){
					this.imdb_lastres = xhr_return;
				}
			}catch(e){
				console.log("parse error: "+e);		
				var xhr_return = 'error';
			}
			
			var tmp_results = new Array();
			var suggestions = [];
			var type_not_found = true;
			
			/*		
			if(this.pluginkey == 'imdb'){
				// last results must be "cashed" and saved in a var. If last query matches current query get last possible query
				if(api['query'].indexOf(api['lastquery']) == 0 && xhr_return == 'error' && api['lastquery']){
					xhr_return = InstantFox_Comp.imdb_lastres;
				}
				if(xhr_return['d']){
					type_not_found = false;
					
					var gotourl = api['gotourl'];
					
					for(var i=0; i <  xhr_return['d'].length; i++){
							var result_info	= {};
							var result		= xhr_return['d'][i]['l']; //sorted_results[j];
							
							var escapeurl 	= gotourl.replace('%q', escape(result));
								escapeurl	= escapeurl.replace(/%20/g, '+');
								
							if(i==0){
								InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = false;
								if(InstantFox_Comp.Wnd.InstantFox.current_shaddow !=  result){
									InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
									InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,api['query']);
									InstantFox_Comp.Wnd.InstantFox.HH._goto4comp(escapeurl);
								}
							}
							
							result_info.icon			= null;
							result_info.title			= result;
							result_info.url				= api['key'] + ' ' + result;;

							tmp_results.push(result_info);
							
							internal_results.values.push(result_info.url);
							internal_results.comments.push(result_info.title);
							internal_results.images.push(result_info.icon);
							
							if(i== xhr_return['d'].length-1){
								internal_results.last.push(true);
							}else{
								internal_results.last.push(false);
							}
					}
				}
				
			}
			*/
			
			if('m,f'.indexOf(this.pluginkey)!=-1){
				if(xhr_return['suggestion']){
					type_not_found = false;
					
					//var gotourl = chrome.i18n.getMessage(this.plugin+'_json',[this.query,this.ld,this.ls,this.fq]);
					
					for(var i=0; i <  xhr_return['suggestion'].length; i++){
							var result_info	= {};
							var result		= xhr_return['suggestion'][i]['query']; //sorted_results[j];
							
							if(i==0){
								/*
								InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = false;
								if(InstantFox_Comp.Wnd.InstantFox.current_shaddow !=  result){
									InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
									InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,this.query);
									InstantFox_Comp.Wnd.InstantFox.HH._goto4comp(gotourl.replace('%q', encodeURIComponent(result)));
								}
								*/
							}
							/*
							result_info.icon			= null;
							result_info.title			= result;
							result_info.url				= this.pluginkey + ' ' + result;
							*/

							suggestions.push({ content: result, description:  result });

							/*
							internal_results.values.push(result_info.url);
							internal_results.comments.push(result_info.title);
							internal_results.images.push(result_info.icon);
							
							if(i== xhr_return['suggestion'].length-1){
								internal_results.last.push(true);
							}else{
								internal_results.last.push(false);
							}
							*/
					}
				}
				
			}
			if('g,i,y,w,a,b,e'.indexOf(this.pluginkey)!=-1){
				if(xhr_return[1]){
					type_not_found = false;
					
					//var gotourl = api['gotourl'];
					
					//if(xhr_return[1].length == 0) InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = true;
					for(var i=0; i < xhr_return[1].length;i++){		
							var result_info	= {};
							var result		= xhr_return[1][i];

							if(i==0){
								/*
								InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = false;
								if(InstantFox_Comp.Wnd.InstantFox.current_shaddow != result){
									InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
									InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,api['query']);
									InstantFox_Comp.Wnd.InstantFox.HH._goto4comp(gotourl.replace('%q', encodeURIComponent(result)));
								}
								*/
							}

							/*
							result_info.icon			= null;
							result_info.content			= result;
							result_info.description		= this.pluginkey + ' ' + result;
							*/	
							suggestions.push({ content: result, description:  result });
																		
							//tmp_results.push(result_info);
							
							/*
							internal_results.values.push(result_info.url);
							internal_results.comments.push(result_info.title);
							internal_results.images.push(result_info.icon);
							
							if(i==xhr_return[1].length-1){
								internal_results.last.push(true);
							}else{
								internal_results.last.push(false);
							}
							*/
					}
				}

			}
			
			if(type_not_found){
				result_info	= {};
			}

			if(xhr_return != "error"){
				this.call_suggest(suggestions);
			}else{					
				
			}
		},
		
		request: function(plugin,pluginkey,query){
			
			this.plugin		= plugin;
			this.pluginkey	= pluginkey;
			this.query		= query;
			
			if(this.xhttpreq) this.xhttpreq.abort();
			if(query.length == 0) return;
			/*
				"q": {
					"content": "$1"
				},
				"ld": {
					"content": "$2"				
				},
				"ls": {
					"content": "$3"				
				},
				"fq": {
					"content": "$4"
				}			
			*/
			
      		this.ld = this._i18n('locale_domain');
      		this.ls = this._i18n('locale_short');
			this.fq = query.substr(0,1).toLowerCase();

			this.ll = this._i18n('locale_long'); // not in use by this time
			
			
			var url = chrome.i18n.getMessage(this.plugin+'_json',[this.query,this.ld,this.ls,this.fq]);
			
			var req = new XMLHttpRequest();
			req.open("GET", url, true);
			req.onreadystatechange = function() {
			if (req.readyState == 4) {
				  InstantFoxReq.callback(req.responseText);
				}
			}
			req.send(null);
			
			this.xhttpreq = req;		
		}
	}
	
	
			/*
			InstantFox_Comp.Wnd = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
			
			//*api return('query':query, 'key':parsed.key, 'json':json, 'gotourl':gotourl); OR false!
			var api = InstantFox_Comp.Wnd.InstantFox.query4comp();			
			var self = this
			InstantFox_Comp.processed_results = false;
			if(!api){
				//Search user's history
				this.historyAutoComplete = this.historyAutoComplete || 
					Components.classes["@mozilla.org/autocomplete/search;1?name=history"]
					.getService(Components.interfaces.nsIAutoCompleteSearch);				
				this.historyAutoComplete.startSearch(
					searchString, searchParam, previousResult, {
					onSearchResult: function(search, result){
						listener.onSearchResult(self, result);
					}
				});
				return
			}
			
			//searchString			= searchString.substr((api['key'].length+1),searchString.length); // key + space (+1) e.g. g = 2 chars				

						
			if(!api['json']){
				var newResult = new SimpleAutoCompleteResult(
					searchString, Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
						0, "", 
						internal_results
					);
				listener.onSearchResult(self, newResult);
				InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = true;
				return true;
			}

			var xhttpreq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
			xhttpreq.open("GET", api['json'], true); // must be asyncron (syncron slow down performance and lock querys / sometimes browser die)
			
			xhttpreq.addEventListener("load", function(event){
				var rtoparse = xhttpreq.responseText

				try{
					if('m,f'.indexOf(api['key'])!=-1){
						 rtoparse = rtoparse.replace(/(\w+):/gi, '"\$1":');
					}
					if(api['key']=='imdb'){
						 // from { to } other is invalid!
						 var sposp = rtoparse.indexOf('{');
						 var eposp = rtoparse.lastIndexOf('}');
						 rtoparse = rtoparse.substr(sposp,(eposp-(sposp-1))); // include last sign so -1
					}
					var xhr_return = JSON.parse(rtoparse);
					if(api['key']=='imdb' && xhr_return){
						InstantFox_Comp.imdb_lastres = xhr_return;
					}
				}
				catch(e){
					var xhr_return = 'error';
				}
				
				var tmp_results = new Array();
				var type_not_found = true;
								
				// code could be redcued but no need ;)
				if(api['key'] == 'imdb'){
					// last results must be "cashed" and saved in a var. If last query matches current query get last possible query
					if(api['query'].indexOf(api['lastquery']) == 0 && xhr_return == 'error' && api['lastquery']){
						xhr_return = InstantFox_Comp.imdb_lastres;
					}
					if(xhr_return['d']){
						type_not_found = false;
						
						var gotourl = api['gotourl'];
						
						for(var i=0; i <  xhr_return['d'].length; i++){
								var result_info	= {};
								var result		= xhr_return['d'][i]['l']; //sorted_results[j];
								
								var escapeurl 	= gotourl.replace('%q', escape(result));
									escapeurl	= escapeurl.replace(/%20/g, '+');
									
								if(i==0){
									InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = false;
									if(InstantFox_Comp.Wnd.InstantFox.current_shaddow !=  result){
										InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
										InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,api['query']);
										InstantFox_Comp.Wnd.InstantFox.HH._goto4comp(escapeurl);
									}
								}
								
								result_info.icon			= null;
								result_info.title			= result;
								result_info.url				= api['key'] + ' ' + result;;

								tmp_results.push(result_info);
								
								internal_results.values.push(result_info.url);
								internal_results.comments.push(result_info.title);
								internal_results.images.push(result_info.icon);
								
								if(i== xhr_return['d'].length-1){
									internal_results.last.push(true);
								}else{
									internal_results.last.push(false);
								}
						}
					}
					
				}
				
				if('m,f'.indexOf(api['key'])!=-1){
					if(xhr_return['suggestion']){
						type_not_found = false;
						
						var gotourl = api['gotourl'];
						
						for(var i=0; i <  xhr_return['suggestion'].length; i++){
								var result_info	= {};
								var result		= xhr_return['suggestion'][i]['query']; //sorted_results[j];
								
								if(i==0){
									InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = false;
									if(InstantFox_Comp.Wnd.InstantFox.current_shaddow !=  result){
										InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
										InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,api['query']);
										InstantFox_Comp.Wnd.InstantFox.HH._goto4comp(gotourl.replace('%q', encodeURIComponent(result)));
									}
								}
								
								result_info.icon			= null;
								result_info.title			= result;
								result_info.url				= api['key'] + ' ' + result;;

								tmp_results.push(result_info);
								
								internal_results.values.push(result_info.url);
								internal_results.comments.push(result_info.title);
								internal_results.images.push(result_info.icon);
								
								if(i== xhr_return['suggestion'].length-1){
									internal_results.last.push(true);
								}else{
									internal_results.last.push(false);
								}
						}
					}
					
				}
				if('g,i,y,w,a,b,e'.indexOf(api['key'])!=-1){
					if(xhr_return[1]){
						type_not_found = false;
						
						var gotourl = api['gotourl'];
						
						if(xhr_return[1].length == 0) InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = true;
						for(var i=0; i < xhr_return[1].length;i++){		
								var result_info	= {};
								var result		= xhr_return[1][i];

								if(i==0){
									InstantFox_Comp.Wnd.InstantFox.HH._url.seralw = false;
									if(InstantFox_Comp.Wnd.InstantFox.current_shaddow != result){
										InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
										InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,api['query']);
										InstantFox_Comp.Wnd.InstantFox.HH._goto4comp(gotourl.replace('%q', encodeURIComponent(result)));
									}
								}
								
								result_info.icon			= null;
								result_info.title			= result;
								result_info.url				= api['key'] + ' ' + result;;
																						
								tmp_results.push(result_info);
								
								internal_results.values.push(result_info.url);
								internal_results.comments.push(result_info.title);
								internal_results.images.push(result_info.icon);
								
								if(i==xhr_return[1].length-1){
									internal_results.last.push(true);
								}else{
									internal_results.last.push(false);
								}
						}
					}

				}
				
				if(type_not_found){
					result_info	= {};
				}

				if(xhr_return != "error"){
					var newResult = new SimpleAutoCompleteResult(
						searchString, Ci.nsIAutoCompleteResult.RESULT_SUCCESS,
						0, "", 
						internal_results
					);
				}else{					
					var newResult = new SimpleAutoCompleteResult(
						searchString, Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
						0, "", 
						internal_results
					);
				}
				listener.onSearchResult(self, newResult);
	
			}, false);
						
			xhttpreq.send(null);//InstantFox_Comp.xhttpreq.send(null);
			this._req = xhttpreq;
		},
		
		stopSearch: function(){
			if(this.historyAutoComplete) this.historyAutoComplete.stopSearch();
			if(this._req){
				//InstantFox_Comp.imdb_lastres = '';
			    this._req.abort();
			}

		},
		*/