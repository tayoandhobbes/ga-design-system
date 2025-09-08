// style-dictionary.config.cjs
module.exports = {
  // Point to your Figma-exported JSON file
  source: ["tokens/**/*.json"],

  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "build/css/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          options: {
            selector: ":root",
            outputReferences: true,
          },
        },
      ],
    },
  },
};
