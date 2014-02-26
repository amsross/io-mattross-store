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
 * NEW product page.
 */
exports.new = function(req, res){
	'use strict';

	var product = new ProductSchema();

	central_render(req, res, {
		body_class: 'products products_edit',
		message: 'internal failure',
		template: 'products/edit',
		title: 'Products',
		addons: {
			product: product
		}
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
			central_render(req, res, {
				status: 500,
				template: '500',
				title: '500',
				addons: {
					error: err,
					message: 'internal failure'
				}
			});
		} else if (product) {
			central_render(req, res, {
				body_class: 'products products_edit',
				template: 'products/edit',
				title: 'Products',
				addons: {
					product: product
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
 * POST product page.
 */
exports.post = function(req, res){
	'use strict';

	var param_product = req.param('product'),
		product;

	if (param_product) {
		product = new ProductSchema();
		product.name = param_product.name;
		product.price = param_product.price;
		product.isFeatured = param_product.isFeatured;

		product.save(function (err, product) {
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
				res.redirect('/products/' + product.slug);
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
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						error: err,
						message: 'internal failure'
					}
				});
			} else if (product) {
				product.name = param_product.name;
				product.price = param_product.price;
				product.isFeatured = param_product.isFeatured;

				product.save(function (err, product, numberAffected) {
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
						req.flash('success', 'Resource updated');
						res.redirect('/products/' + product.slug);
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
 * DELETE product page.
 */
exports.delete = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		record = ProductSchema.findOne({ 'slug': param_slug }, function (err, product) {
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
			} else if (product) {
				product.remove(function (err, product) {
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
						req.flash('success', 'Resource deleted');
						res.redirect('/');
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
