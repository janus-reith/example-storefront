var pathModule = require("path");
var staticEval = require("./lib/static-eval");
var staticFsModule = require("./lib/fs");
var staticPathModule = require("./lib/path");
var noop = function() {};

module.exports = function({ types }) {
  var staticModuleName = "@reactioncommerce/api-utils/importAsString.js";

  // Handles new dependencies being added
  // to our tool chain. This is a limitation
  // of Babel + bundler integrations.
  // See here:
  // https://github.com/babel/babelify/issues/173
  var depManager = {
    onFile: noop
  };

  var modules = {
    path: staticPathModule,
    fs: staticFsModule(depManager)
  };

  // Finds require/import statements

  return {
    name: "inline-importAsString",
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.source.value === staticModuleName) {
          var vars = path.node.specifiers.map(function(spec) {
            return spec.local.name;
          });

          // now traverse and replace all instances within the scope
          var func = path.getFunctionParent();
          if (!func) {
            func = path.findParent((p) => p.isProgram());
          }

          var errors = traverse(func, vars, state);

          // finally, remove the 'fs' import statements
          if (errors.length === 0) path.remove();
        }
      }
    }
  };

  function traverse(func, vars, state) {
    const errors = [];
    func.traverse(fsApiVisitor(vars, state, errors));
    return errors;
  }

  function evaluate(opts, path, file) {
    var vars = {
      __filename: file,
      __dirname: pathModule.dirname(file)
    };
    return staticEval(opts, path, vars, modules);
  }

  function fsApiVisitor(vars, state, errors) {
    return {
      CallExpression: function(path) {
        var callee = path.node.callee;
        if (
          (types.isMemberExpression(callee) && vars.indexOf(callee.object.name) >= 0) ||
          (types.isIdentifier(callee) && vars.indexOf(callee.name) >= 0)
        ) {
          // Ensure new dependencies are emitted back to the bundler.
          if (state.opts && typeof state.opts.onFile === "function") {
            depManager.onFile = state.opts.onFile;
          }

          try {
            evaluate(state.opts, path, state.file.opts.filename);
          } catch (err) {
            if (state.opts.dynamic !== false) {
              errors.push(err);
            } else {
              throw err;
            }
          }
        }
      }
    };
  }
};
