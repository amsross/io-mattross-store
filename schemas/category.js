'use strict';
var mongoose = require('mongoose'),
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
var validatePresenceOf = function(value) {
	return value && value.length;
};

/**
 * Pre-save hook
 */
CategorySchema.pre('save', function(next) {

	var that = this;

	// that.updated = Date.now;
	that.slug = that.name.replace(/\W+/g,'-').replace(/^-/,'').replace(/-$/,'');

	if (!validatePresenceOf(that.slug)) {
		next(new Error('Category slug is required'));
	} else {
		mongoose.model('Category', CategorySchema).find({slug: that.slug}, function (err, categories) {
			if (that.isNew && categories.length) {
				next(new Error('Category slug already exists'));
			}
			if (!validatePresenceOf(that.name)) {
				next(new Error('Category name is required'));
			}
			next();
		});
	}
});

module.exports = mongoose.model('Category', CategorySchema);
