// this webpack is for testing not building

module.exports = {
  entry: "./toTest",
  output: {
    filename: "out.js",
    path: __dirname,
    libraryTarget: "commonjs",
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.(gql|graphql)$/,
        use: {
          loader: "../",
          options: {
            url: "http://localhost:4000",
            // webSocketEndPoint: "ws://localhost:4000/graphql",
            // flat: true,
          },
        },
      },
    ],
  },
};
