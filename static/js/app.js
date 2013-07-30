/* global angular, marked, hljs */

"use strict";

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

function range(N) {
  return Array.apply(0, Array(N)).map(function(x, y) {
    return y;
  });
}

function httpError(data, status) {
  if (status === 0) {
    // XXX display pretty error instead
    console.error("HTTP " + status + "error: no route to host. Are you offline?");
  } else
    console.error("HTTP error: " + data);
}

function pages(size, offset, total, perPage) {
  var half = Math.floor(size / 2);
  var pages = range(Math.ceil(total / perPage)).map(function(x) {
    return {n: x + 1, offset: x * perPage};
  });
  if (pages.length < size)
    return pages;
  var current = pages.map(function(page) {
    return page.offset;
  }).indexOf(offset);
  return current < half ? pages.slice(0, size) : pages.slice(current - half, current + half);
}

function pagination(offset, total, perPage) {
  return {
    first: 0,
    last: total - (total % perPage),
    prev: offset >= perPage ? offset - perPage : null,
    next: offset < total - perPage ? offset + perPage : null,
    pages: pages(8, offset, total, perPage)
  };
}

function httpResults($scope, results) {
  $scope.packages = results.packages;
  $scope.total = results.total;
  $scope.pagination = pagination($scope.offset, $scope.total, 12);
}

function PackageDetailsCtrl($http, $scope, $routeParams) {
  $http.get('/api/details/' + $routeParams.slug)
    .success(function(pkg) {
      $scope['package'] = pkg; // yeah, package is a reserved word
      setTimeout(md); // wonder how to wait for angular to have set scope here
    })
    .error(httpError);
}

function PackageListCtrl($http, $scope, $routeParams) {
  var titles = {
    recent: 'Recently created packages',
    updated: 'Recently updated packages',
    popular: 'Popular packages'
  };
  var type = $routeParams.type || 'recent';
  $scope.listBaseUrl = '/#/' + type;
  $scope.title = titles[type];
  $scope.offset = ~~$routeParams.offset;
  $http.get('/api/' + type + '?offset=' + $scope.offset)
    .success(httpResults.bind(null, $scope))
    .error(httpError);
}

function PackageSearchCtrl($http, $scope, $routeParams) {
  var q = $routeParams.q;
  $scope.listBaseUrl = '/#/search/' + encodeURIComponent(q);
  $scope.title = 'Packages matching "' + q + '"';
  $scope.offset = ~~$routeParams.offset;
  $http.get('/api/search?q=' + q + '&offset=' + $scope.offset)
    .success(httpResults.bind(null, $scope))
    .error(httpError);
}

function NavigationCtrl($scope) {
  $scope.$section = "recent";
  $scope.setSection = function(name) {
    $scope.$section = name;
  };
  $scope.submit = function() {
    if (this.q)
      document.location.hash = "/search/" + this.q;
  };
}

angular
  .module('SublimePackages', [])
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
