'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	should = require('should'),
	Category = require('../../../schemas/category'),
	Product = require('../../../schemas/product');

//Globals
var category_01, category_02, category_03, category_04,
	product_01, product_02;

//The tests
describe('<Unit Test>', function() {
	describe('Model Category:', function() {
		before(function(done) {
			category_01 = new Category({
				name: 'Test Category 01'
			});
			category_02 = new Category({
				name: 'Test Category 01'
			});
			category_03 = new Category({
				name: 'Test Category 03'
			});
			category_04 = new Category({
				name: 'Test Category 04'
			});

			done();
		});

		describe('Method Save', function() {

			it('should be able to save whithout problems', function(done) {
				return category_01.save(function(err) {
					should.not.exist(err);
					done();
				});
			});

			it('should fail to save a category with an existing slug', function(done) {
				return category_02.save(function(err) {
					should.exist(err);
					done();
				});
			});

			it('should be able to add references to products', function(done) {

				product_01 = new Product({
					name: 'Test Product 01',
					price: 359.99
				});
				product_01.save();
				category_01.products.push(product_01);

				product_02 = new Product({
					name: 'Test Product 02',
					price: 359.99
				});
				product_02.save();
				category_01.products.push(product_02);

				return category_03.save(function(err) {
					should.not.exist(err);
					done();
				});
			});

			it('should be able to add subcategories', function(done) {

				category_04.sub_categories.push(category_01);
				return category_04.save(function(err) {
					should.not.exist(err);
					done();
				});
			});

			it('should be able to show an error when try to save without name', function(done) {

				category_02.name = '';
				return category_02.save(function(err) {
					should.exist(err);
					done();
				});
			});
		});

		after(function(done) {
			category_01.remove();
			category_02.remove();
			category_03.remove();
			category_04.remove();
			product_01.remove();
			product_02.remove();
			done();
		});
	});
});
