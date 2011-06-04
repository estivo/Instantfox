const Ci = Components.interfaces;

const CLASS_ID = Components.ID("6224daa1-71a2-4d1a-ad90-01ca1c08e323");
const CLASS_NAME = "Simple AutoComplete";
const CONTRACT_ID = "@mozilla.org/autocomplete/search;1?name=simple-autocomplete";

// Implements nsIAutoCompleteResult
function SimpleAutoCompleteResult(searchString, searchResult,
                                  defaultIndex, errorDescription,
                                  results, comments) {
  this._searchString = searchString;
  this._searchResult = searchResult;
  this._defaultIndex = defaultIndex;
  this._errorDescription = errorDescription;
  this._results = results;
  this._comments = comments;
}

SimpleAutoCompleteResult.prototype = {
  _searchString: "",
  _searchResult: 0,
  _defaultIndex: 0,
  _errorDescription: "",
  _results: [],
  _comments: [],

  /**
   * The original search string
   */
  get searchString() {
    return this._searchString;
  },

  /**
   * The result code of this result object, either:
   *         RESULT_IGNORED   (invalid searchString)
   *         RESULT_FAILURE   (failure)
   *         RESULT_NOMATCH   (no matches found)
   *         RESULT_SUCCESS   (matches found)
   */
  get searchResult() {
    return this._searchResult;
  },

  /**
   * Index of the default item that should be entered if none is selected
   */
  get defaultIndex() {
    return this._defaultIndex;
  },

  /**
   * A string describing the cause of a search failure
   */
  get errorDescription() {
    return this._errorDescription;
  },

  /**
   * The number of matches
   */
  get matchCount() {
    return this._results.length;
  },

  /**
   * Get the value of the result at the given index
   */
  getValueAt: function(index) {
    return this._results[index];
  },

  /**
   * Get the comment of the result at the given index
   */
  getCommentAt: function(index) {
    return this._comments[index];
  },

  /**
   * Get the style hint for the result at the given index
   */
  getStyleAt: function(index) {
    if (!this._comments[index])
      return null;  // not a category label, so no special styling

    if (index == 0)
      return "suggestfirst";  // category label on first line of results

    return "suggesthint";   // category label on any other line of results
  },

  /**
   * Get the image for the result at the given index
   * The return value is expected to be an URI to the image to display
   */
  getImageAt : function (index) {
    return "";
  },

  getLabelAt: function(index) { return this._results[index]; },
  /**
   * Remove the value at the given index from the autocomplete results.
   * If removeFromDb is set to true, the value should be removed from
   * persistent storage as well.
   */
  removeValueAt: function(index, removeFromDb) {
    this._results.splice(index, 1);
    this._comments.splice(index, 1);
  },

  QueryInterface: function(aIID) {
    if (!aIID.equals(Ci.nsIAutoCompleteResult) && !aIID.equals(Ci.nsISupports))
        throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};


// Implements nsIAutoCompleteSearch
function SimpleAutoCompleteSearch() {
}

SimpleAutoCompleteSearch.prototype = {
  /*
   * Search for a given string and notify a listener (either synchronously
   * or asynchronously) of the result
   *
   * @param searchString - The string to search for
   * @param searchParam - An extra parameter
   * @param previousResult - A previous result to use for faster searchinig
   * @param listener - A listener to notify when the search is complete
   */
bou:function(){},
  startSearch: function(searchString, searchParam, result, listener) {
    // This autocomplete source assumes the developer attached a JSON string
    // to the the "autocompletesearchparam" attribute or "searchParam" property
    // of the <textbox> element. The JSON is converted into an array and used
    // as the source of match data. Any values that match the search string
    // are moved into temporary arrays and passed to the AutoCompleteResult
    if (searchParam.length > 0) {
      var nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
      var searchResults = nativeJSON.decode(searchParam);
      var results = [];
      var comments = [];
      for (i=0; i<searchResults.length; i++) {
        if (searchResults[i].value.indexOf(searchString) == 0) {
          results.push(searchResults[i].value);
          if (searchResults[i].comment)
            comments.push(searchResults[i].comment);
          else
            comments.push(null);
        }
      }
      var newResult = new SimpleAutoCompleteResult(searchString, Ci.nsIAutoCompleteResult.RESULT_SUCCESS, 0, "", results, comments);
     // listener.onSearchResult(this, newResult);
    }
dump(searchString, searchParam, result, listener)
			this.historyAutoComplete =
Cc["@mozilla.org/autocomplete/search;1?name=history"].createInstance(Ci.nsIAutoCompleteSearch);
me=this
			this.historyAutoComplete.startSearch(searchString, searchParam, result, {
QueryInterface: function(iid) {
    if(iid === Ci.nsIAutoCompleteObserver
       || iid === Ci.nsISupports) {
      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
onSearchResult:
function(a,result){gbrj=result
dump(a,listener)
listener.onSearchResult(me, result);
}

});

  },

  /*
   * Stop an asynchronous search that is in progress
   */
  stopSearch: function() {
this.historyAutoComplete.stopSearch()
  },
    
  QueryInterface: function(aIID) {
    if (!aIID.equals(Ci.nsIAutoCompleteSearch) && !aIID.equals(Ci.nsISupports))
        throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

// Factory
var SimpleAutoCompleteSearchFactory = {
  singleton: null,
  createInstance: function (aOuter, aIID) {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    if (this.singleton == null)
      this.singleton = new SimpleAutoCompleteSearch();
    return this.singleton.QueryInterface(aIID);
  }
};

// Module
var SimpleAutoCompleteSearchModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  simpleUnregisterSelf: function() {
    var reg=Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
    try{
		reg.unregisterFactory(
			reg.contractIDToCID(CONTRACT_ID),
			reg.getClassObjectByContractID(CONTRACT_ID, Ci.nsISupports)
		)
		return true
	}catch(e){return false}    
  },
  
  simpleRegisterSelf: function() {this.simpleUnregisterSelf()
    var reg=Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
    reg.registerFactory(CLASS_ID, CLASS_NAME, CONTRACT_ID, SimpleAutoCompleteSearchFactory);
    
  },
  
  getClassObject: function(aCompMgr, aCID, aIID) {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return SimpleAutoCompleteSearchFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

// Module initialization
function NSGetModule(aCompMgr, aFileSpec) { return SimpleAutoCompleteSearchModule; }



function NSGetFactory(cid) {
  if (cid.toString().toUpperCase() != CLASS_ID.toString().toUpperCase()) {
    throw Components.results.NS_ERROR_FACTORY_NOT_REGISTERED;
  }

  return SimpleAutoCompleteSearch;
}

SimpleAutoCompleteSearchModule.simpleRegisterSelf()


Cc[CONTRACT_ID].createInstance().QueryInterface(Ci.nsIAutoCompleteSearch)
Cc[CONTRACT_ID].createInstance().QueryInterface(Ci.nsIAutoCompleteSearch)



<textbox id="text1" type="autocomplete" 
autocompletesearch="simple-autocomplete" 
showcommentcolumn="true" 
autocompletepopup="richPopup"

 autocompletesearchparam="[{&#34;value&#34;:&#34;mark&#34;,&#34;comment&#34;:&#34;cool dude&#34;},{&#34;value&#34;:&#34;mary&#34;,&#34;comment&#34;:&#34;nice lady&#34;},{&#34;value&#34;:&#34;jimmy&#34;,&#34;comment&#34;:&#34;very uncool guy&#34;},{&#34;value&#34;:&#34;jimbo&#34;,&#34;comment&#34;:null}]" />
  
  <textbox id="text1" type="autocomplete" autocompletesearch="simple-autocomplete" showcommentcolumn="true"
         autocompletesearchparam='[{"value":"mark","comment":"cool dude"},{"value":"mary","comment":"nice lady"},{"value":"jimmy","comment":"very uncool guy"},{"value":"jimbo","comment":null}]' />
  
 <textbox id="text1" type="autocomplete" autocompletesearch="history" showcommentcolumn="true"
         autocompletesearchparam='[{"value":"mark","comment":"cool dude"},{"value":"mary","comment":"nice lady"},{"value":"jimmy","comment":"very uncool guy"},{"value":"jimbo","comment":null}]' />
