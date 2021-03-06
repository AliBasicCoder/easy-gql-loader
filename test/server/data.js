const author = {
  name: "some",
  born: "March 1990",
};

const books = [
  {
    name: "book1",
    writtenAt: "1586629931516",
    id: "book1_1000",
    author: { ...author },
    author2: { ...author },
  },
  {
    name: "book2",
    writtenAt: "1586629931516",
    id: "book2_1534",
    author: { ...author },
    author2: { ...author },
  },
  {
    name: "book3",
    writtenAt: "1586629931516",
    id: "book3_1290",
    author: { ...author },
    author2: { ...author },
  },
];

module.exports = { books, author };
