/**
 * Created by pranavram on 10/4/15.
 */
(function () {
    'use strict';

    angular.module('app.core')
        .factory('textparser', function (model) {
            var service = {
                getEntitiesInSentence: getEntitiesInSentence
            };

            return service;

            function getEntitiesInSentence(sentence) {
                var parsedHTML = $.parseHTML(sentence);
                var entities = {};
                model.entityTypes.forEach(function (entityType) {
                    var entitiesFilter = parsedHTML.filter(function (node) {
                        return node.tagName === entityType.toUpperCase();
                    });
                    if (entitiesFilter.length) {
                        entities[entityType] = entitiesFilter.map(function (entity) {
                            return {
                                name: entity.innerHTML,
                                id: +entity.getAttribute('data-entity-id')
                            }
                        });
                    }
                });
                return entities;
            }
        })
})();