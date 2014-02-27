/*
 * Module dependencies
 */
var _ = require('underscore'),
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

	ProductSchema
		.find({isFeatured: true})
		.sort({ updated: -1 })
		.limit(4)
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
				central_render(req, res, {
					body_class: 'home',
					menu: 'home',
					template: 'index',
					title: 'Home',
					addons: {
						products: products
					}
				});
			}
		});
};
