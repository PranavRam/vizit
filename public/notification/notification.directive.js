/**
 * Created by pranavram on 10/31/15.
 */
angular.module('app.notification')
    .directive('vzNotificationList', vzNotificationList);

function vzNotificationList() {

    var directive = {
        link: link,
        restrict: 'E',
        templateUrl: 'public/notification/notification-list.html',
        controller: function($scope, $mdSidenav, notifications) {
            $scope.close = function () {
                console.log('close');
                $mdSidenav('right').close();
            }

            $scope.todos = [];
            notifications.get().then(function(response) {
                $scope.notifications = response;
            });
        }
    }
    return directive;

    function link() {

    }
};