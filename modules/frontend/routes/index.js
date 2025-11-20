const express = require("express");
const fs = require("fs");
const path = require("path");

function loadRoutes(dirPath, baseRoute = "") {
  const router = express.Router({ mergeParams: true });
  console.log(`📂 Reading directory: ${dirPath}, baseRoute: ${baseRoute}`);

  try {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const dirName = file.toLowerCase();
        const newBaseRoute = path.posix.join(baseRoute, dirName); // <--- FIXED

        const subRouter = loadRoutes(fullPath, newBaseRoute);
        router.use(`/${dirName}`, subRouter); // Mount subdir
        console.log(
          `✅ Mounted sub-router: /${dirName} -> /api/${newBaseRoute}`
        );
      } else if (file !== "index.js" && file.endsWith(".js")) {
        const routeName = path
          .basename(file, ".js")
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase();

        const routePath = `/${routeName}`; // <--- Avoid using baseRoute again here
        console.log(
          `🔍 Processing file: ${fullPath}, routePath: ${baseRoute}${routePath}`
        );

        try {
          const routeModule = require(fullPath);
          if (
            typeof routeModule === "function" ||
            routeModule instanceof express.Router
          ) {
            router.use(routePath, routeModule);
            console.log(`✅ Loaded route: /api/${baseRoute}${routePath}`);
          } else {
            console.error(
              `❌ Invalid route module at ${fullPath}: Not a router or middleware function`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error loading route ${routePath}: ${error.message}`
          );
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}: ${error.message}`);
  }

  return router;
}

module.exports = loadRoutes(__dirname);
