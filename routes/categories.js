/*
 * Module dependencies
 */
var _ = require('underscore'),
	CategorySchema = require('../schemas/category'),
	formData = require('form-data'),
	fs = require('fs'),
	ProductSchema = require('../schemas/product'),
	central_render = function(req, res, params) {
		'use strict';
		res.status(params.status||200).render(params.template||'', _.extend({
			body_class: params.body_class||'',
			category: params.category||null,
			env: params.env||req.NODE_ENV,
			flashes: params.flashes||req.flash(),
			is_admin: req.IS_ADMIN,
			menu: params.menu||'',
			message: params.message||'',
			site_parts: params.site_parts||req.site_parts,
			title: params.title ? params.title + ' &raquo; ' : ''
		}, params.addons));
	},
	central_upload = function(req, category) {
		'use strict';
		if (req.files && req.files.image_large && req.files.image_large.size) {
			var form = new formData();
			form.append('key', process.env.IMAGESHACK_API);
			form.append('fileupload', fs.createReadStream(req.files.image_large.path));
			form.submit('https://api.imageshack.us/v1/images', function(err, res) {
				// res – response object (http.IncomingMessage)
				res.setEncoding('utf8');
				res.on('data', function(data) {
					data = JSON.parse(data);
					if (data.success && data.result && data.result.images && data.result.images.length) {
						category.set('image_large', (_.first(data.result.images)||{}).direct_link);
						category.set('image_small', (_.first(data.result.images)||{}).direct_link);
						category.save();
					}
				});
				if (!err) {
					res.resume(); // for node-0.10.x
				} else {
					console.log(err);
				}
			});
		}
	};

/*
 * NEW category page.
 */
exports.new = function(req, res){
	'use strict';

	var category = new CategorySchema();

	// get all the products that can be added to this category
	require('../schemas/product').find()
		.exec(function(err, products) {
			if (err) {
				console.log(err);
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						error: err
					}
				});
			} else {
				// get all the categories that can be added as child_categories
				require('../schemas/category').find()
					.exec(function(err, categories) {
						if (err) {
							console.log(err);
							central_render(req, res, {
								status: 500,
								template: '500',
								title: '500',
								addons: {
									error: err
								}
							});
						} else {
							central_render(req, res, {
								body_class: 'categories categories_edit',
								menu: 'New Category',
								template: 'categories/edit',
								title: 'Categories',
								addons: {
									categories: categories,
									category: category,
									products: products
								}
							});
						}
					});
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
					error: err
				}
			});
		} else if (category) {

			// get all the products that can be added to this category
			require('../schemas/product').find()
				.exec(function(err, products) {
					if (err) {
						console.log(err);
						central_render(req, res, {
							status: 500,
							template: '500',
							title: '500',
							addons: {
								error: err
							}
						});
					} else {
						// get all the categories that can be added as child_categories
						require('../schemas/category').find()
							.exec(function(err, categories) {
								if (err) {
									console.log(err);
									central_render(req, res, {
										status: 500,
										template: '500',
										title: '500',
										addons: {
											error: err
										}
									});
								} else {
									central_render(req, res, {
										body_class: 'categories categories_edit',
										menu: category.slug,
										template: 'categories/edit',
										title: 'Categories',
										addons: {
											categories: categories,
											category: category,
											products: products
										}
									});
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

	var
		category,
		param_category = req.param('category')
		;

	if (param_category) {

		category = new CategorySchema();
		category.set('description', param_category.description);
		category.set('isTopLevel', param_category.isTopLevel);
		category.set('name', param_category.name);
		category.set('products', param_category.products);
		category.set('child_categories', param_category.child_categories);

		central_upload(req, category);

		category.save(function (err, category) {
			if (err) {
				console.log(err);
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						error: err
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

	var
		param_category = req.param('category'),
		param_slug = req.param('slug'),
		record
		;

	if (param_category) {
		record = CategorySchema.findOne({'slug': param_slug}, function (err, category) {
			if (err) {
				console.log(err);
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						error: err
					}
				});
			} else if (category) {

				// param_category.child_categories.splice(param_category.child_categories.indexOf(category._id), 1);
				// console.log(param_category.child_categories);

				category.set('description', param_category.description);
				category.set('isTopLevel', param_category.isTopLevel);
				category.set('name', param_category.name);
				category.set('products', param_category.products);
				category.set('child_categories', param_category.child_categories);

				if (category.child_categories && category.child_categories.indexOf(category._id) !== -1) {
					category.child_categories.splice(category.child_categories.indexOf(category._id), 1);
				}

				central_upload(req, category);

				category.save(function (err, category, numberAffected) {
					if (err) {
						console.log(err);
						central_render(req, res, {
							status: 500,
							template: '500',
							title: '500',
							addons: {
								error: err
							}
						});
					} else {

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
					title: '500'
				});
			} else if (category) {
				category.remove(function (err, category) {
					if (err) {
						console.log(err);
						central_render(req, res, {
							status: 500,
							template: '500',
							title: '500'
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
