/*
 * Module dependencies
 */
var ProductSchema = require('../schemas/product'),
	_ = require('underscore');

/*
 * NEW product page.
 */
exports.new = function(req, res){
	'use strict';

	var product = new ProductSchema();

	res.render('products/edit', {
		flashes: req.flash(),
		env: req.NODE_ENV,
		title: 'Products',
		menu: 'products products_edit',
		product: product
	});
};

/*
 * GET product page.
 */
exports.get = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		record;

	record = ProductSchema.findOne({'slug': param_slug}, function (err, product) {
		if (err) {
			console.log(err);
			res.status(500).json({
				status: 'failure',
				error: err
			});
		} else if (product) {
			res.render('products/edit', {
				flashes: req.flash(),
				env: req.NODE_ENV,
				title: 'Products',
				menu: 'products products_edit',
				product: product
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
		product;

	if (param_product) {
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
				req.flash('success', 'Resource created');
				res.redirect('/products/' + product.slug);
			}
		});
	} else {
		res.status(500).render('500', {
			env: req.NODE_ENV,
			title: '500',
			status: 'Resource not provided',
			error: null
		});
	}
};

/*
 * PUT product page.
 */
exports.put = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		param_product = req.param('product'),
		record;

	if (param_product) {
		record = ProductSchema.findOne({'slug': param_slug}, function (err, product) {
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
						req.flash('success', 'Resource updated');
						res.redirect('/products/' + product.slug);
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
	} else {
		res.status(500).render('500', {
			env: req.NODE_ENV,
			title: '500',
			status: 'Resource not provided',
			error: null
		});
	}
};

/*
 * DELETE product page.
 */
exports.delete = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		record = ProductSchema.findOne({ 'slug': param_slug }, function (err, product) {
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
						req.flash('success', 'Resource deleted');
						res.redirect('/');
					}
				});
			} else {
				res.status(404).json({status: 'not found'});
			}
		});
};
