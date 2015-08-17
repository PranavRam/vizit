angular.module('vizit')
			.controller('MainCtrl', MainCtrl);

function MainCtrl($scope, $http) {
	$scope.documents = [];
  $scope.entities = [];
  $scope.selectedDocument = {};
  $scope.entityType = "Person";
  $scope.entityTypes = ["Person", "Organization", "City", "Quantity", "JobTitle", "FieldTerminology"];
  $scope.selectDocument = function(doc) {
    if($scope.selectedDocument._id !== doc._id){
      doc.viewCount = doc.viewCount + 1;
    };
    $scope.selectedDocument = doc;
  }
  
  $http.get('/api/documents').
    then(function(response) {
      $scope.documents = response.data.map(function(data) {
        data.viewCount = 0;
        return data;
      });
      $scope.selectedDocument = $scope.documents[0];
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $http.get('/api/entities').
    then(function(response) {
      $scope.entities = response.data.map(function(data) {
        data.count = Math.floor(Math.random() * 20) + 1;
        return data;
      });
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
}