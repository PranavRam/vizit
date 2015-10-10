/**
 * Created by pranavram on 10/4/15.
 */
(function () {
    'use strict';

    angular.module('app.core')
        .factory('dataservice', function ($http, $q) {
            var service = {
                getDocuments: getDocuments,
                getHypotheses: getHypotheses,
                getEvidences: getEvidences,
                getEntities: getEntities,
                getConnections: getConnections,
                getEntitiesForEvidence: getEntitiesForEvidence,

                createHypothesis: createHypothesis,

                updateHypothesis: updateHypothesis,

                getHypothesisEvents: getHypothesisEvents,
                getHypothesesEvents: getHypothesesEvents
            };

            return service;

            function getDocuments() {
                return $http.get('/api/documents').
                    then(getDocumentsComplete);

                function getDocumentsComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function getHypotheses() {
                return $http.get('/api/hypotheses').
                    then(getHypothesesComplete);

                function getHypothesesComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function createHypothesis(data) {
                return $http({
                    url: 'api/hypotheses',
                    method: 'POST',
                    data: {
                        hypothesis: data
                    }
                })
                    .then(createHypothesisComplete);

                function createHypothesisComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function updateHypothesis(data, evidence, oldWeight) {
                return $http({
                    url: 'api/hypotheses/' + data._id,
                    method: 'PUT',
                    data: {
                        hypothesis: data,
                        ev: evidence,
                        weight: oldWeight

                    }
                })
                    .then(updateHypothesisComplete);

                function updateHypothesisComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function getHypothesisEvents(id) {
                return $http.get('/api/hypotheses/' + id + '/events')
                    .then(getHypothesisEventsComplete);

                function getHypothesisEventsComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function getHypothesesEvents() {
                return $http.get('/api/events')
                    .then(getHypothesesEventsComplete);

                function getHypothesesEventsComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function getEvidences() {
                return $http.get('/api/evidences')
                    .then(getEvidencesComplete);

                function getEvidencesComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function getEntities() {
                return $http.get('/api/entities')
                    .then(getEntitiesComplete);

                function getEntitiesComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function getConnections(id) {
                return $http.get('/api/connections/' + id).
                    then(getConnectionsComplete);

                function getConnectionsComplete(data, status, headers, config) {
                    return data.data;
                }
            }

            function getEntitiesForEvidence(entities) {
                var promises = [];
                for (var entityType in entities) {
                    if (entities.hasOwnProperty(entityType)) {
                        var arrayEntities = _.uniq(entities[entityType], 'id');
                        angular.forEach(arrayEntities, function (entity) {
                            var promise = $http({
                                url: 'api/entities/' + entity.id,
                                method: 'GET'
                            });
                            promises.push(promise);
                        })
                    }
                }
                return $q.all(promises);
            }
        })
})();