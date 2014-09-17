/**
 * angular-permission
 * Route permission and access control as simple as it can get
 * @version v0.1.3 - 2014-09-17
 * @link http://www.rafaelvidaurre.com
 * @author JWStott <jwstott@gmail.com>, Rafael Vidaurre <narzerus@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

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
                var redirectTo = toState.data.permissions.redirectTo;
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

(function () {
    'use strict';

    angular.module('permission')
      .provider('permission', function () {
          var roleValidationConfig = {};
          var validateRoleDefinitionParams = function (roleName, validationFunction) {
              if (!angular.isString(roleName)) {
                  throw new Error('Role name must be a string');
              }
              if (!angular.isFunction(validationFunction)) {
                  throw new Error('Validation function not provided correctly');
              }
          };

          this.defineRole = function (roleName, validationFunction) {
              /**
                This method is only available in config-time, and cannot access services, as they are
                not yet injected anywere which makes this kinda useless.
                Should remove if we cannot find a use for it.
              **/
              validateRoleDefinitionParams(roleName, validationFunction);
              roleValidationConfig[roleName] = validationFunction;

              return this;
          };

          this.$get = ['$q', function ($q) {
              var Permission = {
                  _promiseify: function (value) {
                      /**
                        Converts a value into a promise, if the value is truthy it resolves it, otherwise
                        it rejects it
                      **/
                      if (value && angular.isFunction(value.then)) {
                          return value;
                      }

                      var deferred = $q.defer();
                      if (value) {
                          deferred.resolve();
                      } else {
                          deferred.reject();
                      }
                      return deferred.promise;
                  },
                  _validateRoleMap: function (roleMap) {
                      if (typeof (roleMap) !== 'object' || roleMap instanceof Array) {
                          throw new Error('Role map has to be an object');
                      }
                      if (roleMap.only === undefined && roleMap.except === undefined) {
                          throw new Error('Either "only" or "except" keys must me defined');
                      }
                      if (roleMap.only) {
                          if (!(roleMap.only instanceof Array)) {
                              throw new Error('Array of roles excepted');
                          }
                      } else if (roleMap.except) {
                          if (!(roleMap.except instanceof Array)) {
                              throw new Error('Array of roles excepted');
                          }
                      }
                  },
                  _findMatchingRole: function (rolesArray) {
                      var roles = angular.copy(rolesArray);
                      var deferred = $q.defer();
                      var currentRole = roles.shift();

                      // If no roles left to validate reject promise
                      if (!currentRole) {
                          deferred.reject();
                          return deferred.promise;
                      }
                      // Validate role definition exists
                      if (!angular.isFunction(Permission.roleValidations[currentRole])) {
                          throw new Error('undefined role or invalid role validation');
                      }

                      var validatingRole = Permission.roleValidations[currentRole](currentRole);
                      validatingRole = Permission._promiseify(validatingRole);

                      validatingRole.then(function () {
                          deferred.resolve();
                      }, function () {
                          Permission._findMatchingRole(roles).then(function () {
                              deferred.resolve();
                          }, function () {
                              deferred.reject();
                          });
                      });

                      return deferred.promise;
                  },
                  defineRole: function (roleName, validationFunction) {
                      /**
                        Service-available version of defineRole, the callback passed here lives in the
                        scope where it is defined and therefore can interact with other modules
                      **/
                      validateRoleDefinitionParams(roleName, validationFunction);
                      roleValidationConfig[roleName] = validationFunction;

                      return Permission;
                  },
                  resolveIfMatch: function (rolesArray) {
                      var roles = angular.copy(rolesArray);
                      var deferred = $q.defer();
                      Permission._findMatchingRole(roles).then(function () {
                          // Found role match
                          deferred.resolve();
                      }, function () {
                          // No match
                          deferred.reject();
                      });
                      return deferred.promise;
                  },
                  rejectIfMatch: function (roles) {
                      var deferred = $q.defer();
                      Permission._findMatchingRole(roles).then(function () {
                          // Role found
                          deferred.reject();
                      }, function () {
                          // Role not found
                          deferred.resolve();
                      });
                      return deferred.promise;
                  },
                  roleValidations: roleValidationConfig,
                  authorize: function (roleMap) {
                      // Validate input
                      Permission._validateRoleMap(roleMap);

                      var authorizing;

                      if (roleMap.only) {
                          authorizing = Permission.resolveIfMatch(roleMap.only);
                      } else {
                          authorizing = Permission.rejectIfMatch(roleMap.except);
                      }

                      return authorizing;
                  }
              };

              return Permission;
          }];
      });

}());
