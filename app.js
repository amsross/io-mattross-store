
module.exports = function (db) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var express = require('express'),
		_ = require('underscore'),
		async = require('async'),
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
		pages = require('./routes/pages'),
		PageSchema = require('./schemas/page'),
		routes = require('./routes'),
		app = express()
		;

	// production only
	if ('production' === app.get('env')) {
		console.log('env: production');
		require('newrelic');
	}

	// development only
	if ('production' !== app.get('env')) {
		app.use(express.errorHandler());
		app.use(require('connect-livereload')({
			port: 4002
		}));
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

			// check if the user has admin privileges
			req.IS_ADMIN = (req.session.IS_ADMIN === undefined && req.NODE_ENV !== 'production') ? true : req.session.IS_ADMIN || false;

			next();
		});

		app.use(app.router);
		app.use(express.static(path.join(__dirname, 'public')));
	});

	app.locals._ = _;

	function site_parts(req, res, next) {
		req.site_parts = req.site_parts||{};

		async.parallel([
			function(cb){
				PageSchema
					.find({isTopLevel: true})
					.limit(5)
					.sort({name: 1})
					.exec(cb);
			},
			function(cb){
				CategorySchema
					.find({isTopLevel: true})
					.limit(5)
					.populate('child_categories')
					.sort({name: 1})
					.exec(cb);
			},
			function(cb){
				ProductSchema
					.find({isFeatured: true})
					.limit(5)
					.sort({updated: -1, name: 1})
					.exec(cb);
			},
			function(cb){

				var cart = {
					items: [],
					total: 0.00
				};

				for (var item in req.session.cart) {
					cart.items.push(item);
					cart.total += (req.session.cart[item].qty * req.session.cart[item].price);
				}

				cb(null, cart);
			},
		], function(err, site_parts){
			if (err) {
				console.log(err);
			} else {
				req.site_parts = {
					top_pages: site_parts[0],
					top_categories: site_parts[1],
					top_products: site_parts[2],
					cart: site_parts[3],
				};
			}

			next();
		});
	}

	app.get('/', site_parts, routes.index);

	app.get('/admin/on', function(req, res) {
		req.session.IS_ADMIN = true;
		res.redirect(req.headers.referer);
	});
	app.get('/admin/off', function(req, res) {
		req.session.IS_ADMIN = false;
		res.redirect(req.headers.referer);
	});
	app.get('/search', site_parts, routes.search);

	app.delete('/pages/:slug', site_parts, pages.delete);
	app.get('/pages/?', site_parts, pages.get);
	app.get('/pages/new/?', site_parts, pages.new);
	app.get('/pages/?:slug', site_parts, pages.get);
	app.post('/pages/?', site_parts, pages.post);
	app.put('/pages/:slug', site_parts, pages.put);

	app.delete('/products/:slug', site_parts, products.delete);
	app.get('/products/?', site_parts, products.get);
	app.get('/products/new/?', site_parts, products.new);
	app.get('/products/?:slug', site_parts, products.get);
	app.post('/products/?', site_parts, products.post);
	app.put('/products/:slug', site_parts, products.put);

	app.delete('/categories/:slug', site_parts, categories.delete);
	app.get('/categories/?', site_parts, categories.get);
	app.get('/categories/new/?', site_parts, categories.new);
	app.get('/categories/?:slug?', site_parts, categories.get);
	app.post('/categories/?', site_parts, categories.post);
	app.put('/categories/:slug', site_parts, categories.put);

	app.get('/cart/?', site_parts, cart.get);
	app.get('/cart/add/?:_id', site_parts, cart.add);
	app.get('/cart/remove/?:_id', site_parts, cart.remove);
	app.get('/cart/pay/?', site_parts, cart.payGet);
	app.post('/cart/pay/?', site_parts, cart.payPost);

	return app;
};
