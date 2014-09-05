/**
 * Main application file for: minnpost-pvi-map-2014
 *
 * This pulls in all the parts
 * and creates the main object for the application.
 */

// Create main application
define('minnpost-pvi-map-2014', [
  'jquery', 'underscore', 'chroma', 'leaflet',
  'ractive', 'ractive-events-tap', 'ractive-transitions-fade',
  'mpConfig', 'mpFormatters', 'mpMaps', 'helpers',
  'text!templates/application.mustache',
  'text!../data/district-arrangement.json',
  'text!../data/pvi-districts.json',
], function(
  $, _, chroma, L, Ractive, RactiveEventsTap, RactiveTransitionsFade,
  mpConfig, mpFormatters, mpMaps,
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
      var colorPoints = ['#0793AB', 'FFFFFF', '#A1000F'];
      var pviPoints = [-20, -10, -5, 0, 5, 10, 20];
      var pviIntervals = 8;
      var cRange;

      // Some data manipulation
      _.each(dArrangement, function(d, di) {
        arrangements[mpFormatters.padLeft(d[0]) + mpFormatters.padLeft(d[1])] = d[2];
      });
      _.each(dPVI, function(d, di) {
        d.PVI14 = parseFloat(d.PVI14);
        d.margin12 = parseFloat(d.margin12);
        d.challengers = [];
        d.pviStrength = Math.abs(d.PVI14);
        d.pviLevel = (d.pviStrength <= 5) ? 1 :
          (d.pviStrength > 5 && d.pviStrength <= 10) ? 2 :
          (d.pviStrength > 10 && d.pviStrength <= 15) ? 3 :
          (d.pviStrength > 15) ? 4 : 0;
        d.pviParty = (d.PVI14 < 0) ? 'dfl' : 'r';
        d.incumbentSameAsPVI = (d.pviParty ===  d['Incumbent Party'].toLowerCase());
        d.incumbentPartyChallenger = false;

        // Put challengers into an array
        _.each(['Challenger 1', 'Challenger 2', 'Challenger 3'], function(c, ci) {
          if (d[c]) {
            d.challengers.push({
              name: d[c],
              party: d[c + ' Party']
            });

            // Test if there is a same-party challenger
            if (d[c + ' Party'] === d['Incumbent Party']) {
              d.incumbentPartyChallenger = true;
            }
          }
        });

        d[di] = d;
      });

      // Color range
      cRange = chroma.scale(colorPoints).mode('hsl')
        .domain(pviPoints, pviIntervals);

      // Add formatter to remove leading zero
      mpFormatters.removeLead = function(input) {
        return (input.indexOf('0') === 0) ? input.substring(1) : input;
      };

      // Create main application view
      this.mainView = new Ractive({
        el: this.$el,
        template: tApplication,
        data: {
          a: arrangements,
          gs: 27,
          aRows: _.range(_.max(dArrangement, function(d, di) { return d[1]; })[1] + 1),
          aColumns: _.range(_.max(dArrangement, function(d, di) { return d[0]; })[0] + 1),
          p: dPVI,
          r: cRange,
          rc: cRange.colors(),
          rd: cRange.domain(),
          f: mpFormatters,
          fg: this.makeFGColor
        },
        partials: {

        },
        decorators: {
          map: this.mapDecorator
        }
      });

      // Observation arrangement
      this.mainView.observe('a', function(n, o) {
        if (_.isObject(n) && _.size(n) > 0) {
          this.set('gs', (thisApp.$('.arrangement').width() / this.get('aColumns').length) - 7);
        }
      }, {
        defer: true
      });

      // Observe selected district
      this.mainView.observe('district', function(n, o) {
        var thisView = this;
        var boundary = this.get('p.' + n.District + '.boundary');
        var bID = mpFormatters.removeLead(n.District.toLowerCase());

        if (_.isObject(n) && !_.isObject(boundary)) {
          // Boundary service doesn't want leading zero
          $.getJSON(thisApp.options.boundaryAPI.replace('[[[ID]]]', bID))
            .done(function(data) {
              var current = thisView.get('district');

              if (_.isObject(data)) {
                // Set on dataset
                thisView.set('p.' + n.District + '.boundary', data);
                // Set on current district if still the same
                if (current && n && current.District === n.District) {
                  thisView.set('district.boundary', data);
                }
              }
            });
        }
      });

      // Handle events
      this.mainView.on('selectDistrict', function(e, district) {
        e.original.preventDefault();
        var thisView = this;
        var current = this.get('district');
        var same = (_.isObject(current)) ? (current.District === district) : false;

        // Mark as viewed so that the placeholder will not show up
        // everytime
        this.set('placeholderSeen', true);

        // Make sure there is something and its different
        if (!same && _.isObject(dPVI[district])) {
          this.set('district', undefined).then(function() {
            thisView.set('district', dPVI[district]);
          });
        }
      });
    },

    // Given a color, figure out the best foreground color
    // for text
    makeFGColor: function(bg) {
      var l = chroma(bg).luminance();
      return (l < 0.5) ? '#FFFFFF' : '#282828';
    },

    // Ractive decorator for making a map
    mapDecorator: function (node, shape) {
      var map, layer;

      // Add map
      if (!_.isObject(map) && _.isObject(shape)) {
        map = mpMaps.makeLeafletMap(node);
        map.removeControl(map.zoomControl);
        map.addControl(new L.Control.Zoom({ position: 'topright' }));
        layer = L.geoJson(shape, {
          style: mpMaps.mapStyle
        }).addTo(map);
        map.fitBounds(layer.getBounds());
        //map.zoomOut();
        map.invalidateSize();
      }

      return {
        teardown: function () {
          if (_.isObject(map)) {
            map.remove();
          }
        }
      };
    },

    // Default options
    defaultOptions: {
      projectName: 'minnpost-pvi-map-2014',
      remoteProxy: null,
      el: '.minnpost-pvi-map-2014-container',
      boundaryAPI: '//boundaries.minnpost.com/1.0/boundary/[[[ID]]]-state-house-district-2012?callback=?',
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
