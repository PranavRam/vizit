/**
 * Created by pranavram on 10/5/15.
 */
(function(){
    angular.module('app.data')
        .factory('documents', documents);

    function documents(dataservice) {
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
                return dataservice.getDocuments()
                    .then(function (response) {
                        angular.copy(response, data);
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
