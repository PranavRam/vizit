/**
 * Created by pranavram on 10/4/15.
 */
(function() {
    'use strict';

    angular
        .module('app.widgets')
        .directive('vzEditableListItem', vzEditableListItem);

    /* @ngInject */
    function vzEditableListItem () {
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
              onSave: '&'
            },
            replace: true,
            controller: function($scope) {
                $scope.item.hover = false;
                $scope.getWeightWidth = function (weight) {
                    return Math.round(weight * 5) + 'px';
                };
            }
        };
        return directive;

        function link(scope, element, attrs) {
            console.log('editable-item');
            //var $sidebarInner = element.find('.sidebar-inner');
            //var $dropdownElement = element.find('.sidebar-dropdown a');
            //element.addClass('sidebar');
            //$dropdownElement.click(dropdown);
            //
            //function dropdown(e) {
            //    var dropClass = 'dropy';
            //    e.preventDefault();
            //    if (!$dropdownElement.hasClass(dropClass)) {
            //        $sidebarInner.slideDown(350, scope.whenDoneAnimating);
            //        $dropdownElement.addClass(dropClass);
            //    } else if ($dropdownElement.hasClass(dropClass)) {
            //        $dropdownElement.removeClass(dropClass);
            //        $sidebarInner.slideUp(350, scope.whenDoneAnimating);
            //    }
            //}
        }
    }
})();