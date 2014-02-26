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

	ProductSchema
		.find({isFeatured: true})
		.sort({ updated: -1 })
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
					site_parts: req.site_parts,
					flashes: req.flash(),
					env: req.NODE_ENV,
					title: 'Home &raquo',
					menu: 'home',
					products: products
				});
			}
		});
};
