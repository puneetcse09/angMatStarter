'use strict';

angular.module('angularTestApp')
  .controller('NavbarCtrl', function ($scope, $location,$http,appUtils) {
	  
    $scope.getOrgLogoPath=function(){
        if($scope.schoolDetails){
            var path="images/yeoman.png";
            return path;
        }
    }
  });
