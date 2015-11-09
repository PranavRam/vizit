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
    //window.scp = entities.connections;
    var entityCountScale = d3.scale.linear();
    var entityCountWidth = 40;


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

        $scope.documents = documents.data.map(function (data) {
            data.viewCount = 0;
            return data;
        });

        $scope.selectedDocument = $scope.documents[0];
        //entities.data
        //var entities = entities.data;
        var extent = d3.extent(entities.data, function (d) {
            return d.tfidf;
        });

        entityCountScale
            .domain(extent)
            .range([1, entityCountWidth]);

        $scope.entities = entities.data;

        $scope.evidences = evidences.data;

        $scope.hypotheses = hypotheses.data;
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

    }

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
        $mdDialog.show(
            $mdDialog.alert()
                .title('You clicked!')
                .content('You clicked reset analysis')
                .ok('Nice')
                .targetEvent(originatorEv)
        );
        originatorEv = null;
    };

    $scope.resetAll = function() {
        $mdDialog.show(
            $mdDialog.alert()
                .title('You clicked!')
                .content('You clicked reset all')
                .ok('Nice')
                .targetEvent(originatorEv)
        );
        originatorEv = null;
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