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

// Infinite scroll
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

function md() {
  [].forEach.call(document.querySelectorAll('.md'), function(node) {
    var $node = angular.element(node);
    $node.html(marked.parse($node.text()));
  });
}

var requestCache = {
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

function httpError(data, status) {
  if (status === 0) {
    // XXX display pretty error instead
    console.error("HTTP error: no route to host. Are you offline?", data);
  } else
    console.error("HTTP error", status, data);
}

function buildUrl(baseUrl, params) {
  var url = baseUrl;
  params = params || {};
  if (url.indexOf('?') === -1)
    url += "?";
  if (url.lastIndexOf('&') !== url.length - 1)
    url += "&";
  url += Object.keys(params).map(function(name) {
    if (isArray(params[name])) {
      return params[name].map(function(value) {
        return [name + '[]', value].join('=');
      }).join('&');
    }
    if (typeof params[name] === "object") {
      return Object.keys(params[name]).map(function(field) {
        return [name + '[' + field + ']', params[name][field]].join('=');
      }).join('&');
    }
    return [name, params[name]].join('=');
  }).join('&');
  return url.replace('?&', '?').replace(/\?$/, '').replace(/&$/, '');
}

function initListScope($scope, $http) {
  /*jshint validthis:true, camelcase:false */
  $scope.canLoad = true;
  $scope.packages = [];
  $scope.filters = {};
  $scope.filterNames = {
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

  $scope.fetchPackages = function(params) {
    params = params || {};

    if (!$scope.canLoad || ($scope.total > 0 && ~~params.offset + 1 >= $scope.total))
      return;

    var url = buildUrl($scope.baseUrl, params);

    if (~~params.offset === 0)
      $scope.packages = [];

    function success(results) {
      $scope.packages = $scope.packages.concat(results.packages);
      $scope.facets = results.facets;
      $scope.total = results.total;
      $scope.canLoad = true;
      $scope.next = ~~params.offset + 12;
      requestCache.add(url, results);
    }

    if (requestCache.get(url))
      return success(requestCache.get(url));

    $scope.canLoad = false;

    $http.get(url).success(success).error(httpError);
  };

  $scope.loadPackages = function(offset) {
    this.fetchPackages({
      offset: offset,
      filters: this.filters
    });
  };

  $scope.refine = function(field, value) {
    this.filters[field] = value;
    this.fetchPackages({
      offset: 0,
      filters: this.filters
    });
  };

  $scope.resetFilter = function(field) {
    if (field in this.filters)
      delete this.filters[field];
    this.fetchPackages({
      offset: 0,
      filters: this.filters // keeping other filters previously set
    });
  };
}

function PackageListCtrl($http, $scope, $routeParams) {
  var titles = {
    recent: 'Recently created packages',
    updated: 'Recently updated packages',
    popular: 'Popular packages'
  };

  $scope.type = $routeParams.type || 'recent';
  $scope.baseUrl = '/api/' + $scope.type;
  $scope.title = titles[$scope.type];

  initListScope($scope, $http);

  $scope.loadPackages(0);
}

function PackageSearchCtrl($http, $scope, $routeParams) {
  $scope.type = "" + $routeParams.q;
  $scope.baseUrl = '/api/search?q=' + encodeURIComponent($scope.type);
  $scope.title = 'Packages matching "' + $scope.type + '"';

  initListScope($scope, $http);

  $scope.loadPackages(0);
}

function PackageDetailsCtrl($http, $scope, $routeParams) {
  $http.get('/api/details/' + $routeParams.slug)
    .success(function(pkg) {
      $scope['package'] = pkg; // yeah, package is a reserved word
      setTimeout(md); // wonder how to wait for angular to have set scope here
    })
    .error(httpError);
}

function NavigationCtrl($scope) {
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
}

angular
  .module('SublimePackages', ['infiniteScroll'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/details/:slug', {
        templateUrl: '/partials/details.html',
        controller: PackageDetailsCtrl
      })
      .when('/search/:q', {
        templateUrl: '/partials/list.html',
        controller: PackageSearchCtrl
      })
      .when('/about', {
        templateUrl: '/partials/about.html'
      })
      .when('/:type', {
        templateUrl: '/partials/list.html',
        controller: PackageListCtrl
      })
      .otherwise({redirectTo: '/'});
  }]);
