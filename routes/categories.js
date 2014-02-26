/*
 * Module dependencies
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	CategorySchema = require('../schemas/category'),
	ProductSchema = require('../schemas/product'),
	_ = require('underscore');

/*
 * NEW category page.
 */
exports.new = function(req, res){
	'use strict';

	var category = new CategorySchema();

	res.render('categories/edit', {
		site_parts: req.site_parts,
		flashes: req.flash(),
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
			res.status(500).render('500', {
				site_parts: req.site_parts,
				flashes: req.flash(),
				env: req.NODE_ENV,
				status: 'internal failure',
				error: err
			});
		} else if (category) {

			require('../schemas/product').find()
				.exec(function(err, products) {
					if (err) {
						console.log(err);
						res.status(500).render('500', {
							site_parts: req.site_parts,
							flashes: req.flash(),
							env: req.NODE_ENV,
							status: 'internal failure',
							error: err
						});
					} else {
						res.render('categories/edit', {
							site_parts: req.site_parts,
							flashes: req.flash(),
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
				site_parts: req.site_parts,
				flashes: req.flash(),
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
		category = new CategorySchema();
		category.name = param_category.name;
		category.isTopLevel = param_category.isTopLevel;

		category.save(function (err, category) {
			if (err) {
				console.log(err);
				res.status(500).render('500', {
					site_parts: req.site_parts,
					flashes: req.flash(),
					env: req.NODE_ENV,
					title: '500',
					status: 'internal failure',
					error: err
				});
			} else {
				req.flash('success', 'Resource created');
				res.redirect('/categories/' + category.slug);
			}
		});
	} else {
		res.status(500).render('500', {
			site_parts: req.site_parts,
			flashes: req.flash(),
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
					site_parts: req.site_parts,
					flashes: req.flash(),
					env: req.NODE_ENV,
					title: '500',
					status: 'internal failure',
					error: err
				});
			} else if (category) {
				category.name = param_category.name;
				category.isTopLevel = param_category.isTopLevel;
				category.products = param_category.products;

				category.save(function (err, category, numberAffected) {
					if (err) {
						console.log(err);
						res.status(500).render('500', {
							site_parts: req.site_parts,
							flashes: req.flash(),
							env: req.NODE_ENV,
							title: '500',
							status: 'internal failure',
							error: err
						});
					} else {

						// remove this category from any products no longer in the category.products array
						ProductSchema
							.find({categories: { '$in' : [category._id]}}, function (err, products) {
								if (err) {
									console.log(err);
									res.status(500).render('500', {
										site_parts: req.site_parts,
										flashes: req.flash(),
										env: req.NODE_ENV,
										title: '500',
										status: 'internal failure',
										error: err
									});
								} else if (products) {
									_.each(products, function(product) {
										if ((category.products||[]).indexOf(product._id) === -1) {
											product.categories.remove(category);
											product.save();
										}
									});
								}
							});

						// add this category to any products now in the category.products array
						category.populate('products', function(err, category) {
							_.each(category.products, function(product) {
								if ((product.categories||[]).indexOf(category._id) === -1) {
									product.categories.push(category);
									product.save();
								}
							});
						});

						req.flash('success', 'Resource updated');
						res.redirect('/categories/' + category.slug);
					}
				});
			} else {
				res.status(404).render('404', {
					site_parts: req.site_parts,
					flashes: req.flash(),
					env: req.NODE_ENV,
					title: '404',
					status: 'The specified resource could not be found'
				});
			}
		});
	} else {
		res.status(500).render('500', {
			site_parts: req.site_parts,
			flashes: req.flash(),
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
				res.status(500).render('500', {
					site_parts: req.site_parts,
					flashes: req.flash(),
					env: req.NODE_ENV,
					status: 'internal failure',
					error: err
				});
			} else if (category) {
				category.remove(function (err, category) {
					if (err) {
						console.log(err);
						res.status(500).render('500', {
							site_parts: req.site_parts,
							flashes: req.flash(),
							env: req.NODE_ENV,
							status: 'internal failure',
							error: err
						});
					} else {
						req.flash('success', 'Resource deleted');
						res.redirect('/');
					}
				});
			} else {
				res.status(404).render('404', {
					site_parts: req.site_parts,
					flashes: req.flash(),
					env: req.NODE_ENV,
					title: '404',
					status: 'The specified resource could not be found'
				});
			}
		});
};
