# Ember Graph [![Build Status](https://travis-ci.org/stingerlabs/ember-graph.svg?branch=master)](https://travis-ci.org/stingerlabs/ember-graph) [![Code Climate](https://codeclimate.com/github/gordonkristan/ember-graph.png)](https://codeclimate.com/github/gordonkristan/ember-graph) [![Code Climate](https://codeclimate.com/github/gordonkristan/ember-graph/coverage.png)](https://codeclimate.com/github/gordonkristan/ember-graph)

Ember Graph is a data persistence library for Ember.js with a focus on complex object graphs.

## Background

Ember Graph was born at [greenlight.guru](http://greenlight.guru/) when our data model had pushed Ember-Data
to its limits. The functionality we needed for our data model simply wasn't in the scope for Ember-Data, which
 meant that we had to write our own data layer. We decided to make a clean break from Ember-Data and Ember Graph
 was born.

## Goals

Ember Graph was built first and foremost, to handle the data model for our proprietary application. But from discussions
in the Ember community, I knew that others faced similar issues as us. So from the get-go, I built Ember Graph with open
source in mind. Ember Graph has many unique features, but the main goals of the library are:

- Be flexible enough to handle the most complex data models.
- Have a single source of truth, and have it be as up to date as possible
- Be similar enough to Ember-Data to allow an easy transition

Other smaller goals include: enhanced schema enforcement, real-time updates and more fine-grained control of your data.
After using Ember-Data for long enough, I knew the parts that I didn't like, and hoped to improve those with
Ember Graph.

## Who should use Ember Graph?

It must be noted that Ember Graph is not for everybody. Ember-Data is a great library and is probably more than
sufficient in most cases. But there are a few cases where Ember-Data's large user base can restrict its feature set.
Ember Graph is meant to fill a small niche in the market; most users will find it to be overkill. Ember Graph's
functionality shines in the following areas.

- Complex object models. Ember Graph was built for a highly connected object model that relied heavily on relationships.
- Large data sets. All functionality in Ember Graph is assumed to be asynchronous, including the loading of data.
  Ember Graph tries its hardest to transfer as little data as possible.
- Live data updates. Part of having a single source of truth is receiving constant updates from _the_ source of truth
  (your server). Ember Graph makes it very easy to receive the latest version of your data in real time.
- Complex data modifications. Because of the nature of live data updates, it was very important that Ember Graph be able
  to handle the refreshing of data, even if that data might by dirty. Ember Graph has several features (with many more
  to come) that help resolve conflicts between different versions of records.

If any of the above apply to you, Ember Graph is likely a good fit.

## The Code

The easiest way to understand something is to see it, so let's get into some code. Declaring models is very similar to
Ember-Data.

```js
App.User = EmberGraph.Model.extend({
	name: EmberGraph.attr({
		type: 'string',
		readOnly: true
	}),

	posts: EmberGraph.hasMany({
		relatedType: 'post',
		inverse: 'author',
		isRequired: false
	})
});

App.Post = EmberGraph.Model.extend({
	title: EmberGraph.attr({
		type: 'string',
		defaultValue: '(No Subject)',
		isValid: function(value) {
			return value && value.length > 0;
		}
	}),

	postedOn: EmberGraph.attr({
		type: 'date',
		readOnly: true
	}),

	author: EmberGraph.hasOne({
		relatedType: 'user',
		inverse: 'posts'
	}),

	tags: EmberGraph.hasMany({
		relatedType: 'tag',
		inverse: null,
		defaultValue: ['1', '2']
	})
});

App.Tag = EmberGraph.Model.extend({
	title: EmberGraph.attr({
		type: 'string'
	})
});

```

We declared three related models, and most of this should be pretty familiar if you're coming from Ember-Data. And even
if you're not, the naming is pretty semantic. But to understand how the `attr`, `hasMany` and `hasOne` functions work,
look at their documentation for an in-depth description of all of their options.

Now, to see the real power of Ember Graph, let's see it in action. The most powerful feature of Ember Graph is the
single source of truth, so let's start with that. Assume that on your server, user #5 owns 3 posts: #1, #3 and #7.

```js
App.get('store').find('post', '1').then(function(post1) {
	// Get the  ID of the relationship without loading it
	console.log(post1.get('_author')); // { type: 'user', id: '5' }
	// Change the author to #7
	post1.setHasOneRelationship('author', '7');
	// Now load user #7 in the form of a promise
	return post1.get('author');
}).then(function(user7) {
	// Ember Graph is smart enough to know that we connected post #1 to user #7
	console.log(user7.get('_posts')); // [{ type: 'post', id: '1' }]
	// Let's save our user, which also returns a promise
	return user7.save();
}).then(function(user7) {
	// This is cached, so get it directly
	var post1 = App.get('store').getRecord('user', '1');
	// Ember Graph knows that the relationship was persisted
	console.log(post1.get('_author')); // { type: 'user', id: '7' }
	console.log(post1.get('isDirty')); // false

	return App.get('store').find('user', '5');
}).then(function(user5) {
	// Ember Graph knows, even if the server doesn't yet,
	// that user5 and post1 were disconnected
	console.log(user5.get('_posts')); // [{ type: 'post', id: '1' }, { type: 'post', id: '3' }]
});
```

As you can see, it doesn't matter what order you change or load the data, Ember Graph knows that when relationships are
broken and created, and it applies those changes to _all_ models, even if they haven't been loaded yet. It also
maintains state for the relationships. So at any point in time, a relationship could be: brand new and not persisted,
persisted but scheduled for deletion, or persisted and unchanged. And the best part is that these relationships can be
updated at _any_ time, even if the record is dirty. Ember Graph provides options for refreshing dirty records so that
you can _always_ have the most up-to-date information.

## Documentation

To put it nicely, the documentation for Ember Graph sucks. I simply haven't had enough time to write any good
tutorials on how to use it. I promise you that it's number 1 on my to-do list. Until then, feel free to look at
the [API documentation](http://ember-graph.com/api/EmberGraph.html#index) which isn't half bad. If you need help
beyond that, just ask me directly, I'd be glad to help.

## Getting Ember Graph

Get it from Bower:

```
bower install ember-graph-dist
```

Bower will then fetch and extract a debug build, a production build, and a minified build of Ember Graph.

## Reporting Issues

Issues can be reported right here on GitHub. In general, I tend to fix bugs within a day or two. Feature requests
are also welcome, but may take me longer to get to.

## Building Ember Graph

Building Ember Graph is fairly easy. You'll first want to clone the repository. After that, install the needed packages, including the global ones.

```
npm install -g grunt-cli
npm install -g bower
npm install
bower install
```

After that, you can either build it using `grunt release` or run development mode use `grunt develop`.
In development mode, the source and test files are recompiled as they're changed, and the test page is served at
[http://localhost:8000/test/index.html](http://localhost:8000/test/index.html).

## Sponsors and Friends

![greenlight.guru logo](https://raw.githubusercontent.com/gordonkristan/ember-graph/master/site/images/greenlight_logo_text.png)

Ember Graph wouldn't be possible without [greenlight.guru](http://greenlight.guru/), who has funded most of its
development since the beginning. It's a great company that tries to give back to the community as much as possible.
