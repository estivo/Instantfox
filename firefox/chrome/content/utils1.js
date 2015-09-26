document.querySelector("[currentset*=url]").getAttribute("currentset")

options={
    "id":"url",
    "image":"https://github.com/favicon.ico",
    label:"label"
}

var id
var selector = "[currentset^='"+id+",'],[currentset*=',"+id+",'],[currentset$=',"+id+"']"
document.querySelector(selector)


.getAttribute("currentset")

doc=document
    function $(id) doc.getElementById(id);
      function xul(type) doc.createElement(type);

      // create toolbar button
      let tbb = xul("toolbarbutton");
      tbb.setAttribute("id", options.id);
      tbb.setAttribute("type", "button");
      if (options.image) tbb.setAttribute("image", options.image);
      tbb.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
      tbb.setAttribute("label", options.label);
      tbb.addEventListener("command", function() {
        if (options.onCommand)
          options.onCommand({}); // TODO: provide something?

        if (options.panel) {
          options.panel.show(tbb);
        }
      }, true);

      // add toolbarbutton to palette
      ($("navigator-toolbox") || $("mail-toolbox")).palette.appendChild(tbb);
	  
	  
	  
const {unload} = require("unload+");
const {listen} = require("listen");
const winUtils = require("window-utils");

exports.ToolbarButton = function ToolbarButton(options) {
  var unloaders = [],
      toolbarID = "",
      insertbefore = "",
      destroyed = false,
      destoryFuncs = [];

  var delegate = {
    onTrack: function (window) {
      if ("chrome://browser/content/browser.xul" != window.location || destroyed)
        return;

      let doc = window.document;
      let $ = function(id) { return doc.getElementById(id) };

      // create toolbar button
      let tbb = doc.createElementNS(NS_XUL, "toolbarbutton");
      tbb.setAttribute("id", options.id);
      tbb.setAttribute("type", "button");
      if (options.image) tbb.setAttribute("image", options.image);
      tbb.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
      tbb.setAttribute("label", options.label);
      tbb.addEventListener("command", function() {
        if (options.onCommand)
          options.onCommand({}); // TODO: provide something?

        if (options.panel) {
          options.panel.show(tbb);
        }
      }, true);

      // add toolbarbutton to palette
      ($("navigator-toolbox") || $("mail-toolbox")).palette.appendChild(tbb);

      // find a toolbar to insert the toolbarbutton into
      if (toolbarID) {
        var tb = $(toolbarID);
      }
      if (!tb) {
        var tb = toolbarbuttonExists(doc, options.id);
      }

      // found a toolbar to use?
      if (tb) {
        let b4;

        // find the toolbarbutton to insert before
        if (insertbefore) {
          b4 = $(insertbefore);
        }
        if (!b4) {
          let currentset = tb.getAttribute("currentset").split(",");
          let i = currentset.indexOf(options.id) + 1;

          // was the toolbarbutton id found in the curent set?
          if (i > 0) {
            let len = currentset.length;
            // find a toolbarbutton to the right which actually exists
            for (; i < len; i++) {
              b4 = $(currentset[i]);
              if (b4) break;
            }
          }
        }

        tb.insertItem(options.id, b4, null, false);
      }

      var saveTBNodeInfo = function(e) {
        toolbarID = tbb.parentNode.getAttribute("id") || "";
        insertbefore = (tbb.nextSibling || "")
            && tbb.nextSibling.getAttribute("id").replace(/^wrapper-/i, "");
      };

      window.addEventListener("aftercustomization", saveTBNodeInfo, false);

      // add unloader to unload+'s queue
      var unloadFunc = function() {
        tbb.parentNode.removeChild(tbb);
        window.removeEventListener("aftercustomization", saveTBNodeInfo, false);
      };
      var index = destoryFuncs.push(unloadFunc) - 1;
      listen(window, window, "unload", function() {
        destoryFuncs[index] = null;
      }, false);
      unloaders.push(unload(unloadFunc, window));
    },
    onUntrack: function (window) {}
  };
  var tracker = winUtils.WindowTracker(delegate);

  return {
    destroy: function() {
      if (destroyed) return;
      destroyed = true;

      if (options.panel)
        options.panel.destroy();

      // run unload functions
      destoryFuncs.forEach(function(f) { f && f() });
      destoryFuncs.length = 0;

      // remove unload functions from unload+'s queue
      unloaders.forEach(function(f) { f() });
      unloaders.length = 0;
    },
    moveTo: function(pos) {
      if (destroyed) return;

      // record the new position for future windows
      toolbarID = pos.toolbarID;
      insertbefore = pos.insertbefore;

      // change the current position for open windows
      for each (var window in winUtils.windowIterator()) {
        if ("chrome://browser/content/browser.xul" != window.location) return;

        let doc = window.document;
        let $ = function (id) { return doc.getElementById(id) };

        // if the move isn't being forced and it is already in the window, abort
        if (!pos.forceMove && $(options.id)) return;

        var tb = $(toolbarID);
        var b4 = $(insertbefore);

        // TODO: if b4 dne, but insertbefore is in currentset, then find toolbar to right

        if (tb) tb.insertItem(options.id, b4, null, false);
      };
    }
  };
};

function toolbarbuttonExists(doc, id) {
  var toolbars = doc.getElementsByTagNameNS(NS_XUL, "toolbar");
  for (var i = toolbars.length - 1; ~i; i--) {
    if ((new RegExp("(?:^|,)" + id + "(?:,|$)")).test(toolbars[i].getAttribute("currentset")))
      return toolbars[i];
  }
  return false;
}