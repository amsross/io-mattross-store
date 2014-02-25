/*
 * Module dependencies
 */
var ProductSchema = require('../schemas/product'),
	ObjectId = require('mongoose').Types.ObjectId;

/*
 * GET product page.
 */
exports.get = function(req, res){
	'use strict';

	ProductSchema.find()
		.exec(function(err, products) {
			if (err) {
				console.log(err);
				res.status(500).json({
					status: 'failure',
					error: err
				});
			} else if (products) {
				res.render('products/get', {
					env: req.NODE_ENV,
					title: 'Products',
					menu: 'products',
					products: products
				});
			} else {
				res.status(404).render('404', {
					env: req.NODE_ENV,
					title: '404',
					status: 'The specified resource could not be found'
				});
			}
		});
};

/*
 * POST product page.
 */
exports.post = function(req, res){
	'use strict';

	var param_product = req.param('product'),
		product = new ProductSchema({
			name: param_product.name,
			price: param_product.price
		});

	product.save(function (err, product) {
		if (err) {
			console.log(err);
			res.status(500).render('500', {
				env: req.NODE_ENV,
				title: '500',
				status: 'internal failure',
				error: err
			});
		} else {
			res.redirect('/products/' + product.id + '/edit');
		}
	});
};

/*
 * PUT product page.
 */
exports.put = function(req, res){
	'use strict';

	var param_id = req.param('_id'),
		param_product = req.param('product'),
		record;

	if (param_id) {
		record = ProductSchema.findById(param_id, function (err, product) {
			if (err) {
				console.log(err);
				res.status(500).render('500', {
					env: req.NODE_ENV,
					title: '500',
					status: 'internal failure',
					error: err
				});
			} else if (product) {
				product.name = param_product.name;
				product.price = param_product.price;

				product.save(function (err, product, numberAffected) {
					if (err) {
						console.log(err);
						res.status(500).render('500', {
							env: req.NODE_ENV,
							title: '500',
							status: 'internal failure',
							error: err
						});
					} else {
						res.redirect('/products/' + product.id + '/edit');
					}
				});
			} else {
				res.status(404).render('404', {
					env: req.NODE_ENV,
					title: '404',
					status: 'The specified resource could not be found'
				});
			}
		});
	}
};

/*
 * DELETE product page.
 */
exports.delete = function(req, res){
	'use strict';

	var _id = req.param('_id'),
		record = ProductSchema.findOne({ _id: _id }, function (err, product) {
			if (err) {
				console.log(err);
				res.status(500).json({
					status: 'failure',
					error: err
				});
			} else if (product) {
				product.remove(function (err, product) {
					if (err) {
						console.log(err);
						res.status(500).json({
							status: 'failure',
							error: err
						});
					} else {
						res.redirect('/products/');
					}
				});
			} else {
				res.status(404).json({status: 'not found'});
			}
		});
};
