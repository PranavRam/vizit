angular.module('app.core')
    .controller('core', core);

function core($scope, $state, model, dataservice, $rootScope, $mdToast,
              hypotheses, evidences, entities, documents, $q, $mdDialog) {
    $scope.documents = [];
    $scope.entities = [];
    $scope.selectedDocument = {};
    $scope.selectedEntity = {};
    $scope.entityType = model.entityTypes[0];
    $scope.entityTypes = model.entityTypes;
    $scope.entityViewer = {
        selectedEntityType: $scope.entityType
    };
    $scope.currentState = $state.current.name;
    $scope.showDocumentText = true;
    $scope.evidences = [];
    $scope.hypotheses = [];
    $scope.evidenceWeightScale = d3.scale.linear();
    $scope.hypothesisWeightScale = d3.scale.linear();

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
    //$scope.config = {}; // use defaults
    //$scope.model = {}; // always pass empty object

    activate();

    function activate() {
        function adjustScales() {
            var evidenceMax = d3.max(evidences.data, function(evidence) {
                return evidence.weight;
            });

            var hypothesisMax = d3.max(hypotheses.data, function(hypothesis) {
                return hypothesis.weight;
            });

            $scope.hypothesisWeightScale
                .domain([0, hypothesisMax])
                .range([0, 200]);

            $scope.evidenceWeightScale
                .domain([0, evidenceMax])
                .range([0, 200]);
        }
        $scope.documents = documents.data;

        $scope.selectedDocument = $scope.documents[0];
        //entities.data
        //var entities = entities.data;
        adjustScales();
        $scope.entities = entities.data;

        $scope.evidences = evidences.data;

        $scope.hypotheses = hypotheses.data;

        $scope.$on('loadedData', function() {
            adjustScales();
        });
    }


    $scope.go = function (stateLoc) {
        $state.go(stateLoc);
        $scope.currentState = stateLoc;
    };

    $scope.updateItem = function(type, item) {
        var promise;
        if(type === 'hypotheses'){
            promise = dataservice.updateHypothesis(item);
        }
        else {
            promise = dataservice.updateEvidence(item);
        }
        promise.then($scope.ach.updateACH);

    };

    $scope.showLocation = function(item){
        if(item){
            $scope.ach.moveTo(item);
        }
    };
    $scope.ach.getData = function() {
        var promises = [documents.get(), entities.get(),
            evidences.get(), hypotheses.get()];

        return $q.all(promises);
    };

    var originatorEv;
    $scope.openMenu = function($mdOpenMenu, ev) {
        originatorEv = ev;
        $mdOpenMenu(ev);
    };

    $scope.resetAnalysis = function() {
        //$mdDialog.show(
        //    $mdDialog.alert()
        //        .title('You clicked!')
        //        .content('You clicked reset analysis')
        //        .ok('Nice')
        //        .targetEvent(originatorEv)
        //);
        //originatorEv = null;
        dataservice.resetAnalysis()
            .then($scope.ach.getData)
            .then($scope.ach.updateACH)
    };

    $scope.resetAll = function() {
        //$mdDialog.show(
        //    $mdDialog.alert()
        //        .title('You clicked!')
        //        .content('You clicked reset all')
        //        .ok('Nice')
        //        .targetEvent(originatorEv)
        //);
        //originatorEv = null;
        dataservice.resetAll()
            .then(function() {
                $state.go('upload');
            })
    };

    $rootScope.toastPosition = {
        bottom: true,
        top: false,
        left: false,
        right: true
    };
    $rootScope.getToastPosition = function () {
        return Object.keys($scope.toastPosition)
            .filter(function (pos) {
                return $scope.toastPosition[pos];
            })
            .join(' ');
    };

    $rootScope.showNotification = function (title) {
        $mdToast.show(
            $mdToast.simple()
                .content(title)
                .position($scope.getToastPosition())
                .hideDelay(3000)
        );
    };
}