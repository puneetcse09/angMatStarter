angular.module('SpinnerApp', [])
    .factory('httpInterceptor', function ($q, $rootScope, $log) {

        var numLoadings = 0;

        return {
            request: function (config) {

                numLoadings++;

                // Show loader
                $rootScope.$broadcast("loader_show");
                return config || $q.when(config)

            },
            response: function (response) {

                if ((--numLoadings) === 0) {
                    // Hide loader
                    $rootScope.$broadcast("loader_hide");
                }
                return response || $q.when(response);
                /*var type=Object.prototype.toString(response.data);
                 if(type=="[object Object]" && response.data.hasOwnProperty('error') && response.data.error){
                 var msg="OOPs !!! There seems some technical issue.<br>";
                 console.log("Errroorororor",response.data);
                 $('#errorModal').find('modal-header').html(msg);
                 $('#errorModal').find('modal-body').html(response.data.msg || "Please contact Administration.");
                 $('#errorModal').modal('show');
                 }else{
                 return response || $q.when(response);
                 }*/


            },
            responseError: function (response) {

                if (!(--numLoadings)) {
                    // Hide loader
                    $rootScope.$broadcast("loader_hide");
                }

                return $q.reject(response);
            }
        };
    })
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('httpInterceptor');
    }).directive("loader", function ($rootScope) {
        return function ($scope, element, attrs) {
            $scope.$on("loader_show", function () {
                return element.show();
            });
            return $scope.$on("loader_hide", function () {
                return element.hide();
            });
        };
    });
