
module.exports = function (db) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var express = require('express'),
		cart = require('./routes/cart'),
		categories = require('./routes/categories'),
		CategorySchema = require('./schemas/category'),
		flash = require('connect-flash'),
		MongoStore = require('connect-mongo')(express),
		multipart = require('connect-multiparty'),
		multiparty = multipart(),
		path = require('path'),
		products = require('./routes/products'),
		ProductSchema = require('./schemas/product'),
		routes = require('./routes'),
		app = express()
		;

	// production only
	if ('production' === app.get('env')) {
		console.log('env: production');
		require('newrelic');
	}

	// development only
	if ('development' === app.get('env')) {
		console.log('env: development');
		app.use(express.errorHandler());
	}

	// all environments
	app.configure(function() {
		app.set('port', process.env.PORT || 3000);
		app.set('views', path.join(__dirname, 'views'));
		app.set('view engine', 'jade');
		app.use(express.cookieParser());
		app.use(express.session({secret: 'sdfwef234f2e2f24fkhdlkj238'}));
		app.use(flash());
		app.use(express.favicon('favicon.ico'));
		app.use(express.logger('dev'));
		app.use(express.json());
		app.use(express.urlencoded());
		app.use(multiparty);
		app.use(express.methodOverride());

		app.use(function (req, res, next) {
			res.set('X-Powered-By', 'mattross.io');
			next();
		});
		app.use(function (req, res, next) {
			// make the environment name available in routes, etc
			req.NODE_ENV = app.get('env');
			next();
		});

		app.use(app.router);
		app.use(express.static(path.join(__dirname, 'public')));
	});

	app.locals._ = require('underscore');


	var site_parts = {};

	site_parts.categories = function (req, res, next) {
		req.site_parts = req.site_parts||{};

		CategorySchema
			.find({isTopLevel: true})
			.sort({ sort: 1, name: 1 })
			.exec(function(err, categories) {
				if (err) {
					console.log(err);
				} else {
					req.site_parts.categories = categories;
				}
				next();
			});
	};

	site_parts.cart = function (req, res, next) {
		req.site_parts = req.site_parts||{};

		req.site_parts.cart = {
			items: [],
			total: 0.00
		};

		for (var item in req.session.cart) {
			req.site_parts.cart.items.push(item);
			req.site_parts.cart.total += (req.session.cart[item].qty * req.session.cart[item].price);
		}
		next();
	};

	app.get('/', site_parts.categories, site_parts.cart, routes.index);

	app.delete('/products/:slug', site_parts.categories, site_parts.cart, products.delete);
	app.get('/products/new/?', site_parts.categories, site_parts.cart, products.new);
	app.get('/products/?:slug', site_parts.categories, site_parts.cart, products.get);
	app.post('/products/?', site_parts.categories, site_parts.cart, products.post);
	app.put('/products/:slug', site_parts.categories, site_parts.cart, products.put);

	app.delete('/categories/:slug', site_parts.categories, site_parts.cart, categories.delete);
	app.get('/categories/new/?', site_parts.categories, site_parts.cart, categories.new);
	app.get('/categories/?:slug', site_parts.categories, site_parts.cart, categories.get);
	app.post('/categories/?', site_parts.categories, site_parts.cart, categories.post);
	app.put('/categories/:slug', site_parts.categories, site_parts.cart, categories.put);

	app.get('/cart/?', site_parts.categories, site_parts.cart, cart.get);
	app.get('/cart/add/?:_id', site_parts.categories, site_parts.cart, cart.add);
	app.get('/cart/remove/?:_id', site_parts.categories, site_parts.cart, cart.remove);
	// app.post('/cart/?:_id', site_parts.categories, site_parts.cart, cart.post);

	return app;
};
