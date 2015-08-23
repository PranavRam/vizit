angular.module('vizit')
			.controller('MainCtrl', MainCtrl);

function MainCtrl($scope, $http, $mdMenu, $rootScope, $compile) {
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
          .domain(d3.extent(entities, function(d) { return d.tfidf; }))
          .range([1, entityCountWidth]);
      $scope.entities = entities;
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  var template = `
    <div class="md-open-menu-container md-whiteframe-z2">
        <md-menu-content>
            <md-menu-item>
              <md-button class="menu-container-item" ng-click="log(selectedDocument.selectedText)">
                add to selected Hypothesis
              </md-button>
            </md-menu-item>
            <md-menu-item>
              <md-button class="menu-container-item" ng-click="log(selectedDocument.selectedText)">
                add as an Evidence
              </md-button>
            </md-menu-item>
        </md-menu-content>
      </div>
  `;

  var documentMenu = _.template(template);
  // var myCustomMenu = angular.element($compile()($scope));

  $scope.log = function(sentence) { console.log(sentence) };

  var RightClickMenuCtrl = {
    top: 0,
    left: 0,
    open: function(event) {
      RightClickMenuCtrl.left = event.clientX;
      RightClickMenuCtrl.top = event.clientY;
      $mdMenu.show({
        scope: $scope,
        mdMenuCtrl: RightClickMenuCtrl,
        element: function() {
          $scope.selectedDocument.selectedText = event.target.innerHTML;
          // var menu = documentMenu({sentence: _.escape(event.target.innerHTML)});
          return angular.element($compile(template)($scope));
        }(),
        target: 'body' // used for where the menu animates out of
      });
    },
    close: function() { $mdMenu.hide(); },
    positionMode: function() { return { left: 'target', top: 'target' }; },
    offsets: function() { return { top: RightClickMenuCtrl.top, left: RightClickMenuCtrl.left }; }
  };
  $scope.check = function($event) {
    RightClickMenuCtrl.open($event);
  }
}