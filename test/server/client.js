const gqlTester = require("easygraphql-tester");
const { typeDefs, resolvers } = require("./server");

const tester = new gqlTester(typeDefs, resolvers);

module.exports = (url) => {
  return (query, vars, opts) => {
    return tester.graphql(query, undefined, undefined, vars);
  };
};
