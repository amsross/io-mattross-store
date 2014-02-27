/*
 * Module dependencies
 */
var ProductSchema = require('../schemas/product'),
	_ = require('underscore'),
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
 * GET the cart page
 */
exports.get = function(req, res){
	'use strict';

	// retrieve the shopping cart from memory
	var cart = req.session.cart||{},
		displayCart = {
			items: [],
			total: 0
		},
		total = 0;

	if (!cart || !_.keys(cart).length) {
		req.flash('warning', 'Your cart is empty');
		res.redirect('/');
		return;
	}

	// ready the products for display
	for (var item in cart) {
		displayCart.items.push(cart[item]);
		total += (cart[item].qty * cart[item].price);
	}
	req.session.total = displayCart.total = total.toFixed(2);

	central_render(req, res, {
		template: 'cart/get',
		title: 'Cart',
		addons: {
			cart: displayCart
		}
	});
};

/*
 * ADD an item to the cart
 */
exports.add = function(req, res){
	'use strict';

	req.session.cart = req.session.cart || {};

	var cart = req.session.cart,
		param_id = req.param('_id');

	if (param_id) {
		// locate the product to be added
		ProductSchema.findById(param_id, function (err, product) {
			if (err) {
				console.log('Error adding product to cart: ', err);
				res.redirect('/cart');
				return;
			}

			// add or increase the product quantity in the shopping cart.
			if (cart[param_id]) {
				req.flash('info', 'Quantity updated');
				cart[param_id].qty++;
			} else {
				req.flash('success', 'Item added to cart');
				cart[param_id] = {
					_id: product._id,
					name: product.name,
					slug: product.slug,
					price: product.price,
					prettyPrice: product.prettyPrice(),
					qty: 1
				};
			}

			// display the cart for the user
			res.redirect('/cart');
		});
	} else {
		central_render(req, res, {
			status: 500,
			template: '500',
			title: '500',
			message: 'Resource not provided'
		});
	}
};

/*
 * REMOVE an item from the cart
 */
exports.remove = function(req, res){
	'use strict';

	req.session.cart = req.session.cart || {};

	var param_id = req.param('_id');

	if (param_id) {

		delete req.session.cart[param_id];

		req.flash('info', 'Item removed from cart');

		// display the cart for the user
		res.redirect('/cart');
	} else {
		central_render(req, res, {
			status: 500,
			template: '500',
			title: '500',
			message: 'Resource not provided'
		});
	}
};
