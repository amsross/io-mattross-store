'use strict';
var mongoose = require('mongoose'),
	validator = require('validator'),
	_ = require('underscore'),
	findOrCreate = require('mongoose-findorcreate'),
	Schema = mongoose.Schema ;

var PageSchema = new Schema({
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
	parent_pages: [{
		type: Schema.Types.ObjectId,
		ref: 'Page'
	}],
	child_pages: [{
		type: Schema.Types.ObjectId,
		ref: 'Page'
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

PageSchema.plugin(findOrCreate);

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
PageSchema.pre('save', function(next) {

	var that = this;

	if (!validateDate(that.created)) {
		that.set('created', new Date());
	}
	that.set('updated', new Date());

	// that.updated = Date.now;
	that.slug = that.name.replace(/\W+/g,'-').replace(/^-/,'').replace(/-$/,'');

	if (!validateSlug(that.slug)) {
		next(new Error('Page slug is required'));
	} else {
		mongoose.model('Page', PageSchema).find({slug: that.slug}, function (err, pages) {
			if (that.isNew && pages.length) {
				next(new Error('Page slug already exists'));
			}
			if (!validateName(that.name)) {
				next(new Error('Page name is required'));
			}
			next();
		});
	}

	// remove this page from the parent_pages property of any page that is no longer in the page.child_pages array
	if (that.isModified('child_pages')) {
		mongoose.models.Page
			.find({parent_pages: { '$in' : [that._id]}}, function (err, child_pages) {
				if (child_pages) {
					_.each(child_pages, function(child_page) {
						if (_.isArray(that.child_pages) && that.child_pages.indexOf(child_page._id) === -1) {
							// console.log(that.slug + ' removed from ' + child_page.slug);
							child_page.parent_pages.remove(that);
							child_page.save();
						}
					});
				}
			});
	}

	// add this page to the parent_pages property of any page that is in the page.child_pages array
	if (that.isModified('child_pages')) {
		that.populate('child_pages', function(err, populated_page) {
			_.each(populated_page.child_pages, function(child_page) {
				if (!populated_page._id.equals(child_page._id)) {
					if ((!_.isArray(child_page.parent_pages) || _.isEmpty(child_page.parent_pages)) || child_page.parent_pages.indexOf(populated_page._id) === -1) {
						if (_.isArray(populated_page.child_pages) || populated_page.child_pages.indexOf(child_page) !== -1) {
							// console.log(populated_page.slug + ' added to ' + child_page.slug);
							child_page.parent_pages.push(populated_page);
							child_page.save();
						}
					}
				}
			});
		});
	}
});

module.exports = mongoose.model('Page', PageSchema);
