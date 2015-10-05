/**
 * Created by pranavram on 10/5/15.
 */
(function() {
    'use strict';

    angular
        .module('app.entityviewer')
        .directive('vzEntityviewer', vzEntityviewer);

    /* @ngInject */
    function vzEntityviewer ($timeout) {
        // Opens and closes the sidebar menu.
        // Usage:
        //  <div data-cc-sidebar">
        //  <div data-cc-sidebar whenDoneAnimating="vm.sidebarReady()">
        // Creates:
        //  <div data-cc-sidebar class="sidebar">
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/entityviewer/vzEntityviewer.html',
            scope: {
                entities: '=',
                //onSave: '&'
            },
            replace: true,
            controller: function($scope) {
                $scope.selectedEntity = {};
                var entityCountWidth = 40;
                var entityCountScale = d3.scale.linear();
                var entities = $scope.entities;
                var extent = d3.extent(entities, function (d) {
                    return d.tfidf;
                });
                // console.log(extent);
                entityCountScale
                    .domain(extent)
                    .range([1, entityCountWidth]);
                $scope.getOccurenceWidth = function (count) {
                    return Math.round(entityCountScale(count)) + 'px';
                };
                $scope.getConnections = function (entity) {
                    $scope.selectedEntity = entity;
                    dataservice.getConnections(entity._id)
                        .then(function (data) {
                            var connections = data;
                            var extent = d3.extent(connections, function (d) {
                                return d.count;
                            });
                            // console.log(extent);
                            colorScale
                                .domain(extent)
                                .range(["#ffdc8c", '#ffd278', '#ffc864', '#ffbe50', '#ffb43c', '#ffaa28', '#ffa014']);
                            $scope.selectedEntityConnections = connections;
                        })
                };
                $scope.getConnectionStrength = function (entity) {
                    if (!entity) return 'white';
                    if (entity._id === $scope.selectedEntity._id) return '#ff9600';
                    var found = false;
                    $scope.selectedEntityConnections.forEach(function (connection) {
                        if (connection._id === entity._id) {
                            found = colorScale(entity.count);
                        }
                    });
                    if (!found) return 'white';
                    return found;
                }
            }
        };
        return directive;

        function link(scope, element, attrs) {

            function getSiblingHeight() {
                var children = element.parent().children();
                var height = 0;
                for (var i = 0; i < children.length; i++) {
                    if(element[0] !== children[i]){
                        height += angular.element(children[i]).outerHeight();
                    }
                }
                return height;
            }

            function setHeight() {
                var virtualContainer = element.find('#vertical-container');
                var parentHeight = element.parent().height();
                var siblingHeight = getSiblingHeight();
                //console.log(parentHeight, siblingHeight);
                virtualContainer.css('height', (parentHeight - siblingHeight - 48) + 'px');
            }
            setHeight();
            //$timeout(setHeight);
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