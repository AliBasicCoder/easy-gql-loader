import lodash from "lodash";
import { gql, ApolloServer, PubSub } from "apollo-server";

const BOOK_ADDED = "BOOK_ADDED";

const pubSub = new PubSub();

const typeDefs = gql`
  type Book {
    name: String!
    writtenAt: String!
    id: ID!
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

type ID = string | number;

type Book = {
  name: string;
  writtenAt: string;
  id: ID;
};

export const resolvers = {
  Subscription: {
    bookAdded: {
      subscribe: () => pubSub.asyncIterator([BOOK_ADDED]),
    },
  },
  Query: {
    book(_: any, { id }: { id: string }) {
      console.log("book_q", id);
      return lodash.find(books, { id });
    },
  },
  Mutation: {
    book(_: any, { id, newBook }: { id: string; newBook: Partial<Book> }) {
      console.log("book_m", { id, newBook });
      const index = lodash.findIndex(books, { id });
      books[index] = lodash.defaults(newBook, books[index]);
      return books[index];
    },
    addBook(
      _: any,
      { newBook }: { newBook: { name: string; writtenAt: string } }
    ) {
      console.log("addBook_m", newBook);
      const obj: Book = {
        ...newBook,
        id: `${newBook.name}_${Math.random().toString().slice(2)}`,
      };
      pubSub.publish(BOOK_ADDED, { bookAdded: obj });
      books.push(obj);
      return obj;
    },
  },
};

const books: Book[] = [
  {
    name: "book1",
    writtenAt: "1586629931516",
    id: "book1_1000",
  },
  {
    name: "book2",
    writtenAt: "1586629931516",
    id: "book2_1534",
  },
  {
    name: "book3",
    writtenAt: "1586629931516",
    id: "book3_1290",
  },
];

const apolloServer = new ApolloServer({ typeDefs, resolvers, cors: true });

if (process.argv[2] === "--run") {
  apolloServer.listen(4000);
  console.log("server ran at http://localhost:4000/");
}
