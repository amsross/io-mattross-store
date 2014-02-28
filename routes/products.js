/*
 * Module dependencies
 */
var _ = require('underscore'),
	CategorySchema = require('../schemas/category'),
	formData = require('form-data'),
	fs = require('fs'),
	im = require('imagemagick'),
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
	central_upload = function(req, product) {
		'use strict';
		if (req.files && req.files.image_full && req.files.image_full.size) {

			// create a very large version
			im.resize({
				width: 1000,
				height: 1000,
				srcData: fs.readFileSync(req.files.image_full.path)
			}, function(err, stdout, stderr) {
				if (!err) {
					fs.writeFileSync(__dirname + '/image_full.' + req.files.image_full.path.split('.').pop(), stdout, 'binary');
					var form = new formData();
					form.append('key', process.env.IMAGESHACK_API);
					form.append('fileupload', fs.createReadStream(__dirname + '/image_full.' + req.files.image_full.path.split('.').pop()));
					form.submit('https://api.imageshack.us/v1/images', function(err, res) {
						// res – response object (http.IncomingMessage)
						res.setEncoding('utf8');
						res.on('data', function(data) {
							data = JSON.parse(data);
							if (data.success && data.result && data.result.images && data.result.images.length) {
								product.set('image_full', (_.first(data.result.images)||{}).direct_link);
								product.save();
							}
						});
						res.on('end', function() {
							fs.unlink(__dirname + '/image_full.' + req.files.image_full.path.split('.').pop(), function(err) {
								if (err) throw err;
							});
						});
						if (!err) {
							res.resume(); // for node-0.10.x
						} else {
							console.log(err);
						}
					});
				} else {
					console.log(err);
				}
			});

			// create a large version
			im.crop({
				width: 500,
				height: 500,
				gravity: 'center',
				extent: '500x500',
				srcData: fs.readFileSync(req.files.image_full.path)
			}, function(err, stdout, stderr) {
				if (!err) {
					fs.writeFileSync(__dirname + '/image_large.' + req.files.image_full.path.split('.').pop(), stdout, 'binary');
					var form = new formData();
					form.append('key', process.env.IMAGESHACK_API);
					form.append('fileupload', fs.createReadStream(__dirname + '/image_large.' + req.files.image_full.path.split('.').pop()));
					form.submit('https://api.imageshack.us/v1/images', function(err, res) {
						// res – response object (http.IncomingMessage)
						res.setEncoding('utf8');
						res.on('data', function(data) {
							data = JSON.parse(data);
							if (data.success && data.result && data.result.images && data.result.images.length) {
								product.set('image_large', (_.first(data.result.images)||{}).direct_link);
								product.save();
							}
						});
						res.on('end', function() {
							fs.unlink(__dirname + '/image_large.' + req.files.image_full.path.split('.').pop(), function(err) {
								if (err) throw err;
							});
						});
						if (!err) {
							res.resume(); // for node-0.10.x
						} else {
							console.log(err);
						}
					});
				} else {
					console.log(err);
				}
			});

			// create a small version
			im.crop({
				width: 200,
				height: 200,
				gravity: 'center',
				extent : '200x200',
				srcData: fs.readFileSync(req.files.image_full.path)
			}, function(err, stdout, stderr) {
				if (!err) {
					fs.writeFileSync(__dirname + '/image_small.' + req.files.image_full.path.split('.').pop(), stdout, 'binary');
					var form = new formData();
					form.append('key', process.env.IMAGESHACK_API);
					form.append('fileupload', fs.createReadStream(__dirname + '/image_small.' + req.files.image_full.path.split('.').pop()));
					form.submit('https://api.imageshack.us/v1/images', function(err, res) {
						// res – response object (http.IncomingMessage)
						res.setEncoding('utf8');
						res.on('data', function(data) {
							data = JSON.parse(data);
							if (data.success && data.result && data.result.images && data.result.images.length) {
								product.set('image_small', (_.first(data.result.images)||{}).direct_link);
								product.save();
							}
						});
						res.on('end', function() {
							fs.unlink(__dirname + '/image_small.' + req.files.image_full.path.split('.').pop(), function(err) {
								if (err) throw err;
							});
						});
						if (!err) {
							res.resume(); // for node-0.10.x
						} else {
							console.log(err);
						}
					});
				} else {
					console.log(err);
				}
			});
		}
	};

/*
 * NEW product page.
 */
exports.new = function(req, res){
	'use strict';

	var product = new ProductSchema();

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
					body_class: 'products products_edit',
					template: 'products/edit',
					title: 'New Product',
					addons: {
						categories: categories,
						product: product
					}
				});
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
					error: err
				}
			});
		} else if (product) {

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
							body_class: 'products products_edit',
							template: 'products/edit',
							title: product.name,
							addons: {
								categories: categories,
								product: product
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
 * POST product page.
 */
exports.post = function(req, res){
	'use strict';

	var
		param_product = req.param('product'),
		product;

	if (param_product) {

		product = new ProductSchema();
		product.set('categories', param_product.categories);
		product.set('description', param_product.price);
		product.set('isFeatured', param_product.isFeatured);
		product.set('name', param_product.name);
		product.set('price', param_product.price);

		central_upload(req, product);

		product.save(function (err, product) {
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

	var
		form = new formData(),
		param_product = req.param('product'),
		param_slug = req.param('slug'),
		record
		;

	if (param_product) {
		record = ProductSchema.findOne({'slug': param_slug}, function (err, product) {
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
			} else if (product) {

				product.set('categories', param_product.categories);
				product.set('description', param_product.description);
				product.set('isFeatured', param_product.isFeatured);
				product.set('name', param_product.name);
				product.set('price', param_product.price);

				central_upload(req, product);

				product.save(function (err, product, numberAffected) {
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
						error: err
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
								message: 'Internal failure'
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
