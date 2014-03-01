/*
 * Module dependencies
 */
var ProductSchema = require('../schemas/product'),
	_ = require('underscore'),
	paypal = require('paypal-rest-sdk'),
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

paypal.configure({
	'host' : process.env.PAYPAL_ENDPOINT,
	'port' : '',
	'client_id' : process.env.PAYPAL_CLIENTID,
	'client_secret' : process.env.PAYPAL_SECRET
});

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
				cart[param_id] = {
					_id: product._id,
					name: product.name,
					slug: product.slug,
					price: product.price,
					prettyPrice: product.prettyPrice(),
					qty: 1
				};
				req.flash('success', '<a class="alert-link" href="/products/' + cart[param_id].slug + '">' + cart[param_id].name + '</a>' + ' added to cart');
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

		req.flash('info', '<a class="alert-link" href="/products/' + req.session.cart[param_id].slug + '">' + req.session.cart[param_id].name + '</a>' + ' removed from cart');

		delete req.session.cart[param_id];

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

/*
 * GET pay
 */
exports.payGet = function(req, res){
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
		template: 'cart/pay',
		title: 'Checkout',
		addons: {
			cart: displayCart
		}
	});
};
/*
 * POST pay
 */
exports.payPost = function(req, res){
	'use strict';

	req.session.cart = req.session.cart || {};

	//Read the incoming product data
	var cc = req.param('cc'),
		firstName = req.param('firstName'),
		lastName = req.param('lastName'),
		expMonth = req.param('expMonth'),
		expYear = req.param('expYear'),
		cvv = req.param('cvv');

	//Ready the payment information to pass to the PayPal library
	var payment = {
		'intent': 'sale',
		'payer': {
			'payment_method': 'credit_card',
			'funding_instruments': []
		},
		'transactions': []
	};

	// Identify credit card type. Patent pending. Credit cards starting with 3 = amex, 4 = visa, 5 = mc , 6 = discover
	var ccType = (['amex','visa','mastercard','discover'])[parseInt(cc.slice(0,1),10)-3];

	//Set the credit card
	payment.payer.funding_instruments[0] = {
		'credit_card': {
			'number': cc,
			'type': ccType,
			'expire_month': expMonth,
			'expire_year': expYear,
			'cvv2': cvv,
			'first_name': firstName,
			'last_name': lastName
		}
	};

	//Set the total to charge the customer
	payment.transactions[0] = {
		amount: {
			total: req.session.total,
			currency: 'USD'
		},
		description: 'Your NodeStore Purchase'
	};

	//Execute the payment.
	paypal.payment.create(payment, {}, function (err, resp) {
		if (err) {
			console.log(err);
			central_render(req, res, {
				status: '500',
				template: '500',
				addons: {
					error: err
				}
			});
			return;
		}

		if (resp) {
			console.log(resp);
			delete req.session.cart;
			delete req.session.displayCart;

			central_render(req, res, {
				template: 'cart/result',
				title: 'Cart',
				addons: {
					resp: resp,
					result:'Success :)'
				}
			});
		}
	});
};
