Ember-Graph
===========

Ember-Graph is a data persistence library for Ember.js with a focus on complex object graphs.

## Background

Ember-Graph was born out of necessity. Our data model had pushed Ember-Data to its limits and it was quickly becoming a problem. Contributing to Ember-Data was a potential solution, but the differences were too much; a clean break had to be made. That's when Ember-Graph was born.

## Goals

Ember-Graph was built first and foremost, to handle the data model for our proprietary application. But from discussions in the Ember community, I knew that others faced similar issues as us. So from the get-go, I built Ember-Graph with open source in mind. Ember-Graph has many unique features, but the main goals of the library are:

- Be flexible enough to handle the most complex data models.
- Have a single source of truth, and have it be as up to date as possible
- Be similar enough to Ember-Data to allow an easy transition

Other smaller goals include: enhanced schema enforcement, real-time updates and more fine-grained control of your data. After using Ember-Data for long enough, I knew the parts that I didn't like, and hoped to improve those with Ember-Graph.

## Who should use Ember-Graph?

It must be noted that Ember-Graph is not for everybody. Ember-Data is a great library and is probably more than sufficient in most cases. But there are a few cases where Ember-Data's large user base can restrict its feature set. Ember-Graph is meant to fill a small niche in the market; most users will find it to be overkill. Ember-Graph's functionality shines in the following areas.

- Complex object models. Ember-Graph was built for a highly connected object model that relied heavily on relationships.
- Large data sets. All functionality in Ember-Graph is assumed to be asynchronous, including the loading of data. Ember-Graph tries its hardest to transfer as little data as possible.
- Live data updates. Part of having a single source of truth is receiving constant updates from _the_ source of truth (your server). Ember-Graph makes it very easy to receive the latest version of your data in real time.
- Complex data modifications. Because of the nature of live data updates, it was very important that Ember-Graph be able to handle the refreshing of data, even if that data might by dirty. Ember-Graph has several features (with many more to come) that help resolve conflicts between different versions of records.

If any of the above apply to you, Ember-Graph is likely a good fit.
