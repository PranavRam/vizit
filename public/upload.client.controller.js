angular.module('vizit')
			.controller('UploadCtrl', UploadCtrl);

function UploadCtrl($scope, $state, Upload) {
	$scope.file = void 0;
	$scope.fileUpdated = function(files, $event) {
    if(!$event) return;
		$scope.file = $event.target.files[0];
	}
	$scope.upload = function (file) {
      $scope.uploading = true;
      Upload.upload({
          url: '/upload',
          fields: {'username': 'Pranav Ram'},
          file: file
      }).progress(function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
      }).success(function (data, status, headers, config) {
          console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
          $scope.uploading = false;
          $state.go('main');
      }).error(function (data, status, headers, config) {
          console.log('error status: ' + status);
          $scope.uploading = false;
      })
  };
}