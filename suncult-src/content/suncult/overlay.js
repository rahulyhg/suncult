var suncult = {
	_prefLatitude: "extensions.suncult.latitude",
	_prefLatitudeNorthSouth: "extensions.suncult.latitudeNorthSouth",
	_prefLongitude: "extensions.suncult.longitude",
	_prefLongitudeEastWest: "extensions.suncult.longitudeEastWest",
	_prefTimezone: "extensions.suncult.timezone",
	_prefTimeFormat: "extensions.suncult.timeformat",
	
	_twilightStart: null,
	_sunrise: null,
	_sunset: null,
	_twilightEnd: null,
	_moonPhaseImg: null,
	_moonImg: null,
	_moonPhase: null,

	_moonPhase: null,
	_latitude: null,
	_longitude: null,
  _timezone: null,
  _timeFormat: null,
  
  _prefs: null,
	
  init: function() {
//		dump("in suncult.init\n");
	  this._prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		this._twilightStart = document.getElementById("suncult-twilight-start");
		this._sunrise = document.getElementById("suncult-sunrise");
		this._sunset = document.getElementById("suncult-sunset");
		this._twilightEnd = document.getElementById("suncult-twilight-end");
		this._moonPhaseImg = document.getElementById("suncult-status-icon-moon");
		this._moonImg = document.getElementById("suncult-moon");
		this._moonPhase = document.getElementById("suncult-moonphase");
		this.readPreferences();
		if (this._latitude == null || this._longitude == null) {
			this.showConfig();
			}
	  this.updateMoon();
    this.initialized = true;
//		dump("leaving suncult.init\n");
  },
	
	readPreferences: function() {
	  var prefs = this._prefs;
  	
    try {
 	    this._latitude = prefs.getCharPref(this._prefLatitude);
   	}	catch(ex) {
//      dump(ex + "\n");
    } finally {
//      dump("latitude: " + this._latitude + "\n");
    }
  		
    try {
 	    this._longitude = prefs.getCharPref(this._prefLongitude);
   	}	catch(ex) {
//      dump(ex + "\n");
    } finally {
//      dump("longitude: " + this._longitude + "\n");
    }

    try {
 	    this._timezone = prefs.getCharPref(this._prefTimezone);
   	}	catch(ex) {
//      dump(ex + "\n");
    } finally {
  	  if (this._timezone == null || this._timezone == "") {
  	    this._timezone = new Date().getTimezoneOffset();
//  	    dump("default ");
  	  }
//  	  dump("timezone: " + this._timezone + "\n");
    }

    try {
 	    this._timeFormat = prefs.getCharPref(this._prefTimeFormat);
   	}	catch(ex) {
//      dump(ex + "\n");
    } finally {
  	  if (this._timeFormat != 'h24' && this._timeFormat != "ampm") {
  	    this._timeFormat = 'h24';
//  	    dump("default ");
  	  }
//  	  dump("timeformat: " + this._timeFormat + "\n");
    }
	},

  showConfig: function() {
    window.open("chrome://suncult/content/config.xul", "", "chrome,centerscreen");
  },
  
  onPopupShowing: function(popup) {
/*    dump("lat: " + this._latitude + "\n");
    dump("long: " + this._longitude + "\n");
    dump("timezone: " + this._timezone + "\n");
    dump("timeformat: " + this._timeFormat + "\n"); */
    var today = new Date();
  	result = suncultCalc.formValues(parseFloat(this._latitude),parseFloat(this._longitude), today, this._timezone, this._timeFormat);
		this._twilightStart.value = result[0];
		this._twilightEnd.value = result[1];
		this._sunrise.value = result[2];
		this._sunset.value = result[3];
		var phase = this.getMoonPhasePercent(today);
		this._moonPhase.value = Math.floor(phase) + "%";
		this._moonImg.src = this.getMoonImageSrc(today, 64);
  	},
  	
  getMoonPhase: function(xdate) {
			thePhase = Math.floor(this.getMoonPhasePercent(xdate) * .279);
			return (this._latitude < 0) ? 27 - thePhase : thePhase;
  },
  
  getMoonPhasePercent: function(xdate) {
			return suncultCalc.moonPhasePercent(xdate);
  },

  getMoonImageSrc: function(xdate, size) {
    var phase = this.getMoonPhase(xdate);
    var dir = "chrome://suncult/content/images/";
    var base = "moon";
    var delim = "_";
    var ext = ".png";
    return dir + base + delim + phase + delim + size + ext;
  },

  updateMoon: function() {
    var imgsrc = this.getMoonImageSrc(new Date(), 20);
    this._moonPhaseImg.src = imgsrc;
  }
};

window.addEventListener("load", function(e) { suncult.init(e); }, false); 
