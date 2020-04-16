import * as assert from "assert";
import { execSync } from "child_process";

describe("main", () => {
  it("builds successfully", (done) => {
    try {
      execSync("cd test && ../node_modules/.bin/webpack-cli -p");
      done();
    } catch (error) {
      done(error);
    }
  });

  it("works", async () => {
    const books = require("./server/books");
    const obj = require("./out");
    // have right data
    assert.notEqual(typeof obj.data, "undefined");
    assert.notEqual(typeof obj.data.queries, "undefined");
    assert.notEqual(typeof obj.data.mutations, "undefined");
    assert.notEqual(typeof obj.data.subscriptions, "undefined");
    // actually works
    assert.deepEqual(
      (await obj.data.queries.book({ id: "book1_1000" })).data.book,
      books[0]
    );
    assert.deepEqual(
      (
        await obj.data.mutations.book({
          id: "book1_1000",
          newBook: {
            name: "hello",
          },
        })
      ).data.book,
      {
        ...books[0],
        name: "hello",
      }
    );
    assert.deepEqual(
      (
        await obj.data.mutations.addBook({
          newBook: {
            name: "hello_world",
            writtenAt: "1290",
          },
        })
      ).data.addBook,
      {
        name: "hello_world",
        writtenAt: "1290",
        id: "hello_world_1290",
      }
    );
  });
});
