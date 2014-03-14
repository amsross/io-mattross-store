/*
 * Module dependencies
 */
var _ = require('underscore'),
	CategorySchema = require('../schemas/category'),
	formData = require('form-data'),
	fs = require('fs'),
	gm = require('gm'),
	im = gm.subClass({ imageMagick: true }),
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
		if (req.files && req.files.image_full && req.files.image_full.size) {

			var readStream = fs.createReadStream(req.files.image_full.path);

			// create a full size version
			var writeStream_full = fs.createWriteStream(__dirname + '/' + category._id + '_image_full.' + req.files.image_full.path.split('.').pop());
			writeStream_full.on('finish', function() {

				var that = this,
					form = new formData();

				form.append('key', process.env.IMAGESHACK_API);
				form.append('fileupload',  fs.createReadStream(that.path));
				form.submit('https://api.imageshack.us/v1/images', function(err, res) {
					res.setEncoding('utf8');
					res.on('data', function(data) {
						data = JSON.parse(data);
						if (data.success && data.result && data.result.images && data.result.images.length) {
							category.set('image_full', (_.first(data.result.images)||{}).direct_link);
							category.save();
						}
					});
					res.on('end', function() {
						fs.exists(that.path, function(exists) {
							if(exists) {
								fs.unlink(that.path, function(err) {
									if (err) throw err;
								});
							}
						});
					});
					if (!err) {
						res.resume(); // for node-0.10.x
					} else {
						console.log(err);
					}
				});
			});

			im(readStream, req.files.image_full.name)
				.geometry(1000, 1000, '^')
				.resize(1000, 1000)
				.gravity('Center')
				.stream()
				.pipe(writeStream_full)
				;

			// create a large version
			var writeStream_large = fs.createWriteStream(__dirname + '/' + category._id + '_image_large.' + req.files.image_full.path.split('.').pop());
			writeStream_large.on('finish', function() {
				var that = this,
					form = new formData();

				form.append('key', process.env.IMAGESHACK_API);
				form.append('fileupload',  fs.createReadStream(that.path));
				form.submit('https://api.imageshack.us/v1/images', function(err, res) {
					res.setEncoding('utf8');
					res.on('data', function(data) {
						data = JSON.parse(data);
						if (data.success && data.result && data.result.images && data.result.images.length) {
							category.set('image_large', (_.first(data.result.images)||{}).direct_link);
							category.save();
						}
					});
					res.on('end', function() {
						fs.exists(that.path, function(exists) {
							if(exists) {
								fs.unlink(that.path, function(err) {
									if (err) throw err;
								});
							}
						});
					});
					if (!err) {
						res.resume(); // for node-0.10.x
					} else {
						console.log(err);
					}
				});
			});

			im(readStream, req.files.image_full.name)
				.geometry(500, 500, '^')
				.gravity('Center')
				.crop(500, 500, 0, 0)
				.extent(500, 500)
				.stream()
				.pipe(writeStream_large)
				;

			// create a small version
			var writeStream_small = fs.createWriteStream(__dirname + '/' + category._id + '_image_small.' + req.files.image_full.path.split('.').pop());
			writeStream_small.on('finish', function() {
				var that = this,
					form = new formData();

				form.append('key', process.env.IMAGESHACK_API);
				form.append('fileupload',  fs.createReadStream(that.path));
				form.submit('https://api.imageshack.us/v1/images', function(err, res) {
					res.setEncoding('utf8');
					res.on('data', function(data) {
						data = JSON.parse(data);
						if (data.success && data.result && data.result.images && data.result.images.length) {
							category.set('image_small', (_.first(data.result.images)||{}).direct_link);
							category.save();
						}
					});
					res.on('end', function() {
						fs.exists(that.path, function(exists) {
							if(exists) {
								fs.unlink(that.path, function(err) {
									if (err) throw err;
								});
							}
						});
					});
					if (!err) {
						res.resume(); // for node-0.10.x
					} else {
						console.log(err);
					}
				});
			});

			im(readStream, req.files.image_full.name)
				.geometry(200, 200, '^')
				.gravity('Center')
				.crop(200, 200, 0, 0)
				.extent(200, 200)
				.stream()
				.pipe(writeStream_small)
				;
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

	if (param_slug) {
		record = CategorySchema.findOne({'slug': param_slug}).
			populate('products')
			.exec( function (err, category) {
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
						.sort({ name: 1 })
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
									.sort({ name: 1 })
									.exec(function(err, child_categories) {
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
												title: category.name,
												addons: {
													child_categories: child_categories,
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
	} else {

		record = CategorySchema.find()
			.sort({ name: 1 })
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
				} else if (categories) {
					central_render(req, res, {
						body_class: 'categories categories_get',
						template: 'categories/get',
						title: 'Categories',
						addons: {
							categories: categories
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
	}
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

				category.set('description', param_category.description);
				category.set('isTopLevel', param_category.isTopLevel);
				category.set('name', param_category.name);
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
