'use strict';
var mongoose = require('mongoose'),
	validator = require('validator'),
	_ = require('underscore'),
	findOrCreate = require('mongoose-findorcreate'),
	ProductSchema = require('./product'),
	Schema = mongoose.Schema ;

var CategorySchema = new Schema({
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
	description: String,
	products: [{
		type: Schema.Types.ObjectId,
		ref: 'Product'
	}],
	parent_categories: [{
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}],
	child_categories: [{
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}],
	isTopLevel: {
		type: Boolean,
		default: false
	},
	sort: {
		type: Number
	},
	image_full: {
		type: String,
		default: 'placehold.it/500&text=No Full Image'
	},
	image_large: {
		type: String,
		default: 'placehold.it/500&text=No Large Image'
	},
	image_small: {
		type: String,
		default: 'placehold.it/500&text=No Small Image'
	}
});

CategorySchema.plugin(findOrCreate);

/**
 * Validations
 */
var validateName = function(name) {
	return !validator.isNull(name) && name.length;
};
var validateSlug = function(slug) {
	return !validator.isNull(slug) && validator.isLength(slug, 1)  && validator.isLowercase(slug);
};
var validateDate = function(date) {
	return validator.isDate(date) && validator.isBefore(date, new Date());
};

/**
 * Pre-save hook
 */
CategorySchema.pre('save', function(next) {

	var that = this;

	if (!validateDate(that.created)) {
		that.set('created', new Date());
	}
	that.set('updated', new Date());

	// that.updated = Date.now;
	that.slug = that.name.replace(/\W+/g,'-').replace(/^-/,'').replace(/-$/,'');

	if (!validateSlug(that.slug)) {
		next(new Error('Category slug is required'));
	} else {
		mongoose.model('Category', CategorySchema).find({slug: that.slug}, function (err, categories) {
			if (that.isNew && categories.length) {
				next(new Error('Category slug already exists'));
			}
			if (!validateName(that.name)) {
				next(new Error('Category name is required'));
			}
			next();
		});
	}

/*
	// remove this category from the parent_categories property of any category that is no longer in the category.child_categories array
	if (that.isModified('child_categories')) {
		mongoose.models.Category
			.find({parent_categories: { '$in' : [that._id]}}, function (err, child_categories) {
				if (child_categories) {
					// console.log('remove this category from the parent_categories property of any category that is no longer in the category.child_categories array');
					_.each(child_categories, function(child_category) {
						if (_.isArray(that.child_categories) && that.child_categories.indexOf(child_category._id) === -1) {
							console.log(that.slug + ' removed from ' + child_category.slug);
							child_category.parent_categories.remove(that);
							child_category.save();
						}
					});
				}
			});
	}
 */

/*
	// add this category to the parent_categories property of any category that is in the category.child_categories array
	if (that.isModified('child_categories')) {
		that.populate('child_categories', function(err, populated_category) {
			// console.log('add this category to the parent_categories property of any category that is in the category.child_categories array');
			_.each(populated_category.child_categories, function(child_category) {
				if (!that._id.equals(child_category._id)) {
					if ((!_.isArray(child_category.parent_categories) || _.isEmpty(child_category.parent_categories)) || child_category.parent_categories.indexOf(that._id) === -1) {
						console.log(that.slug + ' added to ' + child_category.slug);
						child_category.parent_categories.push(that);
						child_category.save();
					}
				}
			});
		});
	}
 */

/*
	// remove this category from any products no longer in the category.products array
	if (that.isModified('products')) {
		mongoose.models.Product
			.find({categories: { '$in' : [that._id]}}, function (err, products) {
				if (products) {
					// console.log('remove this category from any products no longer in the category.products array');
					_.each(products, function(product) {
						if ((!_.isArray(that.products) || _.isEmpty(that.products)) || that.products.indexOf(product._id) === -1) {
							if (_.isArray(product.categories) && product.categories.indexOf(that._id) !== -1) {
								console.log(that.slug + ' removed from ' + product.slug);
								product.categories.remove(that);
								product.save();
							}
						}
					});
				}
			});
	}
 */

/*
	// add this category to any products now in the category.products array
	if (that.isModified('products')) {
		that.populate('products', function(err, category) {
			// console.log('add this category to any products now in the category.products array');
			_.each(category.products, function(product) {
				if ((!_.isArray(product.categories) || _.isEmpty(product.categories)) || product.categories.indexOf(category._id) === -1) {
					if (_.isArray(category.products) || category.products.indexOf(product._id) !== -1) {
						console.log(category.slug + ' added to ' + product.slug);
						product.categories.push(category);
						product.save();
					}
				}
			});
		});
	}
 */
});

module.exports = mongoose.model('Category', CategorySchema);
