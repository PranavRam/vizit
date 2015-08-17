angular.module('vizit')
				.config(config);

function config($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/");
  //
  // Now set up the states
  $stateProvider
    .state('main', {
      url: "/",
      templateUrl: "/public/partials/main.html",
      controller: 'MainCtrl'
    })
    .state('upload', {
      url: "/upload",
      templateUrl: "/public/partials/upload.html",
      controller: 'UploadCtrl'
    })
}