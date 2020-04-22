const gqlTester = require("easygraphql-tester");
const { typeDefs, resolvers } = require("./server");

const tester = new gqlTester(typeDefs, resolvers);

module.exports = (config) => {
  return (type, query, vars, opts) => {
    if (type === "subscription") return;
    return tester.graphql(query, undefined, undefined, vars);
  };
};
