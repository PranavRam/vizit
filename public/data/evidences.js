/**
 * Created by pranavram on 10/5/15.
 */
(function(){
    angular.module('app.data')
        .factory('evidences', evidences);

    function evidences(dataservice) {
        var data = [];

        var service = {
            data: data,
            get: get,
            add: add,
            remove: remove
        };

        return service;

        function get(force) {
            //if(force || !data.length){
                return dataservice.getEvidences()
                    .then(function (response) {
                        angular.copy(response, data);
                        return data;
                    });
            //}
            //return data;
        }

        function add() {
            data.push({x: 100, y: 100, weight: 5, name: "Evidences " + data.length});
        }

        function remove() {

        }
    }
})();
