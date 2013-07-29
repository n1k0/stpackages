/* global angular, marked */

"use strict";

window.onload = function() {
  marked.setOptions({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    langPrefix: 'language-',
    // highlight: function(code, lang) {
    //   return hljs.highlightAuto(code).value;
    // }
  });
};

function md() {
  [].forEach.call(document.querySelectorAll('.md'), function(node) {
    var $node = angular.element(node);
    $node.html(marked.parse($node.text()));
  });
}

function PackageListCtrl($http, $scope) {
  $http.get('/api/recent').success(function(packages) {
    $scope.packages = packages;
  });
}

function PackageDetailsCtrl($http, $scope, $routeParams) {
  $http.get('/api/details/' + $routeParams.slug).success(function(pkg) {
    $scope['package'] = pkg; // yeah, package is a reserved word
    setTimeout(md, 100); // wonder how to wait for angular to have set scope here
  });
}

angular
  .module('SublimePackages', [])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/partials/list.html',
        controller: PackageListCtrl
      })
      .when('/details/:slug', {
        templateUrl: '/partials/details.html',
        controller: PackageDetailsCtrl
      })
      .otherwise({redirectTo: '/'});
  }]);
