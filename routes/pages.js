/*
 * Module dependencies
 */
var _ = require('underscore'),
	PageSchema = require('../schemas/page'),
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
	central_upload = function(req, page) {
		'use strict';
		if (req.files && req.files.image_full && req.files.image_full.size) {

			var readStream = fs.createReadStream(req.files.image_full.path);

			// create a full size version
			var writeStream_full = fs.createWriteStream(__dirname + '/' + page._id + '_image_full.' + req.files.image_full.path.split('.').pop());
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
							page.set('image_full', (_.first(data.result.images)||{}).direct_link);
							page.save();
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
			var writeStream_large = fs.createWriteStream(__dirname + '/' + page._id + '_image_large.' + req.files.image_full.path.split('.').pop());
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
							page.set('image_large', (_.first(data.result.images)||{}).direct_link);
							page.save();
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
			var writeStream_small = fs.createWriteStream(__dirname + '/' + page._id + '_image_small.' + req.files.image_full.path.split('.').pop());
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
							page.set('image_small', (_.first(data.result.images)||{}).direct_link);
							page.save();
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
 * NEW page.
 */
exports.new = function(req, res){
	'use strict';

	var page = new PageSchema();

	// get all the pages that can be added as child_pages
	require('../schemas/page').find()
		.exec(function(err, pages) {
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
					body_class: 'pages pages_edit',
					menu: 'New Page',
					template: 'pages/edit',
					title: 'Pages',
					addons: {
						page: page,
						child_pages: pages,
					}
				});
			}
		});
};

/*
 * GET page.
 */
exports.get = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		record;

	if (param_slug) {
		record = PageSchema.findOne({'slug': param_slug}).
			populate('products')
			.exec( function (err, page) {
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
				} else if (page) {

					// get all the pages that can be added as child_pages
					require('../schemas/page').find()
						.sort({ name: 1 })
						.exec(function(err, child_pages) {
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
									body_class: 'pages pages_edit',
									menu: page.slug,
									template: 'pages/edit',
									title: page.name,
									addons: {
										child_pages: child_pages,
										page: page,
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

		record = PageSchema.find()
			.sort({ name: 1 })
			.exec(function(err, pages) {
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
				} else if (pages) {
					central_render(req, res, {
						body_class: 'pages pages_get',
						template: 'pages/get',
						title: 'Pages',
						addons: {
							pages: pages
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
 * POST page.
 */
exports.post = function(req, res){
	'use strict';

	var
		page,
		param_page = req.param('page')
		;

	if (param_page) {

		page = new PageSchema();
		page.set('child_categories', param_page.child_pages);
		page.set('description', param_page.description);
		page.set('isTopLevel', param_page.isTopLevel);
		page.set('name', param_page.name);

		central_upload(req, page);

		page.save(function (err, page) {
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
				res.redirect('/pages/' + page.slug);
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
 * PUT page.
 */
exports.put = function(req, res){
	'use strict';

	var
		param_page = req.param('page'),
		param_slug = req.param('slug'),
		record
		;

	if (param_page && param_slug) {
		record = PageSchema.findOne({'slug': param_slug}, function (err, page) {
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
			} else if (page) {

				page.set('child_pages', param_page.child_pages);
				page.set('description', param_page.description);
				page.set('isTopLevel', param_page.isTopLevel);
				page.set('name', param_page.name);

				if (page.child_pages && page.child_pages.indexOf(page._id) !== -1) {
					page.child_pages.splice(page.child_pages.indexOf(page._id), 1);
				}

				central_upload(req, page);

				page.save(function (err, page, numberAffected) {
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
						res.redirect('/pages/' + page.slug);
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
 * DELETE page.
 */
exports.delete = function(req, res){
	'use strict';

	var param_slug = req.param('slug'),
		record = PageSchema.findOne({'slug': param_slug}, function (err, page) {
			if (err) {
				console.log(err);
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500'
				});
			} else if (page) {
				page.remove(function (err, page) {
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
