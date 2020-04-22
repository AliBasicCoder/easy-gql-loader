module.exports = (config) => {
  var graphqlFetch = require("graphql-fetch")(config.url);
  var swServer = require("subscriptions-transport-ws").SubscriptionClient;
  var swClient = new swServer(config.webSocketEndPoint, {
    reconnect: true,
  });
  return (type, query, vars, opts) => {
    if (type === "subscription") {
      return swClient.request({
        query: str,
        variables: queryVars,
      });
    } else {
      return graphqlFetch(query, vars, opts);
    }
  };
};
