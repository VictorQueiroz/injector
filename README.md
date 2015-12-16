# injector

### Usage
```js
// Not loaded modules
var pending = {
  $q: function() {
    return window.Q;
  },

  $http: function($q) {
    return {
      get: function() {
        var xhr = new XMLHttpRequest();
        var data = {};
        var deferred = $q.defer();

        xhr.onreadystatechange = function() {
          if(xhr.statusCode >= 200 && xhr.statusCode < 400) {
            deferred.resolve(data);
          } else {
            deferred.reject();
          }
        };

        return deferred.promise;
      }
    };
  }
};

// Already loaded modules
var cache = {
  $animate: jQuery.animate
};

var injector = new injector.Injector(pending, cache);

var promise = injector.invoke(function($q, injector){
  var $http = injector.get('$http');
  var deferred = $q.defer();
  
  $http.get('/api/products').then(function(data){
    deferred.resolve();
  }, function(err) {
    deferred.reject(err);
  });
  
  return deferred.promise;
});
```
