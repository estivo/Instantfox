/*
	InstantFoxComp Depends on:
	(https://developer.mozilla.org/en/XPCOMUtils.jsm)
	https://developer.mozilla.org/en/How_to_implement_custom_autocomplete_search_component
	Firefox 4 handling
*/

var Cc	= Components.classes;
var Ci	= Components.interfaces;


	
	var InstantFox_Comp = {
		processed_results:false,
		Wnd:'',
		Cc:Components.classes,
		Ci:Components.interfaces,
	    Cr:Components.results,
		Cu:Components.utils,		
		
		xhttpreq:false
		
	}
	InstantFox_Comp.Cu.import("resource://gre/modules/XPCOMUtils.jsm");
	
	
	function SearchAutoCompleteResult(result, search_result, maxNumResults){
		if(InstantFox_Comp.processed_results){return;}
				
		this._result		= result;
		this._search_result	= search_result;
		this._maxNumResults	= maxNumResults;
	};
	
	SearchAutoCompleteResult.prototype = {	
		get searchString(){
			try{
				return this._result.searchString;
			}
			catch(e){
				return "";
			}
		},
		
		get searchResult(){
			try{
				switch(this._result.searchResult){
					case InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_NOMATCH:
						if(this._search_result.values == null)				return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_NOMATCH_ONGOING;
						else if(this._search_result.values.length > 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS;
						else if(this._search_result.values.length == 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_NOMATCH;
						break;
					case InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS:
						if(this._search_result.values == null)				return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS_ONGOING;
						else if(this._search_result.values.length > 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS;
						else if(this._search_result.values.length == 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS;
						break;
					case InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_NOMATCH_ONGOING:
						if(this._search_result.values == null)				return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_NOMATCH_ONGOING;
						else if(this._search_result.values.length > 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS_ONGOING;
						else if(this._search_result.values.length == 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_NOMATCH_ONGOING;
						break;
					case InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS_ONGOING:
						if(this._search_result.values == null)				return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS_ONGOING;
						else if(this._search_result.values.length > 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS_ONGOING;
						else if(this._search_result.values.length == 0)		return InstantFox_Comp.Ci.nsIAutoCompleteResult.RESULT_SUCCESS_ONGOING;
						break;
					default:
						return this._result.searchResult;
				}
			}
			catch(e){}
		},
		
		get defaultIndex(){
			if(this._result.defaultIndex == -1 && this._search_result.values != null && this._search_result.values.length > 0){
				return 0;
			}
			return this._result.defaultIndex;
		},
		
		get errorDescription(){
			return this._result.errorDescription;
		},
		
		get matchCount(){
			try{
				var numResults = Math.min(this._result.matchCount, this._maxNumResults);
				if(this._search_result.values != null){
					numResults += this._search_result.values.length;
				}
				return numResults;
			}
			catch(e){
				return 0;
			}
		},
		
		getValueAt: function(index){//#1
			try{
				var numResults = Math.min(this._result.matchCount, this._maxNumResults);
				if(index < numResults){
					return this._result.getValueAt(index);
				}
				else{
					//Hack because of duplicate array printing
					if(this._search_result.last[index - numResults]){
						InstantFox_Comp.processed_results = true;
					}
					return this._search_result.values[index - numResults];
				}
			}
			catch(e){
				return "";
			}
		},
		
		getCommentAt: function(index){//#3
			try{
				var numResults = Math.min(this._result.matchCount, this._maxNumResults);
				if(index < numResults){
					return this._result.getCommentAt(index);
				}
				else{
					return this._search_result.comments[index - numResults];
				}
			}
			catch(e){
				return "";
			}
		},
		
		getStyleAt: function(index){//#4
			try{
				var numResults = Math.min(this._result.matchCount, this._maxNumResults);
				if(index < numResults){
					return this._result.getStyleAt(index);
				}
				else{
					return "InstantFoxSuggest";
				}
			}
			catch(e){
				return "InstantFoxSuggest";
			}
		},
		
		getImageAt: function(index){//#2
			debug(index)
			try{
				var numResults = Math.min(this._result.matchCount, this._maxNumResults);
				if(index < numResults){
					return this._result.getImageAt(index);
				}
				else{
					return this._search_result.images[index - numResults];
				}
			}
			catch(e){
				return "";
			}
		},
		
		getLabelAt: function(index) {// Added FF4
			/*
			try{
				return "tet";//this._search_result.value[index];
			}
			catch(e){
				return "";
			}
			*/
			try{
				var numResults = Math.min(this._result.matchCount, this._maxNumResults);
				if(index < numResults){
					return this._result.getValueAt(index);
				}
				else{
					//Hack because of duplicate array printing
					if(this._search_result.last[index - numResults]){
						InstantFox_Comp.processed_results = true;
					}
					return this._search_result.values[index - numResults];
				}
			}
			catch(e){
				return "";
			}
		},
		
		removeValueAt: function(index, removeFromDb){
			try{
				var numResults = Math.min(this._result.matchCount, this._maxNumResults);
				if(index < numResults){
					return this._result.removeValueAt(index, removeFromDb);
				}
				else{
					this._search_result.values.splice(index - numResults, 1);
					this._search_result.comments.splice(index - numResults, 1);
					this._search_result.images.splice(index - numResults, 1);
				}
			}
			catch(e){}
			
		},
		
		
		QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIAutoCompleteResult]),
	};

	function InstantFoxSearch(){}
	InstantFoxSearch.prototype = {
		classDescription: "Autocomplete 4 InstantFox",
		historyAutoComplete: null,
		classID:          Components.ID("c541b971-0729-4f5d-a5c4-1f4dadef365e"),
		contractID:       "@mozilla.org/autocomplete/search;1?name=instantFoxAutoComplete",
		QueryInterface:   XPCOMUtils.generateQI([Components.interfaces.nsIAutoCompleteSearch]),
		startSearch:      function(searchString, searchParam, previousResult, listener)
		{
			InstantFox_Comp.Wnd = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
			
			/**api return('query':query, 'key':parsed.key, 'json':json, 'gotourl':gotourl); OR false!**/
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
			
			var _search						= this;
			_search._result					= null;
			var internal_results			= {values: [], comments: [], images: [], last: []};
			
			if(InstantFox_Comp.Wnd.HH._url.abort){
				this.historyAutoComplete&&this.historyAutoComplete.stopSearch();
				var newResult = new SimpleAutoCompleteResult(
					searchString, Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
						0, "", 
						internal_results
					);
				listener.onSearchResult(self, newResult);
				return false;
			}

			//searchString			= searchString.substr((api['key'].length+1),searchString.length); // key + space (+1) e.g. g = 2 chars				

						
			if(!api['json']){
				var newResult = new SimpleAutoCompleteResult(
					searchString, Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
						0, "", 
						internal_results
					);
				listener.onSearchResult(self, newResult);
				InstantFox_Comp.Wnd.HH._url.seralw = true;
				return true;
			}

			var xhttpreq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
			xhttpreq.open("GET", api['json'], true); // must be asyncron (syncron slow down performance and lock querys / sometimes browser die)
			
			xhttpreq.addEventListener("load", function(event){
				var rtoparse = xhttpreq.responseText

				try{
					var xhr_return = JSON.parse(rtoparse);
				}
				catch(e){
					var xhr_return = 'error';
				}
				
				
				var tmp_results = new Array();
				var type_not_found = true;
								
				// code could be redcued but no need ;)
							
				if(api['key'] == "m"){

					if(xhr_return[2]){
						type_not_found = false;
						
						var gotourl = api['gotourl'];
						
						for(var i=0; i < xhr_return[3].length;i++){		
								var result_info	= {};
								var result		= xhr_return[3][i];
								
								if(i==0){
									InstantFox_Comp.Wnd.HH._url.seralw = false;
									if(InstantFox_Comp.Wnd.InstantFox.current_shaddow !=  result){
										InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
										InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,api['query']);
										InstantFox_Comp.Wnd.HH._goto4comp(gotourl.replace('%q', encodeURIComponent(result)));
									}
								}
								
								result_info.icon			= null;
								result_info.title			= result;
								result_info.url				= api['key'] + ' ' + result;;

								tmp_results.push(result_info);
								
								internal_results.values.push(result_info.url);
								internal_results.comments.push(result_info.title);
								internal_results.images.push(result_info.icon);
								
								if(i==xhr_return[3].length-1){
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
						
						if(xhr_return[1].length == 0) InstantFox_Comp.Wnd.HH._url.seralw = true;
						for(var i=0; i < xhr_return[1].length;i++){		
								var result_info	= {};
								var result		= xhr_return[1][i];

								if(i==0){
									InstantFox_Comp.Wnd.HH._url.seralw = false;
									if(InstantFox_Comp.Wnd.InstantFox.current_shaddow != result){
										InstantFox_Comp.Wnd.InstantFox.current_shaddow = result;
										InstantFox_Comp.Wnd.XULBrowserWindow.InsertShaddowLink(result,api['query']);
										InstantFox_Comp.Wnd.HH._goto4comp(gotourl.replace('%q', encodeURIComponent(result)));
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
			    this._req.abort();
			}

		},
	};
	
	if (XPCOMUtils.generateNSGetFactory)
	    var NSGetFactory = XPCOMUtils.generateNSGetFactory([InstantFoxSearch]);
	else
	    var NSGetModule = XPCOMUtils.generateNSGetModule([InstantFoxSearch]);
	
	/*
	function NSGetModule(compMgr, fileSpec){
		return XPCOMUtils.generateModule([InstantFoxSearch]);
	}
	*/

function SimpleAutoCompleteResult(searchString, searchResult,
                                  defaultIndex, errorDescription, list,
                                  results, comments) {
  this._searchString = searchString;
  this._searchResult = searchResult;
  this._defaultIndex = defaultIndex;
  this._errorDescription = errorDescription;
  this._results = results;
  this._comments = comments;
  this.list = list;
}

SimpleAutoCompleteResult.prototype = {
	/**
	 * The result code of this result object, either:
	 *         RESULT_IGNORED   (invalid searchString)
	 *         RESULT_FAILURE   (failure)
	 *         RESULT_NOMATCH   (no matches found)
	 *         RESULT_SUCCESS   (matches found)
	 */
	_searchResult: 0,
	_searchString: "",
	_defaultIndex: 0,
	_errorDescription: "",
	list: {values: [], comments: [], images: [], last: []},  

	
	get searchResult() this._searchResult,
	get searchString() this._searchString,
	get defaultIndex() this._defaultIndex,
	get errorDescription() this._errorDescription,
	get matchCount() this.list.values.length,

	getValueAt: function(index) { return this.list.values[index];},
	getCommentAt: function(index) { return this.list.comments[index];},
	getImageAt: function(index) { return this.list.images[index];},
	getLabelAt: function(index) { return this.list.comments[index]; },
	getStyleAt: function(index) { return "InstantFoxSuggest"},
	
	removeValueAt: function(index, removeFromDb) {
		this.list.values.splice(index, 1);		
	},
	QueryInterface: function(aIID) {
		if (!aIID.equals(Ci.nsIAutoCompleteResult) && !aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
