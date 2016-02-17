/**
 * Created by pranavram on 10/4/15.
 */
/**
 * Created by pranavram on 10/4/15.
 */
(function () {
    'use strict';

    angular.module('app.data')
        .factory('model', function () {
            var entityTypes = ["Person", "Organization", "Duration", "Number", "Date", "Location", "Time"];
            var entitySpectrum = ["#ffdc8c", '#ffd278', '#ffc864', '#ffbe50', '#ffb43c', '#ffaa28', '#ffa014'];
            var service = {
                entityTypes: entityTypes,
                entitySpectrum: entitySpectrum
            };

            return service;
        })
        .factory('allData', function ($q, hypotheses, documents, evidences, entities, $rootScope) {
            var service = {
                get: function () {
                    var promises = [evidences.get(), hypotheses.get()];
                    return $q.all(promises);
                },
                getAll: function() {
                    var promises = [entities.get(), documents.get(),
                        evidences.get(), hypotheses.get()];
                    return $q.all(promises);
                }

            };

            $rootScope.$on('loadData', function() {
                service.get().then(function() {
                    $rootScope.$broadcast('loadedData');
                })
            });

            $rootScope.$on('loadAllData', function() {
                service.getAll().then(function() {
                    $rootScope.$broadcast('loadedData');
                })
            });

            return service;
        })
})();