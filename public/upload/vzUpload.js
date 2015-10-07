/**
 * Created by pranavram on 10/5/15.
 */
(function() {
    'use strict';

    angular
        .module('app.upload')
        .directive('vzUpload', vzUpload);

    /* @ngInject */
    function vzUpload (Upload) {
        // Opens and closes the sidebar menu.
        // Usage:
        //  <div data-cc-sidebar">
        //  <div data-cc-sidebar whenDoneAnimating="vm.sidebarReady()">
        // Creates:
        //  <div data-cc-sidebar class="sidebar">
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/upload/vzUpload.html',
            replace: true,
            scope: {
              success: '&'
            },
            controller: function($scope) {
                $scope.uploading = false;
                $scope.file = void 0;
                $scope.fileUpdated = function(files, $event) {
                    if(!$event) return;
                    $scope.file = $event.target.files[0];
                };
                $scope.upload = function (file) {
                    $scope.uploading = true;
                    Upload.upload({
                        url: '/upload',
                        fields: {'username': 'Pranav Ram'},
                        file: file
                    }).progress(function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                    }).success(function (data, status, headers, config) {
                        console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
                        $scope.uploading = false;
                        $scope.success();
                    }).error(function (data, status, headers, config) {
                        console.log('error status: ' + status);
                        $scope.uploading = false;
                    });
                }
            }
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }
})();