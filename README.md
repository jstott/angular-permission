![alt tag](https://travis-ci.org/Narzerus/angular-permission.svg?branch=master)

Permission
==========
*Role and permission based authentication on routes as simple as it can get.*

- Requires you to use [ui-router](https://github.com/angular-ui/ui-router) as your router module.

Permission is the gatekeeper for your routes
--------------------------------------------
Permission helps you gain control of your routes, by using simple concepts for you to decide who can access them.
I've seen plenty of big fat tutorials on access control implementations, and they can be quite overwhelming. So I bring you a simple, powerful, straightforward solution.

Important
---------
Please remember this project is very new, I wouldn't recommend yet using this in a big project just yet as, like any new project, might drastically change over time.

Install via bower
-----------------
This repos' forked copy
```
bower install git@github.com:jstott/angular-permission.git#^0.1.x --save
```

Original Source
```
bower install angular-permission --save
```


Include to your dependencies
----------------------------
```javascript
angular.module('yourModule', [..., 'permission']);
```

Setting route permissions/roles
-------------------------------
This is how simple Permission makes it for you to define a route which requires authorization.

```javascript

  // We define a route via ui-router's $stateProvider
  $stateProvider
    .state('staffpanel', {
      url: '...',
      data: {
        permissions: {
          only: ['admin', 'moderator']
        }
      }
    });
```

You can either set an `only` or an `except` array.

```javascript
  // Let's prevent anonymous users from looking at a dashboard
  $stateProvider
    .state('dashboard', {
      url: '...',
      data: {
        permissions: {
          except: ['anonymous']
        }
      }
    });
```

Another thing you can do is set a redirect url to which unauthorized sessions will go to.

```javascript
  $stateProvider
    .state('dashboard', {
      url: '...',
      data: {
        permissions: {
          except: ['anonymous'],
          redirectTo: 'login'
        }
      }
    });
```


Defining roles
--------------------------
So, how do yo tell Permission what does 'anonymous', 'admin' or 'foo' mean and how to know if the current user belongs
to those definitions?

Well, Permission allows you to define different 'roles' along with the logic that determines if the current
session belongs to them.

```javascript
  // Let's imagine we have a User service which has information about the current user in the session
  // and is undefined if no session is active
  //
  // We will define the following roles:
  // anonymous: When there is not user currenly logged in
  // normal: A user with isAdmin = false
  // admin: A user with isAdmin = true

  angular.module('fooModule', ['permission', 'user'])
    .run(function (Permission, User), {
      // Define anonymous role
      Permission.defineRole('anonymous', function () {
        // If the returned value is *truthy* then the user has the role, otherwise they don't
        if (!User) {
          return true; // Is anonymous
        }
        return false;
      });
    });
```

Sometimes you will need to call some a back-end api or some other asyncronous task to define the role
For that you can use promises

```javascript
  angular.module('barModule', ['permission', 'user'])
    .run(function (Permission, User, $q) {
      Permission
        // Define user role calling back-end
        .defineRole('user', function () {
          // This time we will return a promise
          // If the promise *resolves* then the user has the role, if it *rejects* (you guessed it)

          // Let's assume this returns a promise that resolves or rejects if session is active
          return User.checkSession();
        })
        // A different example for admin
        .defineRole('admin', function () {
          var deferred = $q.defer();

          User.getAccessLevel().then(function (data) {
            if (data.accessLevel === 'admin') {
              deferred.resolve();
            } else {
              deferred.reject();
            }
          }, function () {
            // Error with request
            deferred.reject();
          });

          return deferred.promise;
        });
    });
```
As you can see, Permission is useful wether you want a role-based access control or a permission-based one, as
it allows you to define this behaviour however you want to.

TODOS:
-----
Help fill this list with your feature requests
- More powerful redirection to allow passing state parameters and other useful stuff ui-router provides. Ideas anyone?
- Inheritance (example: 'admin' inherits from 'user')
- Role validation caching?

Contribute
==========
This project is still in diapers and I would love your feedback / help in making this a great module
for angular developers to use


Author
======
- Rafael Vidaurre
- @narzerus
- I'm a full-stack developer currenly working as CTO and Co-Founder at [Finciero](http://www.finciero.com)
