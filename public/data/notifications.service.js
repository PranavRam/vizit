/**
 * Created by pranavram on 10/5/15.
 */
(function(){
    angular.module('app.data')
        .factory('notifications', notifications);

    function notifications(dataservice) {
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
            return dataservice.getNotifications()
                .then(function (response) {
                    angular.copy(response, data);
                    return data;
                });
            //}
            //return data;
        }

        function add() {
            //var hypothesis = {
            //    x: 100, y: 100, weight: 0,
            //    name: "Hypothesis " + data.length};
            //dataservice.createHypothesis(hypothesis)
            //    .then(function(result) {
            //        result.positive = []
            //        result.negative = [];
            //        data.push(result);
            //    });
        }

        function remove() {

        }
    }
})();
