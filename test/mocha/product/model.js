'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	Product = require('../../../schemas/product');

//Globals
var product_01, product_02, product_03;

//The tests
describe('<Unit Test>', function() {
	describe('Model Product:', function() {
		before(function(done) {
			product_01 = new Product({
				name: 'Test Product 01',
				price: 359.99
			});
			product_02 = new Product({
				name: 'Test Product 01',
				price: 359.99
			});
			product_03= new Product({
				name: 'Test Product 02',
				price: 584.99
			});

			done();
		});

		describe('Method Save', function() {

			it('should be able to save whithout problems', function(done) {
				return product_01.save(function(err) {
					should.not.exist(err);
					done();
				});
			});

			it('should fail to save an product with an existing slug', function(done) {
				return product_02.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should be able to show an error when try to save without name', function(done) {
				product_02.name = '';
				return product_02.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should be able to show an error when try to save without price', function(done) {
				product_03.price = '';
				return product_03.save(function(err) {
					should.exist(err);
					done();
				});
			});
		});

		after(function(done) {
			product_01.remove();
			product_02.remove();
			product_03.remove();
			done();
		});
	});
});
