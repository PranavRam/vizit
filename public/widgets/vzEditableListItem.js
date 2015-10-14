/**
 * Created by pranavram on 10/4/15.
 */
(function () {
    'use strict';

    angular
        .module('app.widgets')
        .directive('vzEditableListItem', vzEditableListItem);

    /* @ngInject */
    function vzEditableListItem() {
        // Opens and closes the sidebar menu.
        // Usage:
        //  <div data-cc-sidebar">
        //  <div data-cc-sidebar whenDoneAnimating="vm.sidebarReady()">
        // Creates:
        //  <div data-cc-sidebar class="sidebar">
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/widgets/vzEditableListItem.html',
            scope: {
                item: '=',
                onSave: '&',
                showLocation: '&'
            },
            replace: true,
            controller: function ($scope) {
                $scope.hover = false;
                $scope.getWeightWidth = function (weight) {
                    if(weight < 0) weight = -weight;
                    return Math.round(weight) + 'px';
                };
                $scope.updateItem = function() {
                    $scope.onSave();
                };
            }
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }
})();