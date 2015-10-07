/**
 * Created by pranavram on 10/5/15.
 */
(function() {
    'use strict';

    angular
        .module('app.achmatrix')
        .directive('vzAchmatrix', vzAchmatrix);

    /* @ngInject */
    function vzAchmatrix () {
        // Opens and closes the sidebar menu.
        // Usage:
        //  <div data-cc-sidebar">
        //  <div data-cc-sidebar whenDoneAnimating="vm.sidebarReady()">
        // Creates:
        //  <div data-cc-sidebar class="sidebar">
        var directive = {
            link: link,
            restrict: 'EA',
            templateUrl: 'public/achmatrix/vzAchmatrix.html',
            //replace: true,
            controller: function($scope, $http) {
                $scope.gridOptions = {};
                var fields = [];
                var k = 9;
                for(var i = 0; i< k; i++) {
                    fields.push('hypothesis ' + i);
                }
                $scope.gridOptions.columnDefs = fields.map(function(field) {
                    return {
                        field: field, cellTemplate: '/public/achmatrix/sparkline-cell.html', width: 150
                    };
                });


                $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100.json')
                    .success(function (data) {
                        data.forEach(function (d) {
                            for(var i = 0; i< k; i++) {
                                d[fields[i]] = {
                                    options: {
                                        chart: {
                                            type: 'sparklinePlus',
                                            height: 20,
                                            width: 100,
                                            x: function (xd, i) {
                                                return i;
                                            }
                                        }
                                    },
                                    data: []
                                };
                                // Generate random X values
                                for (var j = 0; j < 10; j++) {
                                    d[fields[i]].data.push({x: i, y: Math.floor(Math.random() * (150 - 1 + 1) + 1)});
                                }
                            }
                        });
                        $scope.gridOptions.data = data;
                        //console.log($scope.gridOptions.data);
                    });
            }
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }
})();