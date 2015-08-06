'use strict';

angular.module('angularTestApp').controller('Breadcrumb', function ($scope, $location,iconClassMapping) {
    $scope.iconClassMapping=iconClassMapping;
    $scope.menu = [{
        'title': 'Home',
        'link': '/'
    },
        {
            'title': 'About',
            'link': '#'
        },
        {
            'title': 'Contact',
            'link': '#'
        }];

    $scope.isActive = function(route) {
        return route === $location.path();
    };
});