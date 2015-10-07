/**
 * Created by pranavram on 10/5/15.
 */
(function(){
    angular.module('app.data')
        .factory('hypotheses', hypotheses);

    function hypotheses(dataservice) {
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
                return dataservice.getHypotheses()
                    .then(function (response) {
                        data = response;
                        return data;
                    });
            //}
            //return data;
        }

        function add() {
            data.push({x: 100, y: 100, weight: 5, name: "Hypothesis " + data.length});
        }

        function remove() {

        }
    }
})();
