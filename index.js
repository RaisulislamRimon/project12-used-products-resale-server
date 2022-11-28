const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hbpron4.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const booksCategories = client
      .db(`used-products-resale`)
      .collection(`books-categories`);
    const books = client.db(`used-products-resale`).collection(`books`);

    app.get("/advertise", async (req, res) => {
      const query = { advertise: "true" };
      const cursor = books.find(query);
      const results = await cursor.toArray();
      console.log(results);
      res.send(results);
    });

    app.get("/advertise/:advertiseId", async (req, res) => {
      // console.log(req.params.advertiseId);
      const query = { _id: ObjectId(req.params.advertiseId) };
      console.log(query);
      const cursor = books.findOne(query);
      const results = await cursor;
      console.log(results);
      res.send(results);
    });

    app.get("/books-categories", async (req, res) => {
      const query = {};
      const cursor = await booksCategories.find(query).toArray();
      res.send(cursor);
    });

    app.get("/books/:category_name", async (req, res) => {
      const category_name = req.params.category_name;
      const query = { category_name: category_name };
      const cursor = await books.find(query).toArray();
      res.send(cursor);
    });
  } catch {}
}

run().catch((error) => {
  console.log(error);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
