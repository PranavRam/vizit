/**
 * Created by pranavram on 10/5/15.
 */
(function(){
    angular.module('app.data')
        .factory('entities', entities);

    function entities(dataservice) {
        var data = [];
        var connections = []
        var service = {
            data: data,
            get: get,
            add: add,
            remove: remove,
            connections: connections
        };

        return service;

        function get(force) {
            //if(force || !data.length){
                return dataservice.getEntities()
                    .then(function (response) {
                        data = response;
                        return data;
                    });
            //}
            //return data;
        }

        function add() {
        }

        function remove() {

        }
    }
})();
