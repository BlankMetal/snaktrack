(function () {
  "use strict";

  angular.module("snackTrackClassic").controller("SnackController", function ($scope, snackApi) {
    $scope.title = "SnakTrack Classic";
    $scope.requests = snackApi.allRequests();

    $scope.approve = function (request) {
      if (request.qty > 50) {
        request.status = "finance-jail";
        return;
      }

      request.status = "approved";
    };
  });
})();

