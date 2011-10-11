document.querySelector("[currentset*=url]").getAttribute("currentset")

options={
    "id":"url",
    "image":"https://github.com/favicon.ico",
    label:"label"
}
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