/*
 * Module dependencies
 */
var ProductSchema = require('../schemas/product'),
	ObjectId = require('mongoose').Types.ObjectId,
	_ = require('underscore');

/*
 * GET cart page.
 */
exports.get = function(req, res){
	'use strict';

	// Retrieve the shopping cart from memory
	var cart = req.session.cart,
		displayCart = {
			items: [],
			total: 0
		},
		total = 0;

	if (!cart) {
		req.flash('warning', 'Your cart is empty');
		res.redirect('/');
		return;
	}

	// Ready the products for display
	for (var item in cart) {
		displayCart.items.push(cart[item]);
		total += (cart[item].qty * cart[item].price);
	}
	req.session.total = displayCart.total = total.toFixed(2);

	var model = {
		cart: displayCart
	};

	res.render('cart/get', {
		flashes: req.flash(),
		env: req.NODE_ENV,
		title: 'Products',
		menu: 'products products_edit',
		cart: displayCart
	});
};

/*
 * POST cart page.
 */
exports.post = function(req, res){
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
				cart[param_id].qty++;
			} else {
				cart[param_id] = {
					name: product.name,
					price: product.price,
					prettyPrice: product.prettyPrice(),
					qty: 1
				};
			}

			// display the cart for the user
			res.redirect('/cart');
		});
	} else {
		res.status(500).render('500', {
			env: req.NODE_ENV,
			title: '500',
			status: 'Resource not provided',
			error: null
		});
	}
};
