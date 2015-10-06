/**
 * Created by pranavram on 10/5/15.
 */
(function() {
    'use strict';

    angular
        .module('app.entityviewer')
        .directive('vzEntityviewer', vzEntityviewer);

    /* @ngInject */
    function vzEntityviewer ($rootScope, $timeout, $compile, dataservice, model) {
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
                entityType: '@',
                useSelector: '@'
            },
            replace: true,
            controller: function($scope) {
                $scope.useSelector = $scope.useSelector === 'true' ? true : false;
                $scope.selectedEntity = {};
                $scope.selectedEntityConnections = [];
                $scope.entityTypes = model.entityTypes;
                $scope.entityType = $scope.entityType || model.entityTypes[0];

                var entityCountWidth = 40;
                var entityCountScale = d3.scale.linear();
                var colorScale = d3.scale.linear()
                var extent = null;

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
                                .range(model.entitySpectrum);
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

                function setupScale() {
                    extent = d3.extent($scope.entities, function (d) {
                        return d.tfidf;
                    });
                    // console.log(extent);
                    entityCountScale
                        .domain(extent)
                        .range([1, entityCountWidth]);
                }
                function filterResults() {
                    $scope.filteredEntities = $scope.entities.filter(function(entity) {
                        return entity.type === $scope.entityType.toUpperCase();
                    });
                }
                $scope.$watchGroup(['entityType', 'entities'], function(newVals) {
                    setupScale();
                    filterResults();
                });
                setupScale();
                filterResults();
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
                var siblings = element.children();
                for (var i = 0; i < siblings.length; i++) {
                    if(element.find('.entity-list-container')[0] !== siblings[i]){
                        height += angular.element(siblings[i]).outerHeight();
                    }
                }

                height = scope.useSelector ? (height + 48) : height + 24;
                return height;
            }

            function setHeight() {
                var virtualContainer = angular.element(element.find('.vertical-container')[0]);
                var parentHeight = element.parent().height();
                var siblingHeight = getSiblingHeight();
                console.log(parentHeight, siblingHeight);
                virtualContainer.css('height', (parentHeight - siblingHeight) + 'px');
            }
            //setHeight();
            $timeout(function() {
                setHeight();
            });
            $rootScope.$on('showDocumentViewer:changed', function(event, mass) {
                $timeout(function() {
                    setHeight();
                })
            });
        }
    }
})();