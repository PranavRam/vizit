angular.module('vizit')
				.config(config);

function config($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/");
  //
  // Now set up the states
  $stateProvider
    .state('vizit', {
      // url: "/",
      abstract: true,
      views: {
          '': {
            templateUrl: "/public/partials/main.html",
            controller: 'MainCtrl'
          },
          'documentList@vizit': {
              templateUrl: '/public/partials/document_list.html',
          },
          'documentViewer@vizit': {
              templateUrl: '/public/partials/document_viewer.html',
          }
      }
    })
    .state('vizit.entity_ach', {
      url: "/",
      views: {
          'topView@vizit': {
              templateUrl: '/public/partials/entityACH.html'
          },
          'entityList@vizit.entity_ach': {
              templateUrl: '/public/partials/entity_list.html'
          },
          'achCanvas@vizit.entity_ach': {
              templateUrl: '/public/partials/ach_canvas.html'
          }
      }
    })
    .state('vizit.entity_view', {
      url: "/entity-view",
      views: {
          'topView@vizit': {
              templateUrl: '/public/partials/entity_view.html'
          }
      }
    })
    .state('vizit.provenance', {
      url: "/provenance",
      views: {
          'topView@vizit': {
              templateUrl: '/public/partials/provenance.html'
          },
          'entityList@vizit.provenance': {
              templateUrl: '/public/partials/entity_list.html'
          },
          'achProvenance@vizit.provenance': {
              templateUrl: '/public/partials/ach_provenance.html'
          }
      }
    })
    .state('upload', {
      url: "/upload",
      templateUrl: "/public/partials/upload.html",
      controller: 'UploadCtrl'
    })
}