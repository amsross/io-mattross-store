/*
 * Module dependencies
 */
var _ = require('underscore'),
	async = require('async'),
	CategorySchema = require('../schemas/category'),
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
	};

/*
 * GET home page.
 */
exports.index = function(req, res){
	'use strict';

	central_render(req, res, {
		body_class: 'home',
		menu: 'home',
		template: 'index'
	});
};

/*
 * GET search.
 */
exports.search = function(req, res){
	'use strict';

	var query = req.param('q');

	if (query) {
		async.parallel([
			function(cb){
				CategorySchema.find()
					.or([
						{description: {$regex: query, $options: 'i'}},
						{name: {$regex: query, $options: 'i'}},
						{slug: {$regex: query, $options: 'i'}}
					])
					.sort({slug: 1})
					.exec(cb)
					;
			},
			function(cb){
				ProductSchema.find()
					.or([
						{description: {$regex: query, $options: 'i'}},
						{name: {$regex: query, $options: 'i'}},
						{slug: {$regex: query, $options: 'i'}}
					])
					.sort({slug: 1})
					.exec(cb)
					;
			},
		], function(err, results){
			if (err) {
				console.log(err);
				central_render(req, res, {
					status: 500,
					template: '500',
					title: '500',
					addons: {
						error: err,
					},
				});
			} else if (results) {
				central_render(req, res, {
					body_class: 'home search',
					menu: 'home',
					template: 'search',
					title: 'Search: ' + query,
					addons: {
						categories: results[0],
						products: results[1],
					},
				});
			} else {
				central_render(req, res, {
					status: 404,
					template: '404',
					title: '404',
					addons: {
						message: 'No results found',
					},
				});
			}
		});
	} else {
		res.redirect(req.headers.referer);
	}
};
