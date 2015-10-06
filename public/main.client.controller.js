angular.module('vizit')
    .controller('MainCtrl', MainCtrl);

angular.module('vizit').controller('AchSummaryCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.gridOptions = {};

    $scope.gridOptions.columnDefs = [
        {field: 'name'},
        {field: 'gender'},
        {field: 'spark', cellTemplate: '/public/partials/sparkline-cell.html', width: 100}
    ];

    $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100.json')
        .success(function (data) {
            data.forEach(function (d) {
                d.spark = {
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
                for (i = 0; i < 10; i++) {
                    d.spark.data.push({x: i, y: Math.floor(Math.random() * (100 - 1 + 1) + 1)});
                }
            });

            $scope.gridOptions.data = data;
        });
}]);
function MainCtrl($scope, $state, model,
                  hypotheses, evidences, entities, documents) {
    $scope.documents = [];
    $scope.entities = [];
    $scope.selectedDocument = {};
    $scope.selectedEntity = {};
    $scope.selectedEntityConnections = [];
    $scope.entityType = model.entityTypes[0];
    $scope.entityTypes = model.entityTypes;
    $scope.entityViewer = {
        selectedEntityType: $scope.entityType
    };
    $scope.currentState = $state.current.name;
    $scope.showDocumentText = true;
    $scope.evidences = [];
    $scope.hypotheses = [];

    var entityCountScale = d3.scale.linear();
    var entityCountWidth = 40;
    // .domain([0, min, max])
    // .range(["white", "#ffdc8c", "#ff9600"]);
    $scope.ach = {
        toolbar: {
            isOpen: false
        },
        searchInput: "",
        fullscreen: false,
        selectedHypothesis: null,
        selectedEvidence: null,
        showDocumentViewer: true
    };
    $scope.config = {}; // use defaults
    $scope.model = {}; // always pass empty object

    activate();

    function activate() {
        documents.get()
            .then(function (data) {
                $scope.documents = data.map(function (data) {
                    data.viewCount = 0;
                    return data;
                });
                // console.log($scope.documents);
                $scope.selectedDocument = $scope.documents[0];
                return $scope.documents;
            });

        entities.get()
            .then(function (data) {
                var entities = data;
                var extent = d3.extent(entities, function (d) {
                    return d.tfidf;
                });
                // console.log(extent);
                entityCountScale
                    .domain(extent)
                    .range([1, entityCountWidth]);

                $scope.entities = entities;
            });

        evidences.get().then(function(data) { $scope.evidences = data; });

        hypotheses.get().then(function(data) { $scope.hypotheses = data; });
    }


    $scope.go = function (stateLoc) {
        $state.go(stateLoc);
        $scope.currentState = stateLoc;
    };
}