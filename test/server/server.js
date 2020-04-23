const lodash = require("lodash");
const { gql, ApolloServer, PubSub } = require("apollo-server");
const { books, author } = require("./data");

const log = process.argv[2] === "--run" ? console.log : () => {};

const BOOK_ADDED = "BOOK_ADDED";

const pubSub = new PubSub();

let typeDefs = `
  type Book {
    name: String!
    writtenAt: String!
    id: ID!
    author: Author!
    author2: Author!
  }

  type Author {
    name: String!
    born: String!
  }

  input BookInputPartial {
    name: String
    writtenAt: String
  }

  input BookInput {
    name: String!
    writtenAt: String!
  }

  type Query {
    book(id: ID): Book
  }

  type Mutation {
    book(id: ID, newBook: BookInputPartial): Book
    addBook(newBook: BookInput): Book
  }

  type Subscription {
    bookAdded: Book
  }
`;

const resolvers = {
  Subscription: {
    bookAdded: {
      subscribe: () => pubSub.asyncIterator([BOOK_ADDED]),
    },
  },
  Query: {
    book(_1, { id }) {
      log("book_q", id);
      return lodash.find(books, { id });
    },
  },
  Mutation: {
    book(_1, { id, newBook }) {
      log("book_m", { id, newBook });
      const index = lodash.findIndex(books, { id });
      books[index] = lodash.defaults(newBook, books[index]);
      return books[index];
    },
    addBook(_1, { newBook }) {
      log("addBook_m", newBook);
      const obj = {
        ...newBook,
        author,
        author2: author,
        id: `${newBook.name}_1290`,
      };
      pubSub.publish(BOOK_ADDED, { bookAdded: obj });
      books.push(obj);
      return obj;
    },
  },
};

if (process.argv[2] === "--run") {
  const apolloServer = new ApolloServer({ typeDefs, resolvers, cors: true });
  typeDefs = gql(typeDefs);
  apolloServer.listen(4000);
  console.log("server ran at http://localhost:4000/");
}

module.exports = { typeDefs, resolvers };
