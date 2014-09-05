/**
 * RequireJS config which maps out where files are and shims
 * any non-compliant libraries.
 */
require.config({
  shim: {

  },
  baseUrl: 'js',
  paths: {

    'requirejs': '../bower_components/requirejs/require',
    'almond': '../bower_components/almond/almond',
    'text': '../bower_components/text/text',
    'jquery': '../bower_components/jquery/dist/jquery',
    'underscore': '../bower_components/underscore/underscore',
    'ractive': '../bower_components/ractive/ractive',
    'ractive-events-tap': '../bower_components/ractive-events-tap/ractive-events-tap',
    'ractive-transitions-fade': '../bower_components/ractive-transitions-fade/ractive-transitions-fade',
    'chroma': '../bower_components/chroma-js/chroma',
    'leaflet': '../bower_components/leaflet/dist/leaflet-src',
    'mpConfig': '../bower_components/minnpost-styles/dist/minnpost-styles.config',
    'mpFormatters': '../bower_components/minnpost-styles/dist/minnpost-styles.formatters',
    'mpMaps': '../bower_components/minnpost-styles/dist/minnpost-styles.maps',
    'minnpost-pvi-map-2014': 'app'
  }
});
