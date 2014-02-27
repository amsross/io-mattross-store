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
	description: String,
	price: Number,
	categories: [{
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}],
	isFeatured: {
		type: Boolean,
		default: false
	},
	image_large: {
		type: String,
		default: 'placehold.it/500&text=No Large Image'
	},
	image_small: {
		type: String,
		default: 'placehold.it/200&text=No Small Image'
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

	if (!validateName(that.name)) {
		next(new Error('Product name is required'));
	} else {
		mongoose.model('Product', ProductSchema)
			.find({slug: that.slug}, function (err, products) {
				if (that.isNew && products.length) {
					next(new Error('Product slug already exists'));
				}
				if (!validatePrice(that.price)) {
					next(new Error('Product price is required'));
				}
				next();
			});
	}

	// remove this product from any categories no longer in the product.categories array
	mongoose.models.Category
		.find({products: { '$in' : [that._id]}}, function (err, categories) {
			if (categories) {
				console.log(categories);
				_.each(categories, function(category) {
					if ((that.categories||[]).indexOf(category._id) === -1) {
						category.products.remove(that);
						category.save();
					}
				});
			}
		});

	// add this product to any categories now in the product.categories array
	that.populate('categories', function(err, that) {
		_.each(that.categories, function(category) {
			if ((category.products||[]).indexOf(that._id) === -1) {
				category.products.push(that);
				category.save();
			}
		});
	});
});

module.exports = mongoose.model('Product', ProductSchema);
