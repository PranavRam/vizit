/**
 * Created by pranavram on 10/4/15.
 */
(function() {
    'use strict';

    angular
        .module('app.documentviewer')
        .directive('vzDocumentviewer', vzDocumentViewer);

    /* @ngInject */
    function vzDocumentViewer ($q, $http, dataservice, textparser, hypotheses) {
        // Opens and closes the sidebar menu.
        // Usage:
        //  <div data-cc-sidebar">
        //  <div data-cc-sidebar whenDoneAnimating="vm.sidebarReady()">
        // Creates:
        //  <div data-cc-sidebar class="sidebar">
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/documentviewer/vzDocumentviewer.html',
            scope: {
                documents: '=',
                //onSave: '&'
            },
            replace: true,
            controller: function($scope) {
                $scope.showDocumentViewer = true;
                $scope.showDocumentText = true;
                $scope.selectedDocument = $scope.documents[0];
                $scope.selectDocument = function (doc) {
                    if ($scope.selectedDocument._id !== doc._id) {
                        doc.viewCount = doc.viewCount + 1;
                    }
                    $scope.selectedDocument = doc;
                };
                $scope.addHypothesis = function () {
                    hypotheses.add();
                };
                $scope.$watch('documents', function(newVal) {
                    $scope.selectedDocument = $scope.documents[0];
                })
            }
        };
        return directive;

        function link(scope, element, attrs) {
            scope.$watch('showDocumentViewer', function(newVal) {
                if(newVal) {
                    element.addClass('flex-25');
                }
                else {
                    element.removeClass('flex-25');
                }
                scope.$emit('showDocumentViewer:changed')
            });
            scope.addEvidence = function (wholeDocument) {
                var promises = [];
                var sentences = angular.element('.document-viewer .document-text .select-text');
                var evidence = {
                    x: 100,
                    y: 100,
                    name: 'Evidence ' + scope.evidences.length
                };
                var content = [];
                var evidenceEntities = {};
                scope.entityTypes.forEach(function (entityType) {
                    evidenceEntities[entityType] = [];
                });

                if (!wholeDocument) {
                    sentences.each(function () {
                        var snippet = {
                            name: scope.selectedDocument.name,
                            text: this.innerHTML
                        };
                        content.push(snippet);
                        var entities = textparser.getEntitiesInSentence(this.innerHTML);
                        _.merge(evidenceEntities, entities, function (a, b) {
                            // console.log(a, b);
                            if (_.isArray(b)) {
                                return a.concat(b);
                            }
                        });
                        var promise = $http({
                            url: 'api/snippet',
                            method: 'POST',
                            data: {
                                snippet: snippet,
                                entities: entities
                            }
                        });

                        promises.push(promise);
                        // weight += getWeightsOfEntities(entities);
                    });
                }
                else {
                    content = [];
                    // weight = 0;
                    content.push({
                        name: scope.selectedDocument.name,
                        text: scope.selectedDocument.parsedText
                    });
                    var entities = textparser.getEntitiesInSentence(scope.selectedDocument.parsedText);
                    _.merge(evidenceEntities, entities, function (a, b) {
                        // console.log(a, b);
                        if (_.isArray(b)) {
                            return a.concat(b);
                        }
                    });
                    // var promise = $http({
                    //     url   : 'api/snippet/',
                    //     method: 'POST',
                    //     data  : {
                    //       snippet: content,
                    //       entities: entities
                    //     }
                    // });

                    // promises.push(promise);
                    // weight += getWeightsOfEntities(entities);
                }
                $q.all(promises)
                    .then(function (snippets) {
                        snippets = snippets.map(function (snippet) {
                            return snippet.data;
                        });
                        dataservice.getEntitiesForEvidence(evidenceEntities)
                            .then(function (entities) {
                                entities = entities.map(function (entity) {
                                    return entity.data[0]
                                });
                                var weight = 0;
                                angular.forEach(entities, function (entity) {
                                    weight += entity.properties.weight;
                                });
                                evidence.weight = weight;
                                var promise = $http({
                                    url: 'api/evidences',
                                    method: 'POST',
                                    data: {
                                        evidence: evidence,
                                        snippets: snippets
                                    }
                                });

                                promise.then(function () {
                                    evidence.content = content;
                                    scope.evidences.push(evidence);
                                    scope.ach.updateACH();
                                });
                                // evidence.entities = evidenceEntities;
                            });
                        // });
                    });
            }
        }
    }
})();