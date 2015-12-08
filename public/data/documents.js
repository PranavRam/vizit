/**
 * Created by pranavram on 10/5/15.
 */
(function(){
    angular.module('app.data')
        .factory('documents', documents);

    function documents(dataservice, socket, $rootScope) {
        var data = [];
        socket.on('document:processed', function(response) {
            $rootScope.$broadcast('loadData');
            $rootScope.showNotification('Added Document ' + response.document.name);
        });
        socket.on('documents:processed', function(response) {
            $rootScope.$broadcast('loadData');
            $rootScope.showNotification('Processed All Documents');
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
                return dataservice.getDocuments()
                    .then(function (response) {
                        var mergedList = _.map(response, function(item){
                            return _.extend(item, _.findWhere(data, { _id: item._id }));
                        });
                        angular.copy(mergedList, data);
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
