let esbuild = require("esbuild");

const path = require("path");

const isDev = process && process.env && process.env.NODE_ENV === "development";

const options = {
  entryPoints: ['./static/js/src/demolist.tsx'],
  bundle: true,
  minify: isDev ? false : true,
  nodePaths: [path.resolve(__dirname, "./static/js/src")],
  sourcemap: isDev ? false : true,
  outfile: "static/js/dist/demolist.js",
  target: ["chrome90", "firefox88", "safari14", "edge90"],
  define: {
    "process.env.NODE_ENV":
      // Explicitly check for 'development' so that this defaults to
      // 'production' in all other cases.
      isDev ? '"development"' : '"production"',
  },
};

esbuild
  .build(options)
  .then((result) => {
    console.log("Built js");
  })
  // Fail the build if there are errors.
  .catch((err) => console.error(err)) ;
