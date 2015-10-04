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
            var service = {
                entityTypes: entityTypes
            };

            return service;
        })
})();