/**
 * Created by pranavram on 10/5/15.
 */
(function () {
    'use strict';

    angular
        .module('app.entityviewer')
        .directive('vzEntityviewer', vzEntityviewer)
        .directive('vzEntityitem', vzEntityitem)
        .directive('vzEntityToolbar', vzEntityToolbar);

    function vzEntityToolbar($rootScope, $timeout, entities, dataservice, model) {
        var directive = {
            link: {
                pre: link
            },
            restrict: 'EA',
            replace: true,
            templateUrl: 'public/entityviewer/vzEntityToolbar.html',
            //require: '^vzEntityviewer46',
            scope: {
                toolbar: '=',
                //barWidth: '&'
            },
            controller: function ($scope) {
                $scope.searchToggle = false;
            }

        }
        return directive;
        function link(scope, element, attrs) {

        }
    }

    function vzEntityitem($rootScope, $timeout, entities, dataservice, model) {
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/entityviewer/vzEntityitem.html',
            //require: '^vzEntityviewer',
            scope: {
                entity: '=',
                barWidth: '&'
            },
            controller: function ($scope) {
                //$scope.styleSheet = {};
                //$scope.styleSheet['background-color'] = 'red';
                $scope.colorScale = d3.scale.ordinal();
                $scope.hover = false;
                $scope.documents = [];
                $scope.getConnections = function () {
                    //console.log('connections');
                    //$scope.selectedEntity = entity;
                    return dataservice.getConnections($scope.entity._id)
                        .then(function (data) {
                            //console.log('in get connections');
                            var connections = data;
                            //window.d3scale = $scope.colorScale;
                            //angular.copy(connections, $scope.selectedEntityConnections);
                            entities.connections = connections;
                            return connections;
                            //console.log($scope.selectedEntityConnections);
                        })
                };
                $scope.getConnectionStrength = function () {
                    //console.log('No Item', $scope.entity.type);
                    //if (entity._id === scope.selectedEntity._id) return '#ff9600';
                    var found = false;
                    entities.connections.forEach(function (connection) {
                        if (connection._id === $scope.entity._id) {
                            found = $scope.colorScale($scope.entity.count);
                            //console.log($scope.entity.count,found);
                        }
                    });
                    return found ? found : 'white';
                    //return found;
                };
                var originatorEv;
                $scope.openMenu = function($mdOpenMenu, ev) {
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    entities.getDocuments($scope.entity._id)
                        .then(function(response) {
                           $scope.documents = response;
                            originatorEv = ev;
                            $mdOpenMenu(ev);
                        });
                };
            }

        };
        return directive;
        function link(scope, element, attrs) {
            element.css('background-color', scope.getConnectionStrength());
            element.on('click', function () {
                //scope.styleSheet['background-color'] = '#ff9600';
                element.css('background-color', '#ff9600');
                scope.getConnections()
                    .then(function (data) {
                        //$timeout(function () {
                            $rootScope.$broadcast('entity:selected', scope.entity);
                        //},500);
                    });
            });

            scope.$on('entity:selected', function (e, entity) {
                //console.log('broadcast');
                if (entity !== scope.entity) {
                    var extent = d3.extent(entities.connections, function (d) {
                        return d.count;
                    });
                    //console.log(model.entitySpectrum);
                    scope.colorScale
                        .domain(extent)
                        .range(model.entitySpectrum);
                    //console.log('----Before-----');
                    //console.log(element[0]);
                    var color = scope.getConnectionStrength();
                    //scope.styleSheet['background-color'] = color;
                    element.css('background-color', color);
                    //console.log(element[0]);
                    //console.log('----After-----');
                }
            });
        }
    }

    /* @ngInject */
    function vzEntityviewer($rootScope, $timeout, entities, dataservice, model) {
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/entityviewer/vzEntityviewer.html',
            scope: {
                entities: '=',
                entityType: '@',
                useSelector: '@',
                showToolbar: '@'
            },
            replace: true,
            controller: function ($scope, $mdDialog) {
                //console.log($scope.showToolbar);
                $scope.useSelector = $scope.useSelector === 'true';
                $scope.showToolbar = $scope.showToolbar === 'true';
                $scope.entityTypes = model.entityTypes;
                $scope.toolbar = {
                    search: '',
                    orderBy: '',
                    reverse: false
                };
                //console.log($scope.showToolbar);
                $scope.entityType = $scope.entityType || model.entityTypes[0];

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

                $scope.$watchGroup(['entityType', 'entities'], function (newVals) {
                    setupScale();
                    //filterResults();
                });
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
                    if (element[0] !== children[i]) {
                        height += angular.element(children[i]).outerHeight();
                    }
                }

                for (i = 0; i < siblings.length; i++) {
                    if (element.find('.entity-list-container')[0] !== siblings[i]) {
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

            setHeight();
            $timeout(function () {
                setHeight();
            });

            $rootScope.$on('showDocumentViewer:changed', function (event, mass) {
                $timeout(function () {
                    setHeight();
                })
            });
        }
    }
})();