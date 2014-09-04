/**
 * Main application file for: minnpost-pvi-map-2014
 *
 * This pulls in all the parts
 * and creates the main object for the application.
 */

// Create main application
define('minnpost-pvi-map-2014', [
  'jquery', 'underscore', 'ractive', 'ractive-events-tap',
  'mpConfig', 'mpFormatters', 'helpers',
  'text!templates/application.mustache',
  'text!../data/district-arrangement.json',
  'text!../data/pvi-districts.json',
], function(
  $, _, Ractive, RactiveEventsTap, mpConfig, mpFormatters,
  helpers, tApplication, dArrangement, dPVI
  ) {

  // Turn data
  dArrangement = JSON.parse(dArrangement);
  dPVI = JSON.parse(dPVI);

  // Constructor for app
  var App = function(options) {
    this.options = _.extend(this.defaultOptions, options);
    this.el = this.options.el;
    this.$el = $(this.el);
    this.$ = function(selector) { return this.$el.find(selector); };
    this.loadApp();
  };

  // Extend with custom methods
  _.extend(App.prototype, {
    // Start function
    start: function() {
      var thisApp = this;
      var arrangements = {};

      // Some data manipulation
      _.each(dArrangement, function(d, di) {
        arrangements[mpFormatters.padLeft(d[0]) + mpFormatters.padLeft(d[1])] = d[2];
      });

      // Create main application view
      this.mainView = new Ractive({
        el: this.$el,
        template: tApplication,
        data: {
          a: arrangements,
          aRows: _.range(_.max(dArrangement, function(d, di) { return d[1]; })[1] + 1),
          aColumns: _.range(_.max(dArrangement, function(d, di) { return d[0]; })[0] + 1),
          p: dPVI,
          f: mpFormatters
        },
        partials: {

        }
      });
    },


    // Default options
    defaultOptions: {
      projectName: 'minnpost-pvi-map-2014',
      remoteProxy: null,
      el: '.minnpost-pvi-map-2014-container',
      availablePaths: {
        local: {
          css: ['.tmp/css/main.css'],
          images: 'images/',
          data: 'data/'
        },
        build: {
          css: [
            '//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css',
            'dist/minnpost-pvi-map-2014.libs.min.css',
            'dist/minnpost-pvi-map-2014.latest.min.css'
          ],
          ie: [
            'dist/minnpost-pvi-map-2014.libs.min.ie.css',
            'dist/minnpost-pvi-map-2014.latest.min.ie.css'
          ],
          images: 'dist/images/',
          data: 'dist/data/'
        },
        deploy: {
          css: [
            '//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css',
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-pvi-map-2014/minnpost-pvi-map-2014.libs.min.css',
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-pvi-map-2014/minnpost-pvi-map-2014.latest.min.css'
          ],
          ie: [
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-pvi-map-2014/minnpost-pvi-map-2014.libs.min.ie.css',
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-pvi-map-2014/minnpost-pvi-map-2014.latest.min.ie.css'
          ],
          images: 'https://s3.amazonaws.com/data.minnpost/projects/minnpost-pvi-map-2014/images/',
          data: 'https://s3.amazonaws.com/data.minnpost/projects/minnpost-pvi-map-2014/data/'
        }
      }
    },

    // Load up app
    loadApp: function() {
      this.determinePaths();
      this.getLocalAssests(function(map) {
        this.renderAssests(map);
        this.start();
      });
    },

    // Determine paths.  A bit hacky.
    determinePaths: function() {
      var query;
      this.options.deployment = 'deploy';

      if (window.location.host.indexOf('localhost') !== -1) {
        this.options.deployment = 'local';

        // Check if a query string forces something
        query = helpers.parseQueryString();
        if (_.isObject(query) && _.isString(query.mpDeployment)) {
          this.options.deployment = query.mpDeployment;
        }
      }

      this.options.paths = this.options.availablePaths[this.options.deployment];
    },

    // Get local assests, if needed
    getLocalAssests: function(callback) {
      var thisApp = this;

      // If local read in the bower map
      if (this.options.deployment === 'local') {
        $.getJSON('bower.json', function(data) {
          callback.apply(thisApp, [data.dependencyMap]);
        });
      }
      else {
        callback.apply(this, []);
      }
    },

    // Rendering tasks
    renderAssests: function(map) {
      var isIE = (helpers.isMSIE() && helpers.isMSIE() <= 8);

      // Add CSS from bower map
      if (_.isObject(map)) {
        _.each(map, function(c, ci) {
          if (c.css) {
            _.each(c.css, function(s, si) {
              s = (s.match(/^(http|\/\/)/)) ? s : 'bower_components/' + s + '.css';
              $('head').append('<link rel="stylesheet" href="' + s + '" type="text/css" />');
            });
          }
          if (c.ie && isIE) {
            _.each(c.ie, function(s, si) {
              s = (s.match(/^(http|\/\/)/)) ? s : 'bower_components/' + s + '.css';
              $('head').append('<link rel="stylesheet" href="' + s + '" type="text/css" />');
            });
          }
        });
      }

      // Get main CSS
      _.each(this.options.paths.css, function(c, ci) {
        $('head').append('<link rel="stylesheet" href="' + c + '" type="text/css" />');
      });
      if (isIE) {
        _.each(this.options.paths.ie, function(c, ci) {
          $('head').append('<link rel="stylesheet" href="' + c + '" type="text/css" />');
        });
      }

      // Add a processed class
      this.$el.addClass('processed');
    }
  });

  return App;
});


/**
 * Run application
 */
require(['jquery', 'minnpost-pvi-map-2014'], function($, App) {
  $(document).ready(function() {
    var app = new App();
  });
});
