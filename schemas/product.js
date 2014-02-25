'use strict';
var mongoose = require('mongoose'),
	findOrCreate = require('mongoose-findorcreate'),
	Schema = mongoose.Schema;

var ProductSchema = new Schema({
	name: String,
	slug: String,
	price: Number
});

ProductSchema.plugin(findOrCreate);

/**
 * Validations
 */
var validatePresenceOf = function(value) {
	return value && value.length;
};
var validatePrice = function(value) {
	return value && value > 0;
};

/**
 * Pre-save hook
 */
ProductSchema.pre('save', function(next) {

	var that = this;

	that.name = that.name.trim();
	that.slug = that.name.replace(/\W+/g,'-').replace(/^-/,'').replace(/-$/,'').toLowerCase();

	if (!validatePresenceOf(that.slug)) {
		next(new Error('Product slug is required'));
	} else {
		mongoose.model('Product', ProductSchema).find({slug: that.slug}, function (err, products) {
			if (that.isNew && products.length) {
				next(new Error('Product slug already exists'));
			}
			if (!validatePresenceOf(that.name)) {
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
