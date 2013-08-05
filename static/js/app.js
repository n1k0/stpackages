/* global angular, marked, hljs */
/* exported NavigationCtrl */

"use strict";

function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}

// Marked setup
window.onload = function() {
  marked.setOptions({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false, // github did it for us
    smartLists: true,
    langPrefix: 'language-',
    highlight: function(code) {
      return hljs.highlightAuto(code).value;
    }
  });
};

function md() {
  [].forEach.call(document.querySelectorAll('.md'), function(node) {
    var $node = angular.element(node);
    $node.html(marked.parse($node.text()));
  });
}

function httpError(data, status) {
  if (status === 0) {
    // XXX display pretty error instead
    console.error("HTTP error: no route to host. Are you offline?", data);
  } else
    console.error("HTTP error", status, data);
}

var app = angular.module('SublimePackages', ['infiniteScroll']);

/**
 * Infinite scroll directive
 */
angular.module('infiniteScroll', []).directive('infiniteScroll', function($window) {
  return {
    link: function(scope, element, attrs) {
      var offset = ~~attrs.threshold || 0;
      var canLoad = !!attrs.canLoad;
      angular.element($window).unbind('scroll').bind('scroll', function() {
        var docHeight = document.height || document.body.clientHeight;
        var bottomReached = window.pageYOffset + window.innerHeight >= docHeight - offset;
        if (canLoad && bottomReached)
          scope.$apply(attrs.infiniteScroll);
      });
    }
  };
});

/**
 * Request cache factory
 */
app.factory('$requestCache', function() {
  return {
    _cache: {},
    add: function(url, results) {
      if (!url || !results)
        return;
      this._cache[url] = {date: new Date(), results: results};
    },
    has: function(url) {
      return url in this._cache;
    },
    get: function(url) {
      if (this.has(url) && !this.outdated(url))
        return this._cache[url].results;
    },
    outdated: function(url) {
      return new Date() - this._cache[url].date >= 1 * 60 * 60 * 1000;
    }
  };
});

/**
 * Api service factory.
 */
app.factory('$api', function($http, $requestCache) {
  function buildUrl(baseUrl, params) {
    var url = baseUrl.replace(/(\?|&)$/, '');
    params = params || {};
    if (!Object.keys(params).length)
      return url;
    if (url.indexOf('?') === -1)
      url += "?";
    else if(url.lastIndexOf('&') !== url.length - 1)
      url += "&";
    url += Object.keys(params).map(function(name) {
      var param = params[name];
      if (isArray(param)) {
        return param.map(function(value) {
          return [name + '[]', value].join('=');
        }).join('&');
      }
      if (typeof param === "object") {
        return Object.keys(param).map(function(field) {
          return [name + '[' + field + ']', param[field]].join('=');
        }).join('&');
      }
      return [name, param].join('=');
    }).filter(function(str) {
      return !!str;
    }).join('&');
    return url.replace('?&', '?');
  }

  return {
    init: function(baseUrl, onResults) {
      this.baseUrl = baseUrl;
      this.canLoad = true;
      this.offset = 0;
      this.total = 0;
      this.filters = {};
      this.onResults = onResults;
      return this;
    },

    loadNext: function() {
      var self = this; // XXX circumvent this with bind()

      if (!this.canLoad || (this.total > 0 && this.offset + 1 >= this.total))
        return;

      var url = buildUrl(this.baseUrl, {
        offset: ~~this.offset,
        filters: this.filters || {}
      });

      function success(results) {
        self.total = results.total;
        self.canLoad = true;
        $requestCache.add(url, results);
        self.onResults({
          offset: self.offset,
          filters: self.filters,
          packages: results.packages,
          total: results.total,
          facets: results.facets
        });
        self.offset += 12;
      }

      if ($requestCache.get(url))
        return success($requestCache.get(url));

      this.canLoad = false;

      $http.get(url).success(success).error(httpError);
      return this;
    },

    refine: function(field, value) {
      this.offset = 0;
      this.filters[field] = value;
      return this.loadNext();
    },

    resetFilter: function(field) {
      this.offset = 0;
      if (field in this.filters)
        delete this.filters[field];
      return this.loadNext();
    }
  };
});

app.filter('facetLabel', function() {
  /* jshint camelcase:false */
  var labels = { // XXX move to a filter
    st3compat: {
      title: "ST3 compatibility",
      values: {
        unknown: "Unknown",
        working: "Working",
        extra_steps: "Extra Steps Needed",
        errors: "Not working"
      }
    },
    platforms: {
      title: "Platform support",
      values: {
        linux: "Linux",
        osx: "Mac OS X",
        windows: "Windows"
      }
    }
  };
  return function(facet, value) {
    if (value) {
      try {
        return labels[facet.field].values[value] || value;
      } catch (err) {
        return value;
      }
    }
    try {
      return labels[facet.field].title || facet.field;
    } catch (err) {
      return facet.field;
    }
  };
});

/**
 * Package list controller.
 */
app.controller('PackageListCtrl', function($scope, $routeParams, $api) {
  var baseUrl;
  $scope.packages = [];
  $scope.facets = [];
  $scope.filters = {};
  $scope.total = 0;

  if ('type' in $routeParams) {
    var type = $routeParams.type || 'recent';
    $scope.title = {
      recent: 'Recently created packages',
      updated: 'Recently updated packages',
      popular: 'Popular packages'
    }[type];
    baseUrl = '/api/' + type;
  } else if ('q' in $routeParams) {
    var q = "" + $routeParams.q;
    $scope.title = 'Packages matching "' + q + '"';
    baseUrl = '/api/search?q=' + encodeURIComponent(q);
  } else {
    throw new Error("Unsupported route parameters.");
  }

  $scope.$api = $api.init(baseUrl, function(results) {
    $scope.packages = (results.offset > 0 ? $scope.packages : []).concat(results.packages);
    $scope.facets = results.facets;
    $scope.filters = results.filters;
    $scope.total = results.total;
  }).loadNext();
});

/**
 * Package details controller.
 */
app.controller('PackageDetailsCtrl', function($http, $scope, $routeParams) {
  $http.get('/api/details/' + $routeParams.slug)
    .success(function(pkg) {
      $scope['package'] = pkg; // yeah, package is a reserved word
      setTimeout(md); // wonder how to wait for angular to have set scope here
    })
    .error(httpError);
});

/**
 * Navigation controller.
 */
app.controller('NavigationCtrl', function($scope) {
  try {
    $scope.section = document.location.hash.slice(2);
  } catch (err) {
    $scope.section = "recent";
  }
  $scope.setSection = function(name) {
    $scope.section = name;
  };
  $scope.submit = function() {
    if (this.q)
      document.location.hash = "/search/" + encodeURIComponent(this.q);
  };
});

/**
 * Routing configuration.
 */
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/about', {
      templateUrl: '/partials/about.html'
    })
    .when('/details/:slug', {
      templateUrl: '/partials/details.html',
      controller: 'PackageDetailsCtrl'
    })
    .when('/search/:q', {
      templateUrl: '/partials/list.html',
      controller: 'PackageListCtrl'
    })
    .when('/:type', {
      templateUrl: '/partials/list.html',
      controller: 'PackageListCtrl'
    })
    .otherwise({redirectTo: '/'});
}]);
