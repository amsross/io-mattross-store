/*global $, moment*/
'use strict';

// Modified http://paulirish.com/2009/markup-based-unobtrusive-comprehensive-dom-ready-execution/
// Only fires on body class

var io_mattross_store = {
	// All pages
	common: {
		init: function() {},
		finalize: function() {}
	},
	index: {
		init: function() {}
	}
};

var UTIL = {
	fire: function(func, funcname, args) {
		var namespace = io_mattross_store;
		funcname = (funcname === undefined) ? 'init' : funcname;
		if (func !== '' && namespace[func] && typeof namespace[func][funcname] === 'function') {
			namespace[func][funcname](args);
		}
	},
	loadEvents: function() {

		UTIL.fire('common');

		$.each(document.body.className.replace(/-/g, '_').split(/\s+/),function(i,classnm) {
			UTIL.fire(classnm);
		});

		UTIL.fire('common', 'finalize');
	}
};

$(document).ready(UTIL.loadEvents);
