'use strict';

angularTestApp.config(function($stateProvider, $urlRouterProvider) {
	//
	// For any unmatched url, redirect to /state1
	$urlRouterProvider.otherwise("/manage-users/user-profile");
	// Now set up the states
	$stateProvider
	.state('userProfile', {
		url : "/manage-users/user-profile",
		templateUrl : "partials/modules/manageUsers/userProfile.html",
		controller : 'user_profile',
		data : {
			displayName : 'User Profile'
		}
	})
});

