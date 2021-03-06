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
	image_full: {
		type: String,
		default: 'placehold.it/1000&text=No Full Image'
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

	// update the meta dates
	if (!validateDate(that.created)) {
		that.set('created', new Date());
	}
	that.set('updated', new Date());

	if (!validateName(that.name)) {
		next(new Error('Product name is required'));
	} else {

		// generate a slug from the name
		that.slug = that.name.replace(/\W+/g,'-').replace(/^-/,'').replace(/-$/,'');

		// make sure this isn't a duplicate
		mongoose.model('Product', ProductSchema)
			.find({slug: that.slug}, function (err, products) {
				if (that.isNew && products.length) {
					next(new Error('Product slug already exists'));
				}
				if (!validatePrice(that.price)) {
					// make sure there is a price
					next(new Error('Product price is required'));
				}
				next();
			});
	}

	// remove this product from any categories no longer in the product.categories array
	if (that.isModified('categories')) {
		mongoose.models.Category
			.find({products: { '$in' : [that._id]}}, function (err, categories) {
				if (categories) {
					_.each(categories, function(category) {
						if ((!_.isArray(that.categories) || _.isEmpty(that.categories)) || that.categories.indexOf(category._id) === -1) {
							if (_.isArray(category.products) && category.products.indexOf(that._id) !== -1) {
								// console.log(that.slug + ' removed from ' + category.slug);
								category.products.remove(that);
								category.save();
							}
						}
					});
				}
			});
	}

	// add this product to any categories now in the product.categories array
	if (that.isModified('categories')) {
		that.populate('categories', function(err, populated_product) {
			_.each(populated_product.categories, function(category) {
				if ((!_.isArray(category.products) || _.isEmpty(category.products)) || category.products.indexOf(populated_product._id) === -1) {
					if (!_.isArray(populated_product.categories) || populated_product.categories.indexOf(category) !== -1) {
						// console.log(populated_product.slug + ' added to ' + category.slug);
						category.products.push(populated_product);
						category.save();
					}
				}
			});
		});
	}
});

module.exports = mongoose.model('Product', ProductSchema);
