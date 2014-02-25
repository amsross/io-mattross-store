
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
		products = require('./routes/products'),
		ProductSchema = require('./schemas/product'),
		routes = require('./routes'),
		app = express()
		;

	// production only
	if ('production' === app.get('env')) {
		console.log('env: production');
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
		app.use(express.favicon());
		app.use(express.logger('dev'));
		app.use(express.json());
		app.use(express.urlencoded());
		app.use(express.methodOverride());
		app.use(function (req, res, next) {
			res.set('X-Powered-By', 'mattross.io');
			// make the environment name available in routes, etc
			req.NODE_ENV = app.get('env');
			next();
		});
		app.use(app.router);
		app.use(express.static(path.join(__dirname, 'public')));
	});

	app.get('/', routes.index);

	app.delete('/products/:_id', products.delete);
	app.get('/products/?', products.get);
	app.post('/products/?', products.post);
	app.put('/products/:_id', products.put);

	return app;
};
