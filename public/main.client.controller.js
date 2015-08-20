angular.module('vizit')
			.controller('MainCtrl', MainCtrl);

function MainCtrl($scope, $http, $mdMenu, $rootScope) {
	$scope.documents = [];
  $scope.entities = [];
  $scope.selectedDocument = {};
  $scope.entityType = "Person";
  $scope.entityTypes = ["Person", "Organization", "City", "Quantity", "JobTitle", "FieldTerminology"];
  $scope.showDocumentText = true;
  var entityCountScale = d3.scale.linear();
  $scope.ach = {
    toolbar: {
      isOpen: false
    },
    searchInput: "",
    fullscreen: false
  };
  $scope.config = {}; // use defaults
  $scope.model = {}; // always pass empty object
  var entityCountWidth = 40;

  $scope.getOccurenceWidth = function(count) {
    return Math.round(entityCountScale(count)) + 'px';
  }

  $scope.selectDocument = function(doc) {
    if($scope.selectedDocument._id !== doc._id){
      doc.viewCount = doc.viewCount + 1;
    };
    $scope.selectedDocument = doc;
  };
  
  $http.get('/api/documents').
    then(function(response) {
      $scope.documents = response.data.map(function(data) {
        data.viewCount = 0;
        return data;
      });
      // console.log($scope.documents);
      $scope.selectedDocument = $scope.documents[0];
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $http.get('/api/entities').
    then(function(response) {
      var entities = response.data;
      entityCountScale
          .domain(d3.extent(entities, function(d) { return d.count; }))
          .range([1, entityCountWidth]);
      $scope.entities = entities;
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  var myCustomMenu = angular.element(`<div class="md-open-menu-container md-whiteframe-z2">
    <md-menu-content>
       <md-menu-item>
          <md-button ng-click="log(this)">
            Yo
          </md-button>
        </md-menu-item>
    </md-menu-content>
  </div>`);

  var RightClickMenuCtrl = {
    top: 0,
    left: 0,
    open: function(event) {
      RightClickMenuCtrl.left = event.offsetX;
      RightClickMenuCtrl.top = event.offsetY;
      $mdMenu.show({
        scope: $rootScope.$new(),
        mdMenuCtrl: RightClickMenuCtrl,
        element: myCustomMenu,
        target: event.target // used for where the menu animates out of
      });
    },
    log: function() { console.log(arguments) },
    close: function() { $mdMenu.hide(); },
    positionMode: function() { return { left: 'target', top: 'target' }; },
    offsets: function() { return { top: RightClickMenuCtrl.top, left: RightClickMenuCtrl.left }; }
  };
  $scope.check = function($event) {
    RightClickMenuCtrl.open($event);
  }
}