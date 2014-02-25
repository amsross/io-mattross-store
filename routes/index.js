/*
 * Module dependencies
 */
var ProductSchema = require('../schemas/product'),
	ObjectId = require('mongoose').Types.ObjectId;

/*
 * GET home page.
 */
exports.index = function(req, res){
	'use strict';

	var query = ProductSchema.find();

	query.limit(4)
		.exec(function(err, products) {
			if (err) {
				console.log(err);
				res.status(500).json({
					status: 'failure',
					error: err
				});
			} else {
				res.render('index', {
					title: 'Home &raquo',
					env: req.NODE_ENV,
					menu: 'home',
					products: products
				});
			}
		});
};
