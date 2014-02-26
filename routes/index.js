/*
 * Module dependencies
 */
var ProductSchema = require('../schemas/product'),
	CategorySchema = require('../schemas/category'),
	ObjectId = require('mongoose').Types.ObjectId;

/*
 * GET home page.
 */
exports.index = function(req, res){
	'use strict';

	CategorySchema
		.find()
		.populate('products')
		.limit(4)
		.exec(function(err, categories) {
			if (err) {
				console.log(err);
				res.status(500).json({
					status: 'failure',
					error: err
				});
			} else {

				ProductSchema
					.find()
					.limit(4)
					.exec(function(err, products) {
						if (err) {
							console.log(err);
							res.status(500).json({
								status: 'failure',
								error: err
							});
						} else {
							res.render('index', {
								flashes: req.flash(),
								env: req.NODE_ENV,
								title: 'Home &raquo',
								menu: 'home',
								products: products,
								categories: categories
							});
						}
					});
			}
		});
};
