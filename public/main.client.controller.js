angular.module('vizit')
			.controller('MainCtrl', MainCtrl);

function MainCtrl($scope, $http) {
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
}