starterApp.controller('user_profile',["$scope", "$http","$state","iconClassMapping","appUtils","$stateParams", function ($scope, $http,$state,iconClassMapping,appUtils,$stateParams) {

    getUserProfileData();
    function getUserProfileData(){
        $http.get('/manage-users/getUserprofileForUserName').success(function(dataResponse,status,headers,config){
            //success
            appUtils.defaultParseResponse(dataResponse,function(dataResponse){
                $scope.userDetails=dataResponse;
//                console.log("getUserprofileForUserName ----->",dataResponse);
            });
        }).error(function(data,status,headers,config){
            //error
            console.log("Error",data,status,headers,config);
        });
    }
   
          
    $scope.openTestLink=function(){
    	$state.go('testLink');
    }
   
}]);
