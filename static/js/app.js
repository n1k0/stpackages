/* global angular, marked, hljs */

"use strict";

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
      angular.element($window).bind('scroll', function() {
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

function httpError(data, status) {
  if (status === 0) {
    // XXX display pretty error instead
    console.error("HTTP " + status + "error: no route to host. Are you offline?");
  } else
    console.error("HTTP error: " + data);
}

function getPackages($scope, $http, offset, url) {
  if (!$scope.canLoad || offset + 1 >= $scope.total)
    return;
  $scope.canLoad = false;
  $http.get(url)
    .success(function(results) {
      $scope.packages = $scope.packages.concat(results.packages);
      $scope.total = results.total;
      $scope.canLoad = true;
      $scope.next = offset + 12;
    })
    .error(httpError);
}

function PackageListCtrl($http, $scope, $routeParams) {
  var titles = {
    recent: 'Recently created packages',
    updated: 'Recently updated packages',
    popular: 'Popular packages'
  };

  $scope.type = $routeParams.type || 'recent';
  $scope.title = titles[$scope.type];
  $scope.packages = [];
  $scope.canLoad = true;

  $scope.loadPackages = function(type, offset) {
    var url = '/api/' + type + '?offset=' + offset;
    getPackages($scope, $http, offset, url);
  };

  $scope.loadPackages($scope.type, 0);
}

function PackageSearchCtrl($http, $scope, $routeParams) {
  $scope.type = "" + $routeParams.q;
  $scope.title = 'Packages matching "' + $scope.type + '"';
  $scope.packages = [];
  $scope.canLoad = true;

  $scope.loadPackages = function(type, offset) {
    var url = '/api/search?q=' + encodeURIComponent(type) + '&offset=' + offset;
    getPackages($scope, $http, offset, url);
  };

  $scope.loadPackages($scope.type, 0);
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
  $scope.$section = "recent";
  $scope.setSection = function(name) {
    $scope.$section = name;
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
