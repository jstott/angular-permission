(function () {
    'use strict';

    var app = angular.module('permission', ['ui.router']);
    app.run(['$rootScope', 'permission', '$state', function ($rootScope, Permission, $state) {
        $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            // If there are permissions set then prevent default and attempt to authorize
            if (toState.data && toState.data.permissions) {
                  Permission.authorize(toState.data.permissions)
                      .then(authorized)
                      .catch(rejected);
            }

            function authorized() {
              // really nothing to do - let the navigation continue
              $rootScope.$broadcast('$stateChangeSuccess', toState, toParams, fromState, fromParams);
            }
            
            function rejected() {
                var redirectTo = permissions.redirectTo;
                event.preventDefault();
                if (redirectTo) {
                    //console.log('redirectTo: ' + redirectTo);
                    $state.go(redirectTo);
                    $rootScope.$broadcast('$stateChangeSuccess', toState, toParams, fromState, fromParams);
                }
            }
        });

    }]);
}());
