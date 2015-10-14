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
            templateUrl: "/public/layouts/main.html",
            controller: 'core',
            resolve: {
                data: function($q, hypotheses, evidences, entities, documents) {
                    var promises = [documents.get(), entities.get(),
                        evidences.get(), hypotheses.get()];

                    return $q.all(promises);
                }
            }
        })
        .state('vizit.entity_ach', {
            url: "/",
            views: {
                'topView@vizit': {
                    templateUrl: '/public/layouts/entityACH.html',
                    controller: function($scope, $timeout) {
                        $timeout(function(){ $scope.viewLoaded = true; });
                    }
                },
                'entityList@vizit.entity_ach': {
                    templateUrl: '/public/layouts/sidebar.html'
                },
                'achCanvas@vizit.entity_ach': {
                    templateUrl: '/public/layouts/ach_canvas.html'
                }
            }
        })
        .state('vizit.entity_view', {
            url: "/entity-view",
            views: {
                'topView@vizit': {
                    templateUrl: '/public/layouts/entity_view.html',
                    controller: function($scope, $timeout) {
                        $timeout(function(){ $scope.viewLoaded = true; });
                    }
                }
            }
        })
        .state('vizit.ach_summary', {
            url: "/ach_summary",
            views: {
                'topView@vizit': {
                    templateUrl: '/public/layouts/ach_summary.html',
                    //controller: function ($scope, $timeout) {
                    //    $scope.viewLoaded = false;
                    //    $timeout(function () {
                    //        $scope.viewLoaded = true;
                    //        console.log('timeline')
                    //    });
                    //}
                }
            }
        })
        .state('vizit.provenance', {
            url: "/provenance",
            views: {
                'topView@vizit': {
                    templateUrl: '/public/layouts/provenance.html'
                },
                'entityList@vizit.provenance': {
                    templateUrl: '/public/layouts/sidebar.html',
                    controller: function($scope, $timeout) {
                        $timeout(function(){ $scope.viewLoaded = true; });
                    }
                },
                'achProvenance@vizit.provenance': {
                    templateUrl: '/public/layouts/ach_provenance.html',
                    controller: 'provenance'
                    //controller: function ($scope, $timeout) {
                    //    $scope.viewLoaded = false;
                    //    $timeout(function () {
                    //        $scope.viewLoaded = true;
                    //        console.log('timeline')
                    //    });
                    //}
                }
            }
        })
        .state('upload', {
            url: "/upload",
            templateUrl: "/public/layouts/upload.html",
        })
}