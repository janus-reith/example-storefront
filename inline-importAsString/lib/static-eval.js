var t = require("@babel/types");
var nodeResolve = require("resolve");
var browserResolve = require("browser-resolve");

function resolveSync(target, id, opts) {
  return (target === "browser" ? browserResolve : nodeResolve).sync(id, {
    basedir: opts.basedir,
    paths: opts.paths
  });
}

module.exports = evaluate;
function evaluate(opts, path, vars, modules, needsEval) {
  opts = opts || {};

  // save replaced path and nodes for store nodes
  const replacedList = [];
  const replaceWith = (path, node) => {
    replacedList.push({
      path: path,
      oldNode: path.node,
      newNode: node
    });
    path.replaceWith(node);
  };
  try {
    // Replace identifiers with known values
    path.traverse({
      Identifier: function(ident) {
        var key = ident.node.name;
        if (key in vars) {
          replaceWith(ident, t.valueToNode(vars[key]));
        }
      }
    });

    var argValues, computedNode;

    if (t.isCallExpression(path.node)) {
      // Evaluate recursively if it's a function call
      // First evaluate all our arguments recursively
      argValues = path.get("arguments").map(function(arg) {
        return evaluate(opts, arg, vars, modules, true);
      });

      var id = argValues[0];
      var resolveOpts = argValues[1] || {};
      var target = opts.target || "node";

      var str = resolveSync(target, id, {
        basedir: vars.__dirname,
        paths: resolveOpts.paths
      });

      computedNode = modules.fs.readFileSync.call(modules.fs, str);

      replaceWith(path, computedNode);
    } else {
      var target = opts.target || "node";
      var id = path.node.value;

      var str = resolveSync(target, id, {
        basedir: vars.__dirname,
        paths: {}
      });

      // computedNode = modules.fs.readFileSync.call(modules.fs, `${vars.__dirname}/${path.node.value}`);
      computedNode = t.valueToNode(str);
      replaceWith(path, computedNode);
    }

    // Evaluate the new AST
    if (needsEval) {
      var result = path.evaluate();
      if (!result.confident) {
        throw new Error(
          "Not able to statically evaluate the expression(s) for babel-plugin-static-fs.\n" +
            "Try changing your source code to something that can be evaluated at build-time, e.g.\n" +
            "    const src = fs.readFileSync(__dirname + '/foo.txt', 'utf8');\n"
        );
      }
      return result.value;
    }
  } catch (error) {
    // restore to original nodes if evaluating error is happened
    replacedList.reverse().forEach(({ path, oldNode }) => {
      path.replaceWith(oldNode);
    });
    throw error;
  }
}
