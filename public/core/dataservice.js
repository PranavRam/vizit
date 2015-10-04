/**
 * Created by pranavram on 10/4/15.
 */
(function () {
    'use strict';

    angular.module('app.core')
        .factory('dataservice', function ($http, $location) {
            var service = {
                getDocuments: getDocuments,
                getEvidences: getEvidences,
                getEntities: getEntities,
                getConnections: getConnections
            };

            return service;

            function getDocuments() {
                return $http.get('/api/documents').
                    then(getDocumentsComplete);

                function getDocumentsComplete(data, status, headers, config) {
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
                return $http.get('/api/connections/'+id).
                    then(getConnectionsComplete)

                function getConnectionsComplete(data, status, headers, config) {
                    return data.data;
                }
            }
        })
})();