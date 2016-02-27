/**
 * Created by pranavram on 10/5/15.
 */
(function(){
    angular.module('app.data')
        .factory('hypotheses', hypotheses);

    function hypotheses(dataservice, socket, $rootScope) {
        var data = [];
        socket.on('hypotheses:create', function(response){
            $rootScope.$broadcast('loadData');
            $rootScope.showNotification('Added new Hypothesis');
            //console.log('added hypothesis', hypothesis);
        });

        socket.on('hypotheses:update', function(response) {
            $rootScope.$broadcast('loadData');
            $rootScope.showNotification('Added Evidence ' + response.evidence.name + ' to ' +
            response.hypothesis.name);
        });

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
                        angular.copy(response, data);
                        return data;
                    });
            //}
            //return data;
        }

        function add() {
            var hypothesis = {
                x: 100, y: 100, weight: 0, threshold: 5,
                name: "Hypothesis " + data.length};
            dataservice.createHypothesis(hypothesis);
        }

        function remove() {

        }
    }
})();
