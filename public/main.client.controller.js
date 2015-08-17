angular.module('vizit')
			.controller('MainCtrl', MainCtrl);

function MainCtrl($scope, $http) {
	$scope.documents = [];
  $scope.entities = [];
  $scope.selectedDocumentText = "";
  $scope.entityType = "Person";
  $scope.entityTypes = ["Person", "Organization", "City", "Quantity", "JobTitle", "FieldTerminology"];
  $scope.selectDocument = function(doc) {
    $scope.selectedDocumentText = doc.text;
  }
  
  $http.get('/api/documents').
    then(function(response) {
      $scope.documents = response.data;
      $scope.selectedDocumentText = $scope.documents[0].text;
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $http.get('/api/entities').
    then(function(response) {
      $scope.entities = response.data;
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
}