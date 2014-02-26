'use strict';
var mongoose = require('mongoose'),
	validator = require('validator'),
	_ = require('underscore'),
	findOrCreate = require('mongoose-findorcreate'),
	CategorySchema = require('./category'),
	Schema = mongoose.Schema;

var ProductSchema = new Schema({
	created: Date,
	updated: Date,
	name: {
		type: String,
		trim: true
	},
	slug: {
		type: String,
		lowercase: true,
		trim: true
	},
	price: Number,
	categories: [{
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}],
	isFeatured: {
		type: Boolean,
		default: false
	}
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
var validateDate = function(date) {
	return validator.isDate(date) && validator.isBefore(date, new Date());
};

/**
 * Pre-save hook
 */
ProductSchema.pre('save', function(next) {

	var that = this;

	if (!validateDate(that.created)) {
		that.set('created', new Date());
	}
	that.set('updated', new Date());

	that.slug = that.name.replace(/\W+/g,'-').replace(/^-/,'').replace(/-$/,'');

	if (!validateSlug(that.slug)) {
		next(new Error('Product slug is required'));
	} else {
		mongoose.model('Product', ProductSchema)
			.find({slug: that.slug}, function (err, products) {
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
