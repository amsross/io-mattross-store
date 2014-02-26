'use strict';
var mongoose = require('mongoose'),
	validator = require('validator'),
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
	products: [{
		type: Schema.Types.ObjectId,
		ref: 'Product'
	}],
	sub_categories: [{
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}]
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

/**
 * Pre-save hook
 */
CategorySchema.pre('save', function(next) {

	var that = this;

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
});

module.exports = mongoose.model('Category', CategorySchema);