var util = require("util");
var _ = require("underscore");

function _findRoute(path, stack) {
  var count = 0;
  var routes = [];
  stack.forEach(function (layer) {
    if (!layer) return;
    if (layer && !layer.match(path)) return;
    if (["query", "expressInit"].indexOf(layer.name) != -1) return;
    if (layer.name == "router") {
      routes = routes.concat(
        _findRoute(trimPrefix(path, layer.path), layer.handle.stack)
      );
    } else {
      //This is set to 'bound dispatch' because that's currently what express calls an anonymous route.
      //If this changes (as it has, which is why I had to republish this package, this will need to be updated.)
      if (layer.name == "bound dispatch") {
        routes.push({ route: layer || null, stack: stack });
      }
    }
  });
  return routes;
}

function findRoute(app, path) {
  var stack;
  stack = app._router.stack;
  return _findRoute(path, stack);
}

function trimPrefix(path, prefix) {
  // This assumes prefix is already at the start of path.
  return path.substr(prefix.length);
}

module.exports = function removeRoute(
  app,
  path,
  method,
  ignoreWildcard = true
) {
  var found, route, stack, idx;

  found = findRoute(app, path);

  found.forEach(function (layer) {
    route = layer.route;
    stack = layer.stack;

    if (route && (!ignoreWildcard || route.route.path !== "/*")) {
      if (_.isEmpty(method)) {
        // if no method delete all resource with the given path
        idx = stack.indexOf(route);
        stack.splice(idx, 1);
      } else if (
        JSON.stringify(route.route.methods)
          .toUpperCase()
          .indexOf(method.toUpperCase()) >= 0
      ) {
        // if method defined delete only the resource with the given ath and method
        idx = stack.indexOf(route);
        stack.splice(idx, 1);
      }
    }
  });

  return true;
};

module.exports.findRoute = findRoute;
