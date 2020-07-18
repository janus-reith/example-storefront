import fs from "fs";
import { createRequire as createRequireFromPath } from "module";
import stack from "callsite";

/**
 * @summary import the contents of another file as a string
 * @param {Object} specifier A valid import specifier, such as
 *   a relative path or a path within a node_modules package
 * @return {String} The file contents
 */
export default function importAsString(specifier) {
  // Is the file relative
  if (specifier.startsWith("./") || specifier.startsWith("/")) {
    console.log("Using relative import", specifier);
    const a = new Error();
    const errorline = a.stack.split("\n")[2];
    const m = errorline.match(/at (.*)\((.*):([0-9]*):([0-9]*)\)/);
    const func = m[1];
    const callerFileFromError = func.split("Module../")[1];
    const stripped = callerFileFromError.substring(0, callerFileFromError.lastIndexOf("/") + 1);

    const realFile = `${stripped}${specifier}`;

    return fs.readFileSync(realFile, { encoding: "utf8" });
  }

  console.log("Using absolute import", specifier);
  const caller = stack()[1];
  const callerFileName = caller.getFileName();
  const require = createRequireFromPath(callerFileName);

  return fs.readFileSync(require.resolve(specifier), { encoding: "utf8" });
}
