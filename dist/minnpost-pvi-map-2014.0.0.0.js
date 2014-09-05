
/**
 * Helpers functions such as formatters or extensions
 * to libraries.
 */
define('helpers', ['jquery', 'underscore'],
  function($, _) {

  var helpers = {};

  /**
   * Override Backbone's ajax call to use JSONP by default as well
   * as force a specific callback to ensure that server side
   * caching is effective.
   */
  helpers.overrideBackboneAJAX = function() {
    Backbone.ajax = function() {
      var options = arguments;

      if (options[0].dataTypeForce !== true) {
        options[0].dataType = 'jsonp';
        options[0].jsonpCallback = 'mpServerSideCachingHelper' +
          _.hash(options[0].url);
      }
      return Backbone.$.ajax.apply(Backbone.$, options);
    };
  };

  /**
   * Returns version of MSIE.
   */
  helpers.isMSIE = function() {
    var match = /(msie) ([\w.]+)/i.exec(navigator.userAgent);
    return match ? parseInt(match[2], 10) : false;
  };

  /**
   * Wrapper for a JSONP request, the first set of options are for
   * the AJAX request, while the other are from the application.
   */
  helpers.jsonpRequest = function(requestOptions, appOptions) {
    options.dataType = 'jsonp';
    options.jsonpCallback = 'mpServerSideCachingHelper' +
      _.hash(options.url);

    if (appOptions.remoteProxy) {
      options.url = options.url + '&callback=mpServerSideCachingHelper';
      options.url = appOptions.remoteProxy + encodeURIComponent(options.url);
      options.cache = true;
    }

    return $.ajax.apply($, [options]);
  };

  /**
   * Data source handling.  For development, we can call
   * the data directly from the JSON file, but for production
   * we want to proxy for JSONP.
   *
   * `name` should be relative path to dataset
   * `options` are app options
   *
   * Returns jQuery's defferred object.
   */
  helpers.getLocalData = function(name, options) {
    var useJSONP = false;
    var defers = [];
    name = (_.isArray(name)) ? name : [ name ];

    // If the data path is not relative, then use JSONP
    if (options && options.paths && options.paths.data.indexOf('http') === 0) {
      useJSONP = true;
    }

    // Go through each file and add to defers
    _.each(name, function(d) {
      var defer;

      if (useJSONP) {
        defer = helpers.jsonpRequest({
          url: proxyPrefix + encodeURI(options.paths.data + d)
        }, options);
      }
      else {
        defer = $.getJSON(options.paths.data + d);
      }
      defers.push(defer);
    });

    return $.when.apply($, defers);
  };

  /**
   * Reads query string and turns into object.
   */
  helpers.parseQueryString = function() {
    var assoc  = {};
    var decode = function(s) {
      return decodeURIComponent(s.replace(/\+/g, " "));
    };
    var queryString = location.search.substring(1);
    var keyValues = queryString.split('&');

    _.each(keyValues, function(v, vi) {
      var key = v.split('=');
      if (key.length > 1) {
        assoc[decode(key[0])] = decode(key[1]);
      }
    });

    return assoc;
  };

  return helpers;
});


