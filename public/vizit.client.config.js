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
      // url: "/",
      abstract: true,
      templateUrl: "/public/partials/main.html",
      controller: 'MainCtrl'
    })
    .state('main.start', {
      url: "/",
      // templateUrl: "/public/partials/main.html",
      views: {
          'entityList@main': {
              templateUrl: '/public/partials/entity_list.html'
          },
          // here we do target the view just added above, as a 'mainModule'
          // as <div ui-view="leftSidePaneModule">
          'achCanvas@main': {
              templateUrl: '/public/partials/ach_canvas.html'
          },
          // and here we do target the sub view
          // but still part of the state 'profiles' defined in the above
          // view defintion 'leftSidePaneModule@profiles'
          'documentList@main': {
              templateUrl: '/public/partials/document_list.html',
          },
          'documentViewer@main': {
              templateUrl: '/public/partials/document_viewer.html',
          },
      }
    })
    .state('upload', {
      url: "/upload",
      templateUrl: "/public/partials/upload.html",
      controller: 'UploadCtrl'
    })
}