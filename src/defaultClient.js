module.exports = (config) => {
  var graphqlFetch = require("graphql-fetch")(config.url);
  var swServer;
  var swClient;
  if (config.webSocketEndPoint) {
    swServer = require("subscriptions-transport-ws").SubscriptionClient;
    swClient = new swServer(config.webSocketEndPoint, {
      reconnect: true,
    });
  }
  return (type, query, vars, opts) => {
    if (type === "subscription" && config.webSocketEndPoint) {
      return swClient.request({
        query: str,
        variables: queryVars,
      });
    } else {
      return graphqlFetch(query, vars, opts);
    }
  };
};
