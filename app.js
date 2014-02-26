
module.exports = function (db) {
	'use strict';

	/**
	 * Module dependencies.
	 */
	var
		express = require('express'),
		flash = require('connect-flash'),
		MongoStore = require('connect-mongo')(express),
		path = require('path'),
		cart = require('./routes/cart'),
		categories = require('./routes/categories'),
		products = require('./routes/products'),
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
		// app.use(express.csrf());
		app.use(express.favicon());
		app.use(express.json());
		app.use(express.logger('dev'));
		app.use(express.methodOverride());
		app.use(express.urlencoded());
		app.use(function (req, res, next) {
			res.set('X-Powered-By', 'mattross.io');

			// make the environment name available in routes, etc
			req.NODE_ENV = app.get('env');
			next();
		});
		app.use(app.router);
		app.use(express.static(path.join(__dirname, 'public')));
	});

	app.locals._ = require('underscore');

	app.get('/', routes.index);

	app.delete('/products/:slug', products.delete);
	app.get('/products/new/?', products.new);
	app.get('/products/?:slug', products.get);
	app.post('/products/?', products.post);
	app.put('/products/:slug', products.put);

	app.delete('/categories/:slug', categories.delete);
	app.get('/categories/new/?', categories.new);
	app.get('/categories/?:slug', categories.get);
	app.post('/categories/?', categories.post);
	app.put('/categories/:slug', categories.put);

	app.get('/cart/?', cart.get);
	app.get('/cart/add/?:_id', cart.post);
	app.post('/cart/?:_id', cart.post);

	return app;
};