define('text!templates/application.mustache',[],function () { return '<div class="application-container">\n  <div class="message-container"></div>\n\n  <div class="content-container">\n    <div class="row">\n      <div class="column-medium-66">\n        <table class="arrangement">\n          <tbody>\n            {{#aRows:ar}}\n              <tr>\n                {{#aColumns:ac}}\n                  <td>\n                    <div\n                      on-tap="selectDistrict:{{ a[f.padLeft(ac) + f.padLeft(ar)] }}"\n                      class="grid\n                        {{#(a[f.padLeft(ac) + f.padLeft(ar)])}}has-value{{/()}}\n                        {{#(district[\'District\'] === a[f.padLeft(ac) + f.padLeft(ar)])}}active{{/()}}\n                      "\n                      style="\n                        background-color: {{ r(p[a[f.padLeft(ac) + f.padLeft(ar)]].PVI14).hex() }};\n                        color: {{ fg(r(p[a[f.padLeft(ac) + f.padLeft(ar)]].PVI14).hex()) }};\n                        width: {{ gs }}px;\n                        height: {{ gs }}px;\n                        font-size: {{ gs * 0.3 }}px;\n                        line-height: {{ gs * 0.9 }}px;\n                      "\n                        title="{{#(a[f.padLeft(ac) + f.padLeft(ar)])}}District {{ a[f.padLeft(ac) + f.padLeft(ar)] }}{{/()}}">\n                      {{ a[f.padLeft(ac) + f.padLeft(ar)] }}\n                    </div>\n                  </td>\n                {{/aColumns}}\n              </tr>\n            {{/aRows}}\n\n            <tr class="place-labels">\n              <td colspan="8">Greater Minnesota</td>\n              <td colspan="{{ aColumns.length - 8 }}">Metro area</td>\n            </tr>\n          </tbody>\n        </table>\n\n        <div class="legend">\n          {{#rc:i}}\n            <div class="legend-item">\n              <div class="legend-item-color" style="background-color: {{ this }};"></div>\n\n              <div class="legend-item-text">\n                {{#(i === 0)}} {{ f.number(Math.abs(rd[i + 1]), 0) }}+ {{/()}}\n                {{#(i === rc.length - 1)}} {{ f.number(Math.abs(rd[i]), 0) }}+ {{/()}}\n                {{#(i !== rc.length - 1 && i !== 0)}}\n                  {{ f.number(Math.abs(rd[i]), 0) }} - {{ f.number(Math.abs(rd[i + 1]), 0) }}\n                {{/()}}\n                <br>\n                {{#(rd[i] < 0) }}DFL{{/()}}\n                {{#(rd[i] >= 0) }}R{{/()}}\n              </div>\n            </div>\n          {{/rc}}\n        </div>\n      </div>\n\n      <div class="column-medium-33">\n        {{#(!district && !placeholderSeen)}}\n          <p class="details-placeholder small em">Click on a district to see PVI and candidate details.</p>\n        {{/()}}\n        {{#district}}\n          <div class="district-display" intro="fade" outro="fade">\n            <h3>District {{ district[\'District\'] }}</h3>\n\n            <p>\n              With a PVI of <strong>{{ f.number(district[\'PVI14\'], 1) }}</strong>,\n              district {{ district[\'District\'] }} is\n\n              <em>\n                {{#(district.pviLevel === 1)}}slightly{{/()}}\n                {{#(district.pviLevel === 2)}}somewhat{{/()}}\n                {{#(district.pviLevel === 3)}}significantly{{/()}}\n                {{#(district.pviLevel === 4)}}very{{/()}}\n              </em>\n\n              {{#(district[\'PVI14\'] < 0)}}DFL{{/()}}\n              {{#(district[\'PVI14\'] > 0)}}Republican{{/()}} leaning.\n\n              {{#district.Incumbent}}\n                The {{ district[\'Incumbent Party\'] }} incumbent\n                {{ district.Incumbent}} might have\n\n                {{#(district.pviLevel === 1)}}a very competitive{{/()}}\n                {{#(district.pviLevel === 2)}}a competitive{{/()}}\n                {{#(district.pviLevel === 3)}}an easy{{/()}}\n                {{#(district.pviLevel === 4)}}a very easy{{/()}}\n\n                race against challengers\n\n                {{#district.challengers}}\n                  {{ .name }} ({{ .party }}),\n                {{/district.challengers}}\n\n              {{/district.Incumbent}}\n            </p>\n\n            {{#district.boundary.simple_shape }}\n              <div class="map" decorator="map:{{ this }}"></div>\n            {{/district.boundary.simple_shape}}\n            {{^district.boundary.simple_shape}}\n              <div class="loading-container">\n                <i class="loading"></i> Loading map...\n              </div>\n            {{/district.boundary.simple_shape}}\n          </div>\n        {{/district}}\n      </div>\n    </div>\n\n  </div>\n\n  <div class="footnote-container">\n    <div class="footnote">\n      <p>Partisan Voting Index (PVI) created by MinnPost using past election results data provided by the Office of the Minnesota Secretary of State.  Some code, techniques, and data on <a href="https://github.com/minnpost/minnpost-pvi-map-2014" target="_blank">Github</a>.</p>\n\n    </div>\n  </div>\n</div>\n';});


define('text!../data/district-arrangement.json',[],function () { return '[[1,0,"02A"],[0,1,"01A"],[1,1,"01B"],[2,1,"02B"],[3,1,"06A"],[4,1,"06B"],[5,1,"03B"],[6,1,"03A"],[0,2,"04A"],[1,2,"04B"],[2,2,"05A"],[3,2,"05B"],[4,2,"07B"],[5,2,"07A"],[0,3,"08A"],[1,3,"08B"],[2,3,"10A"],[3,3,"10B"],[4,3,"11A"],[10,3,"30A"],[11,3,"30B"],[12,3,"35A"],[13,3,"35B"],[14,3,"31B"],[15,3,"32B"],[0,4,"12A"],[1,4,"09A"],[2,4,"09B"],[3,4,"15B"],[4,4,"11B"],[9,4,"34A"],[10,4,"36A"],[11,4,"36B"],[12,4,"37A"],[13,4,"37B"],[14,4,"38A"],[15,4,"38B"],[16,4,"39A"],[0,5,"12B"],[1,5,"13A"],[2,5,"13B"],[3,5,"15A"],[4,5,"32A"],[9,5,"34B"],[10,5,"40A"],[11,5,"40B"],[12,5,"41A"],[13,5,"41B"],[14,5,"42A"],[15,5,"42B"],[16,5,"43A"],[0,6,"17A"],[1,6,"17B"],[2,6,"14A"],[3,6,"14B"],[4,6,"31A"],[8,6,"44A"],[9,6,"45A"],[10,6,"45B"],[11,6,"59A"],[12,6,"60A"],[13,6,"66A"],[14,6,"66B"],[15,6,"67A"],[16,6,"43B"],[17,6,"39B"],[0,7,"16A"],[1,7,"18A"],[2,7,"29A"],[3,7,"29B"],[9,7,"44B"],[10,7,"46A"],[11,7,"59B"],[12,7,"60B"],[13,7,"64A"],[14,7,"65A"],[15,7,"67B"],[16,7,"53A"],[0,8,"16B"],[1,8,"18B"],[2,8,"47A"],[3,8,"33A"],[9,8,"33B"],[10,8,"46B"],[11,8,"61A"],[12,8,"62A"],[13,8,"63A"],[14,8,"65B"],[15,8,"53B"],[16,8,"54B"],[0,9,"19A"],[1,9,"20A"],[2,9,"20B"],[3,9,"58B"],[4,9,"21A"],[5,9,"21B"],[9,9,"48A"],[10,9,"49A"],[11,9,"61B"],[12,9,"62B"],[13,9,"63B"],[14,9,"64B"],[15,9,"52A"],[16,9,"54A"],[0,10,"22B"],[1,10,"19B"],[2,10,"23B"],[3,10,"25B"],[4,10,"24B"],[5,10,"25A"],[6,10,"28A"],[9,10,"47B"],[10,10,"48B"],[11,10,"49B"],[12,10,"50A"],[13,10,"50B"],[14,10,"51A"],[15,10,"51B"],[16,10,"52B"],[0,11,"22A"],[1,11,"23A"],[2,11,"24A"],[3,11,"26B"],[4,11,"26A"],[5,11,"27A"],[6,11,"27B"],[7,11,"28B"],[10,11,"55A"],[11,11,"55B"],[12,11,"56A"],[13,11,"56B"],[14,11,"58A"],[15,11,"57A"],[16,11,"57B"]]\n';});


