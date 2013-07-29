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

function httpError(data, status) {
  if (status === 0) {
    // XXX display pretty error instead
    console.error("HTTP error: no route to host. Are you offline?");
  } else
    console.error("HTTP error: " + data);
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
  $scope.title = titles[type];
  $http.get('/api/' + type)
    .success(function(packages) {
      $scope.packages = packages;
    })
    .error(httpError);
}

function PackageSearchCtrl($http, $scope, $routeParams) {
  var q = $routeParams.q;
  $scope.title = 'Packages matching "' + q + '"';
  $http.get('/api/search?q=' + q)
    .success(function(packages) {
      $scope.packages = packages;
    })
    .error(httpError);
}

function SearchFormCtrl($scope) {
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
      .when('/:type', {
        templateUrl: '/partials/list.html',
        controller: PackageListCtrl
      })
      .otherwise({redirectTo: '/'});
  }]);
