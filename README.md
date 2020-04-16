# easy-gql-loader

the best graphql loader

## Usage

in webpack.config.js add:

```js
module.exports = {
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.(gql|graphql)$/,
        use: {
          loader: "easy-gql-loader",
        },
        options: { ...yourOptions }, // options are documented bellow
      },
      // ...
    ],
  },
};
```

now you could import graphql files

```js
import * as hello_world from "hello_world.gql";

console.log(hello_world);
// {
//   queries: { ...your_queries },
//   mutations: { ...your_mutations },
//   subscriptions: { ...your_subscriptions }
// }

// to call a query
hello_world.queries.myQuery({ ...myArgs }).then(console.log);
// and the same in mutations
hello_world.mutations.myMutation({ ...myArgs }).then(console.log);

// with subscriptions

const subscriber = hello_world.subscriptions
  .mySubscription({ ...myArgs })
  .subscribe((data) => {
    console.log("got some data", data);
  });

// after 1500ms unsubscribe
setTimeout(() => {
  subscriber.unsubscribe();
  console.log("unsubscribing...");
}, 1500);
```

## options

you declare this options in the webpack.config.js

```js
module: {
  rules: [
    // ...
    {
      test: /\.(gql|graphql)$/,
      use: {
        loader: "easy-gql-loader"
      },
      options: { ...yourOptions }
    },
    // ...
  ],
},
```

### url

type: string

the url for graphql mutation and queries

### webSocketEndPoint

type: string

the url for graphql subscriptions

### flat

type: boolean

flats the exported object

with flat set to true:

```js
import * as hello_world from "hello_world.gql";

console.log(hello_world);
// {
//   ...your_queries,
//   ...your_mutations,
//   ...your_subscriptions
// }
```

## Licence

copyright (c) AliBasicCoder 2020