define('text!../data/pvi-districts.json',[],function () { return '{"41A": {"District": "41A", "margin12": "-23.5", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JEFF PHILLIPS", "PVI14": "-19.62792406", "Challenger 3 Party": "", "Incumbent": "CONNIE BERNARDY", "Challenger 2 Party": ""}, "41B": {"District": "41B", "margin12": "-30.73", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "TIM UTZ", "Challenger 1": "CAMDEN PIKE", "PVI14": "-23.68230406", "Challenger 3 Party": "", "Incumbent": "CAROLYN LAINE", "Challenger 2 Party": "CP"}, "37A": {"District": "37A", "margin12": "-14.54", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "MANDY BENZ", "PVI14": "-13.34325125", "Challenger 3 Party": "", "Incumbent": "JERRY NEWTON", "Challenger 2 Party": ""}, "37B": {"District": "37B", "margin12": "8", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "SUSAN WITT", "PVI14": "8.302376864", "Challenger 3 Party": "", "Incumbent": "TIM SANDERS", "Challenger 2 Party": ""}, "29B": {"District": "29B", "margin12": "7.89", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "12.60390999", "Challenger 3 Party": "", "Incumbent": "MARION O\'NEILL", "Challenger 2 Party": ""}, "29A": {"District": "29A", "margin12": "24.16", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "27.3973738", "Challenger 3 Party": "", "Incumbent": "JOE MCDONALD", "Challenger 2 Party": ""}, "60A": {"District": "60A", "margin12": "-64.14", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "BRENT MILLSOP", "PVI14": "-60.61980367", "Challenger 3 Party": "", "Incumbent": "DIANE LOEFFLER", "Challenger 2 Party": ""}, "53B": {"District": "53B", "margin12": "9.78", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "KELLY FENTON", "Challenger 1": "KAY HENDRIKSON", "PVI14": "4.676941894", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "R"}, "12A": {"District": "12A", "margin12": "-1.2", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JEFF BACKER", "PVI14": "7.143330362", "Challenger 3 Party": "", "Incumbent": "JAY MCNAMAR", "Challenger 2 Party": ""}, "12B": {"District": "12B", "margin12": "32.71", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "GORDON (GORDY) WAGNER", "PVI14": "46.33987329", "Challenger 3 Party": "", "Incumbent": "PAUL ANDERSON", "Challenger 2 Party": ""}, "02A": {"District": "02A", "margin12": "-9.31", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DAVE HANCOCK", "PVI14": "-4.387150035", "Challenger 3 Party": "", "Incumbent": "ROGER ERICKSON", "Challenger 2 Party": ""}, "53A": {"District": "53A", "margin12": "-12.54", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "LUKAS CZECH", "PVI14": "-14.49891409", "Challenger 3 Party": "", "Incumbent": "JOANN WARD", "Challenger 2 Party": ""}, "02B": {"District": "02B", "margin12": "2", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "DAVID SOBIESKI", "PVI14": "-0.116624542", "Challenger 3 Party": "", "Incumbent": "STEVE GREEN", "Challenger 2 Party": ""}, "67A": {"District": "67A", "margin12": "-56.13", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ANDREW LIVINGSTON", "PVI14": "-52.32372048", "Challenger 3 Party": "", "Incumbent": "TIM MAHONEY", "Challenger 2 Party": ""}, "67B": {"District": "67B", "margin12": "-51.86", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JOHN T. QUINN", "PVI14": "-45.79737131", "Challenger 3 Party": "", "Incumbent": "SHELDON JOHNSON", "Challenger 2 Party": ""}, "54B": {"District": "54B", "margin12": "15.01", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "DONALD SLATEN", "PVI14": "20.611784", "Challenger 3 Party": "", "Incumbent": "DENNY MCNAMARA", "Challenger 2 Party": ""}, "54A": {"District": "54A", "margin12": "-16.86", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "MATTHEW KOWALSKI", "PVI14": "-9.267581735", "Challenger 3 Party": "", "Incumbent": "DAN SCHOEN", "Challenger 2 Party": ""}, "40B": {"District": "40B", "margin12": "-42.74", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "MALI MARVIN", "PVI14": "-32.57955847", "Challenger 3 Party": "", "Incumbent": "DEBRA HILSTROM", "Challenger 2 Party": ""}, "40A": {"District": "40A", "margin12": "-97.18", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "CHARLES (CHUCK) SUTPHEN", "PVI14": "-49.16860915", "Challenger 3 Party": "", "Incumbent": "MICHAEL NELSON", "Challenger 2 Party": ""}, "01A": {"District": "01A", "margin12": "20.39", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "BRUCE PATTERSON", "PVI14": "9.415101189", "Challenger 3 Party": "", "Incumbent": "DAN FABIAN", "Challenger 2 Party": ""}, "28A": {"District": "28A", "margin12": "-33.6", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "LYNAE HAHN", "PVI14": "-26.3955084", "Challenger 3 Party": "", "Incumbent": "GENE P PELOWSKI JR", "Challenger 2 Party": ""}, "28B": {"District": "28B", "margin12": "16.8", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JON PIEPER", "PVI14": "13.71964978", "Challenger 3 Party": "", "Incumbent": "GREGORY M. DAVIDS", "Challenger 2 Party": ""}, "01B": {"District": "01B", "margin12": "3.95", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "ERIC BERGESON", "PVI14": "-3.842167034", "Challenger 3 Party": "", "Incumbent": "DEBRA (DEB) KIEL", "Challenger 2 Party": ""}, "44B": {"District": "44B", "margin12": "-11.79", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "RYAN RUTZICK", "Challenger 1": "JON APPLEBAUM", "PVI14": "-5.691491551", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "R"}, "44A": {"District": "44A", "margin12": "2.57", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "AUDREY BRITTON", "PVI14": "13.0455666", "Challenger 3 Party": "", "Incumbent": "SARAH ANDERSON", "Challenger 2 Party": ""}, "13B": {"District": "13B", "margin12": "20.6", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "16.94062362", "Challenger 3 Party": "", "Incumbent": "TIM O\'DRISCOLL", "Challenger 2 Party": ""}, "13A": {"District": "13A", "margin12": "18.28", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "EMILY JENSEN", "PVI14": "-6.844607407", "Challenger 3 Party": "", "Incumbent": "JEFF HOWE", "Challenger 2 Party": ""}, "49A": {"District": "49A", "margin12": "-11.72", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DARIO ANSELMO", "PVI14": "-1.154977486", "Challenger 3 Party": "", "Incumbent": "RON ERHARDT", "Challenger 2 Party": ""}, "49B": {"District": "49B", "margin12": "-6.76", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "BARB SUTTER", "PVI14": "-3.211975607", "Challenger 3 Party": "", "Incumbent": "PAUL ROSENTHAL", "Challenger 2 Party": ""}, "21B": {"District": "21B", "margin12": "16.01", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "M.A. SCHNEIDER", "PVI14": "15.66432361", "Challenger 3 Party": "", "Incumbent": "STEVE DRAZKOWSKI", "Challenger 2 Party": ""}, "21A": {"District": "21A", "margin12": "15.14", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "LYNN SCHOEN", "PVI14": "15.25447067", "Challenger 3 Party": "", "Incumbent": "TIM KELLY", "Challenger 2 Party": ""}, "09A": {"District": "09A", "margin12": "16.11", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "DAN BYE", "PVI14": "12.34058469", "Challenger 3 Party": "", "Incumbent": "MARK ANDERSON", "Challenger 2 Party": ""}, "09B": {"District": "09B", "margin12": "6.06", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "AL DOTY", "PVI14": "7.488355067", "Challenger 3 Party": "", "Incumbent": "RON KRESHA", "Challenger 2 Party": ""}, "66B": {"District": "66B", "margin12": "-58.9", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "LIZZ PAULSON", "PVI14": "-52.75356953", "Challenger 3 Party": "", "Incumbent": "JOHN LESCH", "Challenger 2 Party": ""}, "66A": {"District": "66A", "margin12": "-31.89", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JON HEYER", "PVI14": "-28.37965252", "Challenger 3 Party": "", "Incumbent": "ALICE HAUSMAN", "Challenger 2 Party": ""}, "64A": {"District": "64A", "margin12": "-57.84", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ANDREW BROWN", "PVI14": "-58.06558719", "Challenger 3 Party": "", "Incumbent": "ERIN MURPHY", "Challenger 2 Party": ""}, "64B": {"District": "64B", "margin12": "-44.51", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "DAVE PINTO", "Challenger 1": "DANIEL SURMAN", "PVI14": "-42.73616647", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "DFL"}, "51A": {"District": "51A", "margin12": "-11.21", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ANDREA TODD-HARLIN", "PVI14": "-4.796473124", "Challenger 3 Party": "", "Incumbent": "SANDRA MASIN", "Challenger 2 Party": ""}, "51B": {"District": "51B", "margin12": "-3.87", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JEN WILSON", "PVI14": "-0.709947338", "Challenger 3 Party": "", "Incumbent": "LAURIE HALVERSON", "Challenger 2 Party": ""}, "43B": {"District": "43B", "margin12": "-21.04", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JUSTICE B. WHITETHORN", "PVI14": "-23.07506828", "Challenger 3 Party": "", "Incumbent": "LEON M. LILLIE", "Challenger 2 Party": ""}, "43A": {"District": "43A", "margin12": "-5.63", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "STACEY STOUT", "PVI14": "-6.226663421", "Challenger 3 Party": "", "Incumbent": "PETER M FISCHER", "Challenger 2 Party": ""}, "05B": {"District": "05B", "margin12": "-6.96", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JUSTIN EICHORN", "PVI14": "-4.249005146", "Challenger 3 Party": "", "Incumbent": "TOM ANZELC", "Challenger 2 Party": ""}, "38A": {"District": "38A", "margin12": "16.15", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "PAT DAVERN", "PVI14": "14.8935426", "Challenger 3 Party": "", "Incumbent": "LINDA RUNBECK", "Challenger 2 Party": ""}, "38B": {"District": "38B", "margin12": "4.76", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "GREG M. PARISEAU", "PVI14": "12.31075069", "Challenger 3 Party": "", "Incumbent": "MATT DEAN", "Challenger 2 Party": ""}, "24A": {"District": "24A", "margin12": "4.58", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "BEVERLY CASHMAN", "PVI14": "-11.3186459", "Challenger 3 Party": "", "Incumbent": "JOHN PETERSBURG", "Challenger 2 Party": ""}, "24B": {"District": "24B", "margin12": "-13.52", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "BRIAN DANIELS", "PVI14": "-8.445674244", "Challenger 3 Party": "", "Incumbent": "PATTI FRITZ", "Challenger 2 Party": ""}, "10B": {"District": "10B", "margin12": "-1.47", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DALE K LUECK", "PVI14": "-4.351757483", "Challenger 3 Party": "", "Incumbent": "JOE RADINOVICH", "Challenger 2 Party": ""}, "10A": {"District": "10A", "margin12": "-14.1", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JOSHUA HEINTZEMAN", "PVI14": "-14.12174276", "Challenger 3 Party": "", "Incumbent": "JOHN WARD", "Challenger 2 Party": ""}, "04B": {"District": "04B", "margin12": "-30.54", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JARED LADUKE", "PVI14": "-33.15106326", "Challenger 3 Party": "", "Incumbent": "PAUL MARQUART", "Challenger 2 Party": ""}, "04A": {"District": "04A", "margin12": "-9.77", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "BRIAN E. GRAMER", "PVI14": "8.796801838", "Challenger 3 Party": "", "Incumbent": "BEN LIEN", "Challenger 2 Party": ""}, "58B": {"District": "58B", "margin12": "19.03", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "MARLA VAGTS", "PVI14": "21.1710038", "Challenger 3 Party": "", "Incumbent": "PAT GAROFALO", "Challenger 2 Party": ""}, "58A": {"District": "58A", "margin12": "18.29", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "AMY WILLINGHAM", "Challenger 1": "JON KOZNICK", "PVI14": "25.03739901", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "DFL"}, "30A": {"District": "30A", "margin12": "27.59", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "BRENDEN ELLINGBOE", "PVI14": "27.05971778", "Challenger 3 Party": "", "Incumbent": "NICK ZERWAS", "Challenger 2 Party": ""}, "30B": {"District": "30B", "margin12": "23.85", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "SHARON G. SHIMEK", "Challenger 1": "ERIC LUCERO", "PVI14": "27.06864992", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "DFL"}, "52A": {"District": "52A", "margin12": "-25.09", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JOE BLUM", "PVI14": "-24.98394128", "Challenger 3 Party": "", "Incumbent": "RICK HANSEN", "Challenger 2 Party": ""}, "52B": {"District": "52B", "margin12": "-32.17", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DON LEE", "PVI14": "-30.93878402", "Challenger 3 Party": "", "Incumbent": "JOE ATKINS", "Challenger 2 Party": ""}, "26B": {"District": "26B", "margin12": "14.4", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "NELS T. PIERSON", "Challenger 1": "RICH WRIGHT", "PVI14": "5.065255054", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "R"}, "42A": {"District": "42A", "margin12": "-6.74", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "RANDY JESSUP", "PVI14": "-5.212494668", "Challenger 3 Party": "", "Incumbent": "BARB YARUSSO", "Challenger 2 Party": ""}, "42B": {"District": "42B", "margin12": "-15.29", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "HEIDI GUNDERSON", "PVI14": "-17.25576571", "Challenger 3 Party": "", "Incumbent": "JASON \\"IKE\\" ISAACSON", "Challenger 2 Party": ""}, "36B": {"District": "36B", "margin12": "-14.77", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "PETER CREMA", "PVI14": "-9.403147364", "Challenger 3 Party": "", "Incumbent": "MELISSA HORTMAN", "Challenger 2 Party": ""}, "26A": {"District": "26A", "margin12": "-17.83", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "BREANNA BLY", "PVI14": "-17.51468112", "Challenger 3 Party": "", "Incumbent": "TINA LIEBLING", "Challenger 2 Party": ""}, "36A": {"District": "36A", "margin12": "2.17", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JEFFERSON FIETEK", "PVI14": "-6.1949472", "Challenger 3 Party": "", "Incumbent": "MARK W. UGLEM", "Challenger 2 Party": ""}, "05A": {"District": "05A", "margin12": "-12.37", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "PHILLIP NELSON", "PVI14": "-7.937067071", "Challenger 3 Party": "", "Incumbent": "JOHN PERSELL", "Challenger 2 Party": ""}, "57A": {"District": "57A", "margin12": "6.91", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "BRUCE FOLKEN", "PVI14": "8.527259902", "Challenger 3 Party": "", "Incumbent": "TARA MACK", "Challenger 2 Party": ""}, "27A": {"District": "27A", "margin12": "-3.2", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "THOMAS KEITH PRICE", "Challenger 1": "PEGGY BENNETT", "PVI14": "-3.221256476", "Challenger 3 Party": "", "Incumbent": "SHANNON SAVICK", "Challenger 2 Party": "IP"}, "27B": {"District": "27B", "margin12": "-25.66", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DENNIS SCHMINKE", "PVI14": "-25.72807116", "Challenger 3 Party": "", "Incumbent": "JEANNE POPPE", "Challenger 2 Party": ""}, "11A": {"District": "11A", "margin12": "-33.83", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "TIM HAFVENSTEIN", "PVI14": "-28.77451403", "Challenger 3 Party": "", "Incumbent": "MIKE SUNDIN", "Challenger 2 Party": ""}, "11B": {"District": "11B", "margin12": "-2.66", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JASON RARICK", "PVI14": "-0.512959063", "Challenger 3 Party": "", "Incumbent": "TIM FAUST", "Challenger 2 Party": ""}, "03B": {"District": "03B", "margin12": "-30", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "WADE K. FREMLING", "PVI14": "-28.58426059", "Challenger 3 Party": "", "Incumbent": "MARY MURPHY", "Challenger 2 Party": ""}, "03A": {"District": "03A", "margin12": "-33.66", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ERIC JOHNSON", "PVI14": "-34.34055348", "Challenger 3 Party": "", "Incumbent": "DAVID DILL", "Challenger 2 Party": ""}, "59A": {"District": "59A", "margin12": "-68.56", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "FRED STATEMA", "PVI14": "-64.22276754", "Challenger 3 Party": "", "Incumbent": "JOE MULLERY", "Challenger 2 Party": ""}, "59B": {"District": "59B", "margin12": "-53.45", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "MARGARET E. MARTIN", "PVI14": "-57.16103494", "Challenger 3 Party": "", "Incumbent": "RAYMOND DEHN", "Challenger 2 Party": ""}, "31B": {"District": "31B", "margin12": "21.87", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JD HOLMQUIST", "PVI14": "26.98719766", "Challenger 3 Party": "", "Incumbent": "TOM HACKBARTH", "Challenger 2 Party": ""}, "31A": {"District": "31A", "margin12": "21", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "24.7672421", "Challenger 3 Party": "", "Incumbent": "KURT DAUDT", "Challenger 2 Party": ""}, "19A": {"District": "19A", "margin12": "-97.65", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "KIM SPEARS", "PVI14": "-48.1146334", "Challenger 3 Party": "", "Incumbent": "CLARK JOHNSON", "Challenger 2 Party": ""}, "19B": {"District": "19B", "margin12": "-28.14", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "DAVE KRUSE", "Challenger 1": "JACK CONSIDINE", "PVI14": "-20.53596584", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "R"}, "16A": {"District": "16A", "margin12": "13.54", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "LAURIE DRIESSEN", "PVI14": "13.72734571", "Challenger 3 Party": "", "Incumbent": "CHRIS SWEDZINSKI", "Challenger 2 Party": ""}, "22A": {"District": "22A", "margin12": "18.13", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "DIANA SLYTER", "PVI14": "16.18143457", "Challenger 3 Party": "", "Incumbent": "JOE SCHOMACKER", "Challenger 2 Party": ""}, "57B": {"District": "57B", "margin12": "8.93", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "DENISE PACKARD", "PVI14": "8.714352454", "Challenger 3 Party": "", "Incumbent": "ANNA WILLS", "Challenger 2 Party": ""}, "22B": {"District": "22B", "margin12": "20.21", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "CHERYL AVENEL-NAVARA", "PVI14": "24.22656922", "Challenger 3 Party": "", "Incumbent": "ROD HAMILTON", "Challenger 2 Party": ""}, "16B": {"District": "16B", "margin12": "23.83", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JAMES KANNE", "PVI14": "35.15339244", "Challenger 3 Party": "", "Incumbent": "PAUL TORKELSON", "Challenger 2 Party": ""}, "06A": {"District": "06A", "margin12": "-41.67", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ROGER WEBER", "PVI14": "-38.31937863", "Challenger 3 Party": "", "Incumbent": "CARLY MELIN", "Challenger 2 Party": ""}, "63A": {"District": "63A", "margin12": "-71.14", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "KYLE BRAGG", "PVI14": "-69.15200508", "Challenger 3 Party": "", "Incumbent": "JIM DAVNIE", "Challenger 2 Party": ""}, "63B": {"District": "63B", "margin12": "-53.08", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ANDRES HORTILLOSA", "PVI14": "-51.15082375", "Challenger 3 Party": "", "Incumbent": "JEAN WAGENIUS", "Challenger 2 Party": ""}, "06B": {"District": "06B", "margin12": "-36.46", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "MATT MATASICH", "PVI14": "-43.49018556", "Challenger 3 Party": "", "Incumbent": "JASON METSA", "Challenger 2 Party": ""}, "56A": {"District": "56A", "margin12": "8.05", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "DAN KIMMEL", "Challenger 1": "DREW CHRISTENSEN", "PVI14": "10.60724223", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "DFL"}, "56B": {"District": "56B", "margin12": "-0.8", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ROZ PETERSON", "PVI14": "5.670417123", "Challenger 3 Party": "", "Incumbent": "WILL MORGAN", "Challenger 2 Party": ""}, "46A": {"District": "46A", "margin12": "-31.93", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "TIMOTHY O. MANTHEY", "PVI14": "-27.69129055", "Challenger 3 Party": "", "Incumbent": "RYAN WINKLER", "Challenger 2 Party": ""}, "46B": {"District": "46B", "margin12": "-40.17", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "BRYAN P. BJORNSON", "Challenger 1": "CHERYL YOUAKIM", "PVI14": "-35.89340733", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "R"}, "18B": {"District": "18B", "margin12": "16.18", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JOHN LIPKE", "PVI14": "33.13813712", "Challenger 3 Party": "", "Incumbent": "GLENN H. GRUENHAGEN", "Challenger 2 Party": ""}, "18A": {"District": "18A", "margin12": "16.73", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "STEVEN SCHIROO", "PVI14": "27.10544223", "Challenger 3 Party": "", "Incumbent": "DEAN URDAHL", "Challenger 2 Party": ""}, "65B": {"District": "65B", "margin12": "-56.36", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ANTHONY \\"TONY\\" ATHEN", "PVI14": "-51.43216975", "Challenger 3 Party": "", "Incumbent": "CARLOS MARIANI", "Challenger 2 Party": ""}, "39B": {"District": "39B", "margin12": "6.1", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "TOM DEGREE", "PVI14": "4.856735191", "Challenger 3 Party": "", "Incumbent": "KATHY LOHMER", "Challenger 2 Party": ""}, "50B": {"District": "50B", "margin12": "-30.71", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ZAVIER BICOTT", "PVI14": "-27.79739366", "Challenger 3 Party": "", "Incumbent": "ANN LENCZEWSKI", "Challenger 2 Party": ""}, "39A": {"District": "39A", "margin12": "14.96", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "TIM STENDER", "PVI14": "22.08646393", "Challenger 3 Party": "", "Incumbent": "BOB DETTMER", "Challenger 2 Party": ""}, "50A": {"District": "50A", "margin12": "-31.86", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DEAN MUMBLEAU", "PVI14": "-30.94002296", "Challenger 3 Party": "", "Incumbent": "LINDA SLOCUM", "Challenger 2 Party": ""}, "25B": {"District": "25B", "margin12": "-15.24", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "", "PVI14": "-12.01690507", "Challenger 3 Party": "", "Incumbent": "KIM NORTON", "Challenger 2 Party": ""}, "25A": {"District": "25A", "margin12": "9.21", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "12.49644065", "Challenger 3 Party": "", "Incumbent": "DUANE QUAM", "Challenger 2 Party": ""}, "17B": {"District": "17B", "margin12": "-4.17", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DAVE BAKER", "PVI14": "-0.257265384", "Challenger 3 Party": "", "Incumbent": "MARY SAWATZKY", "Challenger 2 Party": ""}, "17A": {"District": "17A", "margin12": "-7.87", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "TIM MILLER", "PVI14": "-10.86434194", "Challenger 3 Party": "", "Incumbent": "ANDREW FALK", "Challenger 2 Party": ""}, "62B": {"District": "62B", "margin12": "-77.55", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JULIE HANSON", "PVI14": "-69.46866551", "Challenger 3 Party": "", "Incumbent": "SUSAN ALLEN", "Challenger 2 Party": ""}, "62A": {"District": "62A", "margin12": "-79.62", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "YOLANDITA COLON", "Challenger 1": "BRUCE LUNDEEN", "PVI14": "-75.00357064", "Challenger 3 Party": "", "Incumbent": "KAREN CLARK", "Challenger 2 Party": "IP"}, "45A": {"District": "45A", "margin12": "-19.33", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "RICHARD LIEBERMAN", "PVI14": "-15.7470442", "Challenger 3 Party": "", "Incumbent": "LYNDON R. CARLSON", "Challenger 2 Party": ""}, "45B": {"District": "45B", "margin12": "-32.04", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ALMA J. WETZKER", "PVI14": "-27.41502056", "Challenger 3 Party": "", "Incumbent": "MIKE FREIBERG", "Challenger 2 Party": ""}, "33A": {"District": "33A", "margin12": "24.28", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "TODD MIKKELSON", "PVI14": "32.72312183", "Challenger 3 Party": "", "Incumbent": "JERRY HERTAUS", "Challenger 2 Party": ""}, "33B": {"District": "33B", "margin12": "8.88", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "PAUL ALEGI", "PVI14": "22.92171133", "Challenger 3 Party": "", "Incumbent": "CINDY PUGH", "Challenger 2 Party": ""}, "47B": {"District": "47B", "margin12": "97.15", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "67.87286528", "Challenger 3 Party": "", "Incumbent": "JOE HOPPE", "Challenger 2 Party": ""}, "47A": {"District": "47A", "margin12": "25.23", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "JIM NASH", "Challenger 1": "MATTHEW W. GIESEKE", "PVI14": "29.29162903", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "R"}, "35B": {"District": "35B", "margin12": "18.32", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "SAM BEARD", "PVI14": "20.41855553", "Challenger 3 Party": "", "Incumbent": "PEGGY SCOTT", "Challenger 2 Party": ""}, "35A": {"District": "35A", "margin12": "25.4", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "ABIGAIL WHELAN", "Challenger 1": "PETER PEROVICH", "PVI14": "30.16433595", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "R"}, "34A": {"District": "34A", "margin12": "28.59", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "30.9067992", "Challenger 3 Party": "", "Incumbent": "JOYCE PEPPIN", "Challenger 2 Party": ""}, "34B": {"District": "34B", "margin12": "9.16", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "", "Challenger 2": "DAVID B. HODEN", "Challenger 1": "DENNIS SMITH", "PVI14": "11.26821466", "Challenger 3 Party": "", "Incumbent": "", "Challenger 2 Party": "DFL"}, "65A": {"District": "65A", "margin12": "-69.21", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "LENA BUGGS", "Challenger 1": "ANTHONY MESCHKE", "PVI14": "-64.13990372", "Challenger 3 Party": "", "Incumbent": "RENA MORAN", "Challenger 2 Party": "GP"}, "48B": {"District": "48B", "margin12": "17.95", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JOAN HOWE-PULLIS", "PVI14": "23.00047957", "Challenger 3 Party": "", "Incumbent": "JENIFER LOON", "Challenger 2 Party": ""}, "48A": {"District": "48A", "margin12": "-0.82", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "KIRK STENSRUD", "PVI14": "-2.040107947", "Challenger 3 Party": "", "Incumbent": "YVONNE SELCER", "Challenger 2 Party": ""}, "20A": {"District": "20A", "margin12": "9.05", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "THOMAS LOFGREN", "PVI14": "14.45198517", "Challenger 3 Party": "", "Incumbent": "BOB VOGEL", "Challenger 2 Party": ""}, "20B": {"District": "20B", "margin12": "-13.92", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "DAN MATEJCEK", "PVI14": "-11.1631232", "Challenger 3 Party": "", "Incumbent": "DAVID BLY", "Challenger 2 Party": ""}, "14B": {"District": "14B", "margin12": "-12.73", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "JIM KNOBLACH", "PVI14": "-12.61853235", "Challenger 3 Party": "", "Incumbent": "ZACHARY \\"ZACH\\" DORHOLT", "Challenger 2 Party": ""}, "14A": {"District": "14A", "margin12": "8.11", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "DAN WOLGAMOTT", "PVI14": "12.5516664", "Challenger 3 Party": "", "Incumbent": "TAMA THEIS", "Challenger 2 Party": ""}, "61B": {"District": "61B", "margin12": "-63.06", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "TOM GALLAGHER", "PVI14": "-59.63653551", "Challenger 3 Party": "", "Incumbent": "PAUL THISSEN", "Challenger 2 Party": ""}, "08B": {"District": "08B", "margin12": "0.01", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JAY SIELING", "PVI14": "12.17229705", "Challenger 3 Party": "", "Incumbent": "MARY FRANSON", "Challenger 2 Party": ""}, "08A": {"District": "08A", "margin12": "25.65", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JIM MILTICH", "PVI14": "24.27931424", "Challenger 3 Party": "", "Incumbent": "BUD NORNES", "Challenger 2 Party": ""}, "61A": {"District": "61A", "margin12": "-59.12", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "FRANK TAYLOR", "PVI14": "-59.83468686", "Challenger 3 Party": "", "Incumbent": "FRANK HORNSTEIN", "Challenger 2 Party": ""}, "32B": {"District": "32B", "margin12": "1.87", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "LAURIE J. WARNER", "PVI14": "4.617889846", "Challenger 3 Party": "", "Incumbent": "BOB BARRETT", "Challenger 2 Party": ""}, "32A": {"District": "32A", "margin12": "7.24", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "PAUL GAMMEL", "PVI14": "7.92868776", "Challenger 3 Party": "", "Incumbent": "BRIAN JOHNSON", "Challenger 2 Party": ""}, "60B": {"District": "60B", "margin12": "-56.77", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "ABDIMALIK ASKAR", "PVI14": "-49.23086595", "Challenger 3 Party": "", "Incumbent": "PHYLLIS KAHN", "Challenger 2 Party": ""}, "23A": {"District": "23A", "margin12": "12.88", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "PAT BACON", "PVI14": "22.73803837", "Challenger 3 Party": "", "Incumbent": "BOB GUNTHER", "Challenger 2 Party": ""}, "23B": {"District": "23B", "margin12": "96.25", "Challenger 1 Party": "", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "", "PVI14": "45.83915096", "Challenger 3 Party": "", "Incumbent": "TONY CORNISH", "Challenger 2 Party": ""}, "15A": {"District": "15A", "margin12": "4.81", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "JAMES RITTENOUR", "PVI14": "5.042175735", "Challenger 3 Party": "", "Incumbent": "SONDRA ERICKSON", "Challenger 2 Party": ""}, "15B": {"District": "15B", "margin12": "15.68", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "", "Challenger 1": "BRIAN JOHNSON", "PVI14": "19.6789802", "Challenger 3 Party": "", "Incumbent": "JIM NEWBERGER", "Challenger 2 Party": ""}, "07B": {"District": "07B", "margin12": "-40.68", "Challenger 1 Party": "R", "Challenger 3": "", "Incumbent Party": "DFL", "Challenger 2": "", "Challenger 1": "TRAVIS SILVERS", "PVI14": "-43.11551216", "Challenger 3 Party": "", "Incumbent": "ERIK SIMONSON", "Challenger 2 Party": ""}, "07A": {"District": "07A", "margin12": "-42.29", "Challenger 1 Party": "DFL", "Challenger 3": "KRISTINE OSBAKKEN", "Incumbent Party": "", "Challenger 2": "BECKY HALL", "Challenger 1": "JENNIFER SCHULTZ", "PVI14": "-36.25509914", "Challenger 3 Party": "GP", "Incumbent": "", "Challenger 2 Party": "R"}, "55A": {"District": "55A", "margin12": "9.34", "Challenger 1 Party": "R", "Challenger 3": "DEREK THURY", "Incumbent Party": "", "Challenger 2": "JAY C. WHITING", "Challenger 1": "BOB LOONAN", "PVI14": "15.20080329", "Challenger 3 Party": "IP", "Incumbent": "", "Challenger 2 Party": "DFL"}, "55B": {"District": "55B", "margin12": "26.91", "Challenger 1 Party": "DFL", "Challenger 3": "", "Incumbent Party": "R", "Challenger 2": "JOSH D. ONDICH", "Challenger 1": "KEVIN BURKART", "PVI14": "28.6836615", "Challenger 3 Party": "", "Incumbent": "TONY ALBRIGHT", "Challenger 2 Party": "IP"}}';});

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

        _.each(['Challenger 1', 'Challenger 2', 'Challenger 3'], function(c, ci) {
          if (d[c]) {
            d.challengers.push({
              name: d[c],
              party: d[c + ' Party']
            });
          }
        });

        d[di] = d;
      });

      // Color range
      cRange = chroma.scale(colorPoints).mode('hsl')
        .domain(pviPoints, pviIntervals);

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

        if (_.isObject(n) && !_.isObject(boundary)) {
          $.getJSON(thisApp.options.boundaryAPI.replace('[[[ID]]]', n.District.toLowerCase()))
            .done(function(data) {
              var current = thisView.get('district');

              if (_.isObject(data)) {
                // Set on dataset
                thisView.set('p.' + n.District + '.boundary', data);
                // Set on current district if still the same
                if (current.District === n.District) {
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

