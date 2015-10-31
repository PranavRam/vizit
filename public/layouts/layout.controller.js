/**
 * Created by pranavram on 10/31/15.
 */
angular.module('app.core')
    .controller('layout', layout);

function layout($scope, $mdSidenav) {
    $scope.toggleNotification = function() {
        $mdSidenav('right')
            .toggle();
    }
}