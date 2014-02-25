/*
 * Module dependencies
 */
var CategorySchema = require('../schemas/category'),
	ObjectId = require('mongoose').Types.ObjectId,
	_ = require('underscore');

/*
 * NEW category page.
 */
exports.new = function(req, res){
	'use strict';

	var category = new CategorySchema();

	res.render('categories/edit', {
		env: req.NODE_ENV,
		title: 'Categories',
		menu: 'categories categories_edit',
		category: category
	});
};

/*
 * GET category page.
 */
exports.get = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		record;

	record = CategorySchema.findOne({'slug': param_slug}).populate('products').exec( function (err, category) {
		if (err) {
			console.log(err);
			res.status(500).json({
				status: 'failure',
				error: err
			});
		} else if (category) {

			require('../schemas/product').find()
				.exec(function(err, products) {
					if (err) {
						console.log(err);
						res.status(500).json({
							status: 'failure',
							error: err
						});
					} else {
						res.render('categories/edit', {
							env: req.NODE_ENV,
							title: 'Categories',
							menu: 'categories categories_edit',
							category: category,
							products: products
						});
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
};

/*
 * POST category page.
 */
exports.post = function(req, res){
	'use strict';

	var param_category = req.param('category'),
		category;

	if (param_category) {
		category = new CategorySchema({
			name: param_category.name
		});
		category.save(function (err, category) {
			if (err) {
				console.log(err);
				res.status(500).render('500', {
					env: req.NODE_ENV,
					title: '500',
					status: 'internal failure',
					error: err
				});
			} else {
				res.redirect('/categories/' + category.slug);
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
 * PUT category page.
 */
exports.put = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		param_category = req.param('category'),
		record;

	if (param_category) {
		record = CategorySchema.findOne({'slug': param_slug}, function (err, category) {
			if (err) {
				console.log(err);
				res.status(500).render('500', {
					env: req.NODE_ENV,
					title: '500',
					status: 'internal failure',
					error: err
				});
			} else if (category) {
				category.name = param_category.name;
				category.products = param_category.products;

				category.save(function (err, category, numberAffected) {
					if (err) {
						console.log(err);
						res.status(500).render('500', {
							env: req.NODE_ENV,
							title: '500',
							status: 'internal failure',
							error: err
						});
					} else {
						res.redirect('/categories/' + category.slug);
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
 * DELETE category page.
 */
exports.delete = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		record = CategorySchema.findOne({ 'slug': param_slug }, function (err, category) {
			if (err) {
				console.log(err);
				res.status(500).json({
					status: 'failure',
					error: err
				});
			} else if (category) {
				category.remove(function (err, category) {
					if (err) {
						console.log(err);
						res.status(500).json({
							status: 'failure',
							error: err
						});
					} else {
						res.redirect('/');
					}
				});
			} else {
				res.status(404).json({status: 'not found'});
			}
		});
};
