'use strict';
var mongoose = require('mongoose'),
	findOrCreate = require('mongoose-findorcreate'),
	Schema = mongoose.Schema;

var ProductSchema = new Schema({
	name: String,
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

	mongoose.model('Product', ProductSchema).find({name: that.name}, function (err, products) {
		if (that.isNew && products.length) {
			next(new Error('Product already exists'));
		}
		if (!validatePresenceOf(that.name)) {
			next(new Error('Product name is required'));
		}
		if (!validatePrice(that.price)) {
			next(new Error('Product price is required'));
		}
		next();
	});
});

module.exports = mongoose.model('Product', ProductSchema);
