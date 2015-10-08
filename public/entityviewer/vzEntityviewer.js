/**
 * Created by pranavram on 10/5/15.
 */
(function() {
    'use strict';

    angular
        .module('app.entityviewer')
        .directive('vzEntityviewer', vzEntityviewer)
        .directive('vzEntityitem', vzEntityitem);

    function vzEntityitem ($rootScope, $timeout, entities, dataservice, model) {
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/entityviewer/vzEntityitem.html',
            scope: {
                entity: '=',
                colorScale: '=',
                barWidth: '&'
            },
            controller: function ($scope) {
                //$scope.styleSheet = {};
                //$scope.styleSheet['background-color'] = 'red';
                $scope.getConnections = function () {
                    console.log('connections');
                    //$scope.selectedEntity = entity;
                    dataservice.getConnections($scope.entity._id)
                        .then(function (data) {
                            var connections = data;
                            var extent = d3.extent(connections, function (d) {
                                return d.count;
                            });
                            // console.log(extent);
                            $scope.colorScale
                                .domain(extent)
                                .range(model.entitySpectrum);
                            //angular.copy(connections, $scope.selectedEntityConnections);
                            entities.connections = connections;
                            $rootScope.$broadcast('entity:selected', $scope.entity);
                            //console.log($scope.selectedEntityConnections);
                        })
                };
            }
        }
        return directive;
        function link(scope, element, attrs) {
            //element.css('background-color', 'white');
            //element.on('click', function() {
            //    //scope.styleSheet['background-color'] = '#ff9600';
            //    //element.css('background-color', '#ff9600');
            //    scope.getConnections();
            //});
        }
    }

    /* @ngInject */
    function vzEntityviewer ($rootScope, $timeout, entities, dataservice, model) {
        var directive = {
            link: {
                pre:link
            },
            restrict: 'EA',
            templateUrl: 'public/entityviewer/vzEntityviewer.html',
            scope: {
                entities: '=',
                entityType: '@',
                useSelector: '@'
            },
            replace: true,
            controller: function($scope) {
                $scope.useSelector = $scope.useSelector === 'true';
                $scope.entityTypes = model.entityTypes;
                $scope.entityType = $scope.entityType || model.entityTypes[0];
                $scope.colorScale = d3.scale.linear();

                var entityCountWidth = 40;
                var entityCountScale = d3.scale.linear();
                var extent = null;

                $scope.getOccurenceWidth = function (count) {
                    return Math.round(entityCountScale(count)) + 'px';
                };

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

                $scope.getConnectionStrength = function(entity) {
                    //console.log('No Item', $scope.entity.type);
                    //if (entity._id === scope.selectedEntity._id) return '#ff9600';
                    var found = false;
                    entities.connections.forEach(function (connection) {
                        if (connection._id === entity._id) {
                            found = $scope.colorScale(entity.count);
                        }
                    });
                    return found ? found :  'white';
                    //return found;
                };

                $scope.$on('entity:selected', function(e, entity) {
                    //if(entity !== scope.entity) {
                        //console.log('----Before-----');
                        console.log($scope.filteredEntities);
                        $scope.filteredEntities.forEach(function(value) {
                            if(value !== entity) {
                                value.connectionColor = $scope.getConnectionStrength(value);
                            }
                            else {
                                value.connectionColor = '#ff9600';
                            }
                        });
                        //var color = $scope.getConnectionStrength();
                        //scope.styleSheet['background-color'] = color;
                        //element.css('background-color', color);
                        //console.log(element[0]);
                        //console.log('----After-----');
                    //}
                })
                //$scope.$watchCollection('selectedEntityConnections', function(newVal) {
                //    filterResults();
                //    console.log('changed');
                //})
            }
        };
        return directive;

        function link(scope, element, attrs) {

            function getSiblingHeight() {
                var children = element.parent().children();
                var height = 0;
                var siblings = element.children();
                var i;

                for (i = 0; i < children.length; i++) {
                    if(element[0] !== children[i]){
                        height += angular.element(children[i]).outerHeight();
                    }
                }

                for (i = 0; i < siblings.length; i++) {
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
                //console.log(parentHeight, siblingHeight);
                virtualContainer.css('height', (parentHeight - siblingHeight) + 'px');
            }
            //setHeight();
            $timeout(function() {
                //setHeight();
            });

            $rootScope.$on('showDocumentViewer:changed', function(event, mass) {
                $timeout(function() {
                    setHeight();
                })
            });
        }
    }
})();