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

	// remove this category from the parent_categories property of any category that is no longer in the category.child_categories array
	mongoose.models.Category
		.find({parent_categories: { '$in' : [that._id]}}, function (err, child_categories) {
			if (child_categories) {
				_.each(child_categories, function(child_category) {
					if ((that.child_categories||[]).indexOf(child_category._id) === -1) {
						child_category.parent_categories.remove(that);
						child_category.save();
					}
				});
			}
		});

	// add this category to the parent_categories property of any category that is in the category.child_categories array
	that.populate('child_categories', function(err, populated_category) {
		_.each(populated_category.child_categories, function(child_category) {
			if (!that._id.equals(child_category._id)) {
				if ((child_category.parent_categories||[]).indexOf(that._id) === -1) {
					child_category.parent_categories.push(that);
					child_category.save();
				}
			}
		});
	});

	// remove this category from any products no longer in the category.products array
	mongoose.models.Product
		.find({categories: { '$in' : [that._id]}}, function (err, products) {
			if (products) {
				_.each(products, function(product) {
					if ((that.products||[]).indexOf(product._id) === -1) {
						product.categories.remove(that);
						product.save();
					}
				});
			}
		});

	// add this category to any products now in the category.products array
	that.populate('products', function(err, that) {
		_.each(that.products, function(product) {
			if ((product.categories||[]).indexOf(that._id) === -1) {
				product.categories.push(that);
				product.save();
			}
		});
	});
});

module.exports = mongoose.model('Category', CategorySchema);
