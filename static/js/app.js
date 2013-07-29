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

function PackageDetailsCtrl($http, $scope, $routeParams) {
  $http.get('/api/details/' + $routeParams.slug).success(function(pkg) {
    $scope['package'] = pkg; // yeah, package is a reserved word
    setTimeout(md); // wonder how to wait for angular to have set scope here
  });
}

function PackageListCtrl($http, $scope, $routeParams) {
  var type = $routeParams.type || 'recent';
  $http.get('/api/' + type).success(function(packages) {
    $scope.packages = packages;
  });
}

function PackageSearchCtrl($http, $scope, $routeParams) {
  $http.get('/api/search?q=' + $routeParams.q).success(function(packages) {
    $scope.packages = packages;
  });
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
