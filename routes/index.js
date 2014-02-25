
/*
 * GET home page.
 */
exports.index = function(req, res){
	'use strict';

	res.render('index', {
		title: ' &raquo',
		env: req.NODE_ENV
	});
};
