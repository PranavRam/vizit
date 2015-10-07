/**
 * Created by pranavram on 10/4/15.
 */
(function() {
    'use strict';

    angular
        .module('app.documentviewer')
        .directive('vzToolbar', vzToolbar);

    /* @ngInject */
    function vzToolbar () {
        // Opens and closes the sidebar menu.
        // Usage:
        //  <div data-cc-sidebar">
        //  <div data-cc-sidebar whenDoneAnimating="vm.sidebarReady()">
        // Creates:
        //  <div data-cc-sidebar class="sidebar">
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/documentviewer/vzToolbar.html',
            //scope: {
            //    item: '=',
            //    onSave: '&'
            //},
            replace: true
            //controller: function($scope) {
            //    $scope.item.hover = false;
            //    $scope.getWeightWidth = function (weight) {
            //        return Math.round(weight * 5) + 'px';
            //    };
            //}
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }
})();