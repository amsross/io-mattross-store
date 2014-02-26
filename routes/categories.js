/*
 * Module dependencies
 */
var _ = require('underscore'),
	CategorySchema = require('../schemas/category'),
	ProductSchema = require('../schemas/product'),
	central_render = function(req, res, params) {
		'use strict';
		res.status(params.status||200).render(params.template||'', _.extend({
			body_class: params.body_class||'',
			category: params.category||null,
			env: params.env||req.NODE_ENV,
			flashes: params.flashes||req.flash(),
			menu: params.menu||'',
			message: params.message||'',
			site_parts: params.site_parts||req.site_parts,
			title: params.title ? params.title + ' &raquo; ' : ''
		}, params.addons));
	};

/*
 * NEW category page.
 */
exports.new = function(req, res){
	'use strict';

	var category = new CategorySchema();

	central_render(req, res, {
		body_class: 'categories categories_edit',
		message: 'internal failure',
		template: 'categories/edit',
		title: 'Categories',
		addons: {
			category: category
		}
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
			central_render(req, res, {
				status: 500,
				template: '500',
				title: '500',
				addons: {
					error: err,
					message: 'internal failure'
				}
			});
		} else if (category) {

			require('../schemas/product').find()
				.exec(function(err, products) {
					if (err) {
						console.log(err);
						central_render(req, res, {
							body_class: 'categories categories_edit',
							status: 500,
							template: '500',
							title: '500',
							addons: {
								error: err,
								message: 'internal failure'
							}
						});
					} else {
						central_render(req, res, {
							body_class: 'categories categories_edit',
							menu: category.slug,
							template: 'categories/edit',
							title: 'Categories',
							addons: {
								category: category,
								products: products
							}
						});
					}
				});
		} else {
			central_render(req, res, {
				status: 404,
				template: '404',
				title: '404',
				addons: {
					message: 'The specified resource could not be found'
				}
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
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						error: err,
						message: 'internal failure'
					}
				});
			} else {
				req.flash('success', 'Resource created');
				res.redirect('/categories/' + category.slug);
			}
		});
	} else {
		central_render(req, res, {
			status: 500,
			template: '500',
			title: '500',
			addons: {
				message: 'Resource not provided'
			}
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
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						error: err,
						message: 'internal failure'
					}
				});
			} else if (category) {
				category.name = param_category.name;
				category.isTopLevel = param_category.isTopLevel;
				category.products = param_category.products;

				category.save(function (err, category, numberAffected) {
					if (err) {
						console.log(err);
						central_render(req, res, {
							status: 500,
							template: '500',
							title: '500',
							addons: {
								error: err,
								message: 'internal failure'
							}
						});
					} else {

						// remove this category from any products no longer in the category.products array
						ProductSchema
							.find({categories: { '$in' : [category._id]}}, function (err, products) {
								if (err) {
									console.log(err);
									central_render(req, res, {
										status: 500,
										template: '500',
										title: '500',
										addons: {
											error: err,
											message: 'internal failure'
										}
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
				central_render(req, res, {
					status: 404,
					template: '404',
					title: '404',
					addons: {
						error: err,
						message: 'The specified resource could not be found'
					}
				});
			}
		});
	} else {
		central_render(req, res, {
			status: 500,
			template: '500',
			title: '500',
			addons: {
				message: 'Resource not provided',
			}
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
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						message: 'internal failure'
					}
				});
			} else if (category) {
				category.remove(function (err, category) {
					if (err) {
						console.log(err);
						central_render(req, res, {
							status: 500,
							template: '500',
							title: '500',
							addons: {
								message: 'internal failure'
							}
						});
					} else {
						req.flash('success', 'Resource deleted');
						res.redirect('/');
					}
				});
			} else {
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						message: 'The specified resource could not be found'
					}
				});
			}
		});
};
