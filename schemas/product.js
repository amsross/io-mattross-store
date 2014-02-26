'use strict';
var mongoose = require('mongoose'),
	validator = require('validator'),
	findOrCreate = require('mongoose-findorcreate'),
	CategorySchema = require('./category'),
	Schema = mongoose.Schema;

var ProductSchema = new Schema({
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
		type: Date,
		default: Date.now
	},
	name: {
		type: String,
		trim: true
	},
	slug: {
		type: String,
		lowercase: true,
		trim: true
	},
	price: Number
});

ProductSchema.methods.prettyPrice = function(price) {
	price = price || this.price;
	return '$' + price.toFixed(2);
};

ProductSchema.plugin(findOrCreate);

/**
 * Validations
 */
var validateName = function(name) {
	return !validator.isNull(name) && name.length;
};
var validateSlug = function(slug) {
	return !validator.isNull(slug) && validator.isLength(slug, 1)  && validator.isLowercase(slug);
};
var validatePrice = function(price) {
	return !validator.isNull(price) && validator.isLength(price, 1);
};

/**
 * Pre-save hook
 */
ProductSchema.pre('save', function(next) {

	var that = this;

	// that.updated = Date.now;
	that.slug = that.name.replace(/\W+/g,'-').replace(/^-/,'').replace(/-$/,'');

	if (!validateSlug(that.slug)) {
		next(new Error('Product slug is required'));
	} else {
		mongoose.model('Product', ProductSchema).find({slug: that.slug}, function (err, products) {
			if (that.isNew && products.length) {
				next(new Error('Product slug already exists'));
			}
			if (!validateName(that.name)) {
				next(new Error('Product name is required'));
			}
			if (!validatePrice(that.price)) {
				next(new Error('Product price is required'));
			}
			next();
		});
	}
});

module.exports = mongoose.model('Product', ProductSchema);
