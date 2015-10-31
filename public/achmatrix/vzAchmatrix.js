/**
 * Created by pranavram on 10/5/15.
 */
(function () {
    'use strict';

    angular
        .module('app.achmatrix')
        .directive('vzAchmatrix', vzAchmatrix);

    /* @ngInject */
    function vzAchmatrix(dataservice) {
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
            controller: function ($scope, $http, hypotheses, evidences) {
                $scope.gridOptions = {};
                activate();
                function activate() {
                    var fields = hypotheses.data.map(function (hyp) {
                        return hyp.name
                    });
                    fields = ['Evidences'].concat(fields);
                    $scope.gridOptions.columnDefs = fields.map(function (field) {
                        return {
                            field: field,
                            cellClass: function(grid, row, col, rowRenderIndex, colRenderIndex) {
                                if(colRenderIndex === 0) {
                                    return 'white';
                                }
                                if (grid.getCellValue(row,col) < 0) {
                                    return 'red';
                                }
                                if(grid.getCellValue(row,col) > 0) {
                                    return 'green';
                                }
                                return 'white'
                            }, width: 150
                        };
                    });


                    //$http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100.json')
                    var data = [];
                    evidences.data.forEach(function(ev){
                            var gridData = {};
                            hypotheses.data.forEach(function(hp) {
                                var pIndex = _.findIndex(hp.positive, {_id: ev._id});
                                var nIndex = _.findIndex(hp.negative, {_id: ev._id});
                                if(pIndex > -1){
                                    gridData[hp.name] = ev.weight;
                                }
                                else if(nIndex > -1) {
                                    gridData[hp.name] = -ev.weight;
                                }
                            });
                            gridData['Evidences'] = ev.name;
                            //console.log(achMatrix);
                            data.push(gridData);
                        });
                    $scope.gridOptions.data = data;
                    console.log($scope.gridOptions.data);
                }
            }
        };
        return directive;

        function link(scope, element, attrs) {

        }
    }
})();