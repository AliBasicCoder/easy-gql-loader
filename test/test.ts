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
    const log = (obj: any) => obj.errors && console.log(obj);

    const { books, author } = require("./server/data");
    const obj = require("./out");
    // have right data
    assert.notEqual(typeof obj.data, "undefined");
    assert.notEqual(typeof obj.data.queries, "undefined");
    assert.notEqual(typeof obj.data.mutations, "undefined");
    assert.notEqual(typeof obj.data.subscriptions, "undefined");
    // actually works
    let op: any = await obj.data.queries.book({ id: "book1_1000" });

    log(op);

    assert.deepEqual(op.data.book, books[0]);

    op = await obj.data.mutations.book({
      id: "book1_1000",
      newBook: {
        name: "hello",
      },
    });

    log(op);

    assert.deepEqual(op.data.book, {
      ...books[0],
      name: "hello",
    });

    op = await obj.data.mutations.addBook({
      newBook: {
        name: "hello_world",
        writtenAt: "1290",
      },
    });

    log(op);

    assert.deepEqual(op.data.addBook, {
      name: "hello_world",
      writtenAt: "1290",
      id: "hello_world_1290",
      author,
    });
  });
});
