/**
 * Created by pranavram on 10/4/15.
 */
(function() {
    'use strict';

    angular
        .module('app.documentviewer')
        .directive('vzDocumentviewer', vzDocumentViewer);

    /* @ngInject */
    function vzDocumentViewer ($q, $http, dataservice, textparser, hypotheses, model, evidences, allData) {
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
                ach: '=',
                hideMinimize: '='
                //onSave: '&'
            },
            replace: true,
            controller: function($scope) {
                $scope.showDocumentViewer = true;
                $scope.showDocumentText = true;
                $scope.selectedDocument = $scope.documents[0];
                $scope.entityTypes = model.entityTypes;
                $scope.selectDocument = function (doc) {
                    if ($scope.selectedDocument._id !== doc._id) {
                        doc.viewCount = doc.viewCount || 0;
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
                    element.addClass('flex-30');
                }
                else {
                    element.removeClass('flex-30');
                }
                scope.$emit('showDocumentViewer:changed')
            });

            function createSnippets(name, sentences, content, wholeDocument, text) {
                var promises = [];
                if(wholeDocument){
                    var snippet = {
                        name: name,
                        text: text
                    };
                    content.push(snippet);
                    var entities = textparser.getEntitiesInSentence(text);
                    /*_.merge(evidenceEntities, entities, function (a, b) {
                     // console.log(a, b);
                     if (_.isArray(b)) {
                     return a.concat(b);
                     }
                     });*/
                    var promise = $http({
                        url: 'api/snippets',
                        method: 'POST',
                        data: {
                            snippet: snippet,
                            entities: entities
                        }
                    });

                    promises.push(promise);
                }
                else {
                    sentences.each(function () {
                        var snippet = {
                            name: name,
                            text: this.innerHTML
                        };
                        content.push(snippet);
                        var entities = textparser.getEntitiesInSentence(this.innerHTML);
                        /*_.merge(evidenceEntities, entities, function (a, b) {
                         // console.log(a, b);
                         if (_.isArray(b)) {
                         return a.concat(b);
                         }
                         });*/
                        var promise = $http({
                            url: 'api/snippets',
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

                return promises;
            }
            scope.addToSelectedEvidence = function() {
                var sentences = angular.element('.document-viewer .document-text .select-text');
                var evidence = scope.ach.selectedEvidence;
                //var evidenceEntities = {};
                var content = evidence.content;
                /*scope.entityTypes.forEach(function (entityType) {
                    evidenceEntities[entityType] = [];
                });*/

                $q.all(createSnippets(scope.selectedDocument.name, sentences, content))
                    .then(function (snippets) {
                        snippets = snippets.map(function (snippet) {
                            return snippet.data;
                        });
                        var promise = $http({
                            url: 'api/evidences/' + evidence._id,
                            method: 'PUT',
                            data: {
                                evidence: evidence,
                                snippets: snippets
                            }
                        });

                        //promise.then(dataservice.updateModels)
                            //.then(allData.get)
                            //.then(scope.ach.updateACH);
                    });
            };

            scope.addEvidence = function (wholeDocument) {
                var sentences = angular.element('.document-viewer .document-text .select-text');
                if (!sentences.length) return;
                var evidence = {
                    x: 100,
                    y: 100,
                    name: 'Evidence ' + evidences.data.length
                };
                var content = [];
                /*var evidenceEntities = {};
                scope.entityTypes.forEach(function (entityType) {
                    evidenceEntities[entityType] = [];
                });*/

                $q.all(createSnippets(scope.selectedDocument.name, sentences, content, wholeDocument, scope.selectedDocument.parsedText))
                    .then(function (snippets) {
                        snippets = snippets.map(function (snippet) {
                            return snippet.data;
                        });

                        evidence.weight = 0;
                        var promise = $http({
                            url: 'api/evidences',
                            method: 'POST',
                            data: {
                                evidence: evidence,
                                snippets: snippets
                            }
                        });

                        //promise.then(dataservice.updateModels)
                        //    .then(allData.get)
                        //    .then(scope.ach.updateACH);
                        });
            }
        }
    }
})();