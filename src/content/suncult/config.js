"use strict";
var suncultConfig = {
  _stringBundle: null,
  _latitude: null,
  _longitude: null,
  _latitudeEdit: null,
  _longitudeEdit: null,
  _positionMax: null,
  _errors: null,
  
  init: function() {
      // initialization code
      // dump("suncultConfig.init\n");
      this._errors = new Array();
      this._stringBundle = document.getElementById("string-bundle");
      this.initialized = true;
      this._latitude = document.getElementById("pref-latitude");
      this._longitude = document.getElementById("pref-longitude");
      this._latitudeEdit = document.getElementById("latitude-edit");
      this._longitudeEdit = document.getElementById("longitude-edit");
      this._latitudeEdit.value = this.formatValue(this._latitude.value, "N", "S");
      this._longitudeEdit.value = this.formatValue(this._longitude.value, "E", "W");
      this.populateBars();
      this.populatePositions();
      this.onSun();
      this.onMoon();
  },

  onDialogAccept: function(event) {
    Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService)
            .notifyObservers(null, "SunCult:Configuration", null);
  },

  onDialogCancel: function(event) {
    // Since 'instantApply' may be active: 
    //  there can be changed configuration values, but only a 'cancel/close' button available
    // Ensure all our parts get notification on closure too
    Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService)
            .notifyObservers(null, "SunCult:Configuration", null);
  },
  
  onSelectCity: function(event) {
//    dump("suncultConfig.onSelectCity\n");
    var tree = event.target;

    if (!tree.view.isContainer(tree.currentIndex)) {
      var latcol = tree.columns ? tree.columns['latitude-column'] : 'latitude-column';
      var longcol = tree.columns ? tree.columns['longitude-column'] : 'longitude-column';

      var lat = tree.view.getCellText(tree.currentIndex, latcol);
      var lon = tree.view.getCellText(tree.currentIndex, longcol);

      this._latitudeEdit.value = lat;
      this.oninputLatitude(event);

      this._longitudeEdit.value = lon;
      this.oninputLongitude(event);
    }
  },

  oninputLatitude: function(event) {
//    dump("suncultConfig.oninputLatitude\n");
    var v = new String(this._latitudeEdit.value);
    var r = null;

    if (v.match(/^\s*-?\d*([.,]\d*)?\s*$/)) {  //-50.30
      r = parseFloat(v);
    }

    var m = v.match(/^\s*(\d+)([NS])\s*(\d*)\s*$/i)
    if (m) { //49n20
      r = parseFloat(m[1]) + (m[3] != "" ? parseFloat(m[3]) / 60 : 0);
      if (m[2] == 's' || m[2] == 'S') {
        r = -r;
      }
    }

    var m = v.match(/^\s*(\d+)\D*(\d*)\D*(\d*([.,]\d*)?)\D*([NS])\s*$/i);
    if (m) { //13°N, 13° 19'N and 13°19'43"N
      r = parseFloat(m[1]) + (m[2] != "" ? parseFloat(m[2]) / 60 : 0) + (m[3] != "" ? parseFloat(m[3]) / 60 / 60 : 0);
      if (m[5] == 's' || m[5] == 'S') {
        r = -r;
      }
    }

    if (this.validate(r, -90, 90)) {
      this._latitude.value = r;
    }
  },

  oninputLongitude: function(event) {
//    dump("suncultConfig.oninputLongitude\n");
    var v = this._longitudeEdit.value;
    var r = null;

    if (v.match(/^\s*-?\d*([.,]\d*)?\s*$/)) {  //-50.30
      r = parseFloat(v);
    }

    var m = v.match(/^\s*(\d+)([WE])\s*(\d*)\s*$/i)
    if (m) { //49w20
      r = parseFloat(m[1]) + (m[3] != "" ? parseFloat(m[3]) / 60 : 0);
      if (m[2] == 'W' || m[2] == 'w') {
        r = -r;
      }
    }

    var m = v.match(/^\s*(\d+)\D*(\d*)\D*(\d*([.,]\d*)?)\D*([WE])\s*$/i);
    if (m) { //13°E, 13° 19'W and 13°19'43"W
      r = parseFloat(m[1]) + (m[2] != "" ? parseFloat(m[2]) / 60 : 0) + (m[3] != "" ? parseFloat(m[3]) / 60 / 60 : 0);
      if (m[5] == 'W' || m[5] == 'w') {
        r = -r;
      }
    }

    if (this.validate(r, -180, 180)) {
      this._longitude.value = r;
    }
  },

  validate: function(v, min, max) {
    var r = v != null && v >= min && v <= max;
    if (document.documentElement.getButton)
      document.documentElement.getButton("accept").disabled = !r;
    return r;
  },

  formatValue: function(value, positive, negative) {
    var absValue = value <0 ? -value : value;
    var result = Math.floor(absValue);
    result += value < 0 ? negative : positive;
    var min = Math.floor( absValue * 60 % 60);
    result += min > 0 ? min : "";
    return result;
  },

  getWindow: function() {
		   var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
//		   var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
		   var top = wm.getMostRecentWindow("navigator:browser");
       if (top) {
         return top;
         }
      
       top = wm.getMostRecentWindow("mail:3pane");
       return top;
  },
    
  concat: function(c1, c2) {
      // Concats too collections into an array.
      var c3 = new Array(c1.length + c2.length);
      var x,y = 0;

      for (x = 0; x < c1.length; x++)
	  c3[y++] = c1[x];

      for (x = 0; x < c2.length; x++)
	  c3[y++] = c2[x];

      return c3;
  },

  populateBars: function() {
    // Creates the menuitems for the toolbar selector.
    var win = this.getWindow();
    var toolbars = win.document.getElementsByTagName("toolbar");
    var statusbars = win.document.getElementsByTagName("statusbar");
    var menubars = win.document.getElementsByTagName("menubar");
    var popup = document.getElementById("suncult-popup-bars");
    
    // first remove the toolbars already there...
    while (popup.hasChildNodes())
      popup.removeChild(popup.firstChild);
          
    toolbars = this.concat(toolbars, statusbars);
    toolbars = this.concat(toolbars, menubars);
    for (var x=0; x<toolbars.length; x++) {
      var bar = toolbars[x];
      
      //do not include find toolbar
      if (bar.getAttribute("id") == "FindToolbar")
        continue;
             
      var item = document.createElement("menuitem");
      item.setAttribute("id", bar.getAttribute("id"));
      item.setAttribute("value", bar.getAttribute("id"));
      item.value = bar.getAttribute("id");         
      if (bar.hasAttribute("toolbarname"))
        item.setAttribute("label", bar.getAttribute("toolbarname"));
      else
        item.setAttribute("label", bar.getAttribute("id"));                 
      popup.appendChild(item);
    }
    
    this.setElement("suncult-list-bars", "pref-bar", "Char", "suncult-popup-bars");    
  },
  
  populatePositions: function() {
    var selitem = document.getElementById("suncult-list-bars").selectedItem;
    var barid = selitem ? selitem.getAttribute("value") : null;
    var win = this.getWindow();
    var bar = win.document.getElementById(barid);

    if (!bar)
      this._positionMax = 0;
    else {
      var len = bar.childNodes.length;
    
      //don't include ourself in count
      if (win.document.getElementById("suncult-box") && win.document.getElementById("suncult-box").parentNode == bar)
        len--;
    
      this._positionMax = len;
        
    }

    var val = document.getElementById("pref-bar-position").value;
    var val2 = document.getElementById("pref-bar").value;
    var text = document.getElementById("suncult-text-position");
    var radio = document.getElementsByAttribute("group", "position");
    var group = document.getElementById("suncult-group-position");
    var x, el;
    
    //set max value
    text.value = this._positionMax;
    
    //mark always last
    if (val == -1) {
      for (x=0; x < radio.length; x++) {
        if (parseInt(radio[x].value) == val) {
          group.selectedItem = radio[x];
          break;
        }
      }
    }
    
    //mark specific position
    else {
      for (x=0; x < radio.length; x++) {
        if (parseInt(radio[x].value) != -1) {
          group.selectedItem = radio[x];
          break;
        }
      }    
      if (barid != val2) {
        text.value = this._positionMax;
      } else {
        if (val < 0)
          text.value = this._positionMax;
        else if (val > this._positionMax)
          text.value = 0;
        else
          text.value = val; 
      }
    }
    
    // update the error label
    el = document.getElementById("suncult-text-position-valid");
    el.setAttribute("value", "0 - "+this._positionMax);
    
    //revalidate position
    suncultConfig.validatePos();
  },
    
  setElement: function(aName, aPref, aType, aGroup){
    var x, el, els, val;
    
    el = document.getElementById(aName);
    val = document.getElementById(aPref).value;
    switch (el.localName) {
      case "checkbox":
        el.checked = val;
        break;
      case "textbox":
        el.value = val;
        break;
      case "menulist":
        els = document.getElementById(aGroup).childNodes;        
        for (x=0; x < els.length; x++) {
          if (((aType == "Int") ? parseInt(els[x].value) : els[x].value) == val) {
            el.selectedItem = els[x];
            break;
          }
        }      
        break;            
      case "radiogroup":
        els = document.getElementsByAttribute("group", aGroup);        
        for (x=0; x < els.length; x++) {
          if (((aType == "Int") ? parseInt(els[x].value) : els[x].value) == val) {
            el.selectedItem = els[x];
            break;
          }
        }      
        break;
    }  
  },
  
  validatePos: function() {
    var pref = document.getElementById("pref-bar-position");
    var position = document.getElementById("suncult-group-position");
    var r;
    if (parseInt(position.selectedItem.value) == -1) {
      pref.value = -1;
      r = true;
    } else {
      var v = pref.value = parseInt(document.getElementById("suncult-text-position").value); 
      r = v != null && v >= 0 && v <= this._positionMax;
    }
    if (document.documentElement.getButton)
      document.documentElement.getButton("accept").disabled = !r;
    document.getElementById("suncult-text-position-valid").hidden = r;
    return r;
  },
  
  onSun: function() {
    var value = document.getElementById("pref-sun").value;
    var grid = document.getElementById("sun-grid");
    this._disableCheckboxes(grid, !value);
  },
    
  onMoon: function() {
    var value = document.getElementById("pref-moon").value;
    var grid = document.getElementById("moon-grid");
    this._disableCheckboxes(grid, !value);
  },
  
  _disableCheckboxes: function(grid, value) {
//    dump(value);
    var x=grid.getElementsByTagName("checkbox");
    for (var i=0; i<x.length;i++) {
      x[i].disabled = value;
    }
  } 
};

window.addEventListener("load", function(e) { suncultConfig.init(e); }, false);
