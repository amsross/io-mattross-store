/*global $, _, moment*/
'use strict';

// Modified http://paulirish.com/2009/markup-based-unobtrusive-comprehensive-dom-ready-execution/
// Only fires on body class

var io_mattross_store = {
	// All pages
	common: {
		init: function() {
			_.each($('.sortable'), function(sortable) {
				$(sortable).sortable({
					connectWith: $(sortable).data('connectwith')
				}).disableSelection();
			});

			$('form.contenteditable').submit( function() {

				var that = this,
					inputs = $(that).find('[contenteditable]'),
					input_name = '',
					input_text = '';

				_.each(inputs, function(input){
					input_name = $(input).data('name');
					input_text = $(input).text();
					if (input_name.indexOf('[]') === input_name.length-2) {
						_.each($(input).children(), function(child) {
							$(that).prepend('<input type="hidden" name="' + input_name.replace(/\[\]$/,'') + '" value="' + $(child).attr('value') + '" />');
						});
					} else {
						$(that).prepend('<input type="hidden" name="' + input_name + '" value="' + input_text + '" />');
					}
				});

				that.submit();
			});
		},
		finalize: function() {}
	},
	index: {
		init: function() {}
	},
	products_edit: {
		init: function() {}
	},
	categories_edit: {
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
