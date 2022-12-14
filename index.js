const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

function verifyJWT(req, res, next) {
  const authHeader = req?.headers?.authorization;
  console.log(authHeader);
  if (!authHeader) {
    // return res.status(401).send({ message: "unauthorized access" });
    res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      // return res.status(401).send({ message: "unauthorized access" });
      res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const booksCategories = client
      .db(`used-products-resale`)
      .collection(`books-categories`);
    const books = client.db(`used-products-resale`).collection(`books`);
    const users = client.db(`used-products-resale`).collection(`users`);
    const orderInfo = client.db(`used-products-resale`).collection(`orderInfo`);
    const addProduct = client
      .db(`used-products-resale`)
      .collection(`addProduct`);
    const paymentCollection = client
      .db(`used-products-resale`)
      .collection(`paymentCollection`);

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.post("/create-payment-intent", async (req, res) => {
      const orders = req.body;
      const price = orders.resalePrice;
      const amount = price * 100;
      // console.log(orders);
      // console.log(orders, price);

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/advertise", async (req, res) => {
      const query = { advertise: "true" };
      const cursor = books.find(query);
      const results = await cursor.toArray();
      // console.log(results);
      res.send(results);
    });

    app.get("/advertise/:advertiseId", async (req, res) => {
      // console.log(req.params.advertiseId);
      const query = { _id: ObjectId(req.params.advertiseId) };
      console.log(query);
      const cursor = books.findOne(query);
      const results = await cursor;
      // console.log(results);
      res.send(results);
    });

    app.get("/all-books", async (req, res) => {
      const query = {};
      const cursor = await books.find(query).toArray();
      res.send(cursor);
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

    app.post("/signup", async (req, res) => {
      const query = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        checked: req.body.checked,
        userIdFirebase: req.body.userIdFirebase,
      };
      const result = await users.insertOne(query);
      res.send(result);
    });

    app.post("/buy-now", async (req, res) => {
      const query = req.body;
      const result = await orderInfo.insertOne(query);
      res.send(result);
    });

    app.put("/buy-now/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const update = {
        $set: {
          available: "sold",
          advertise: "false",
        },
      };
      const result = await books.updateOne(query, update);
      res.send(result);
      // console.log(result);
    });

    app.get("/user-type-find", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = await users.findOne(query);
      res.send(cursor);
      // console.log(cursor);
    });

    app.post("/add-product", async (req, res) => {
      const query = req.body;
      // const result = await addProduct.insertOne(query);
      const result = await books.insertOne(query);
      res.send(result);
    });

    app.get("/my-books", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = await books.find(query).toArray();
      res.send(cursor);
    });

    app.put("/my-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const update = {
        $set: {
          advertise: "true",
        },
      };
      const result = await books.updateOne(query, update);
      res.send(result);
    });

    app.delete("/my-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await books.deleteOne(query);
      res.send(result);
    });

    app.get("/my-orders", async (req, res) => {
      // const decoded = req.decoded;
      // console.log("inside decoded", decoded);
      // if (decoded.email !== req.query.email) {
      //   res.status(401).send({ message: "unauthorized access" });
      // }
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      // const email = req.query.email;
      // const query = { email: email };
      const cursor = await orderInfo.find(query).toArray();
      res.send(cursor);
    });

    app.get("/my-orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await orderInfo.findOne(query);
      res.send(cursor);
    });

    app.get("/my-buyers", async (req, res) => {
      const email = req.query.email;
      const query = { sellerEmail: email };
      const cursor = await orderInfo.find(query).toArray();
      res.send(cursor);
    });

    app.get("/my-buyers/delete/:buyerId", async (req, res) => {
      const buyerId = req.params.buyerId;
      const query = { _id: ObjectId(buyerId) };
      const result = await orderInfo.deleteOne(query);
      res.send(result);
    });

    app.get(`/allusers/user-type/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // console.log(query);
      const user = await users.find(query).toArray();
      // console.log(user[0]?.checked);
      res.send(user[0]?.checked);
      // // console.log(user[0]?.role);
      // res.send({ isAdmin: user[0]?.role === `admin` });
    });

    app.get("/allusers/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const userType = await users.findOne(query);
      // console.log(userType);
      // console.log(userType?.checked);
      res.send({ isAdmin: userType?.checked === `admin` });
    });

    app.get("/allusers/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const userType = await users.findOne(query);
      // console.log(userType);
      // console.log(userType?.checked);
      res.send({ isSeller: userType?.checked === `seller` });
    });

    app.get("/allusers/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const userType = await users.findOne(query);
      // console.log(userType);
      // console.log(userType?.checked);
      res.send({ isBuyer: userType?.checked === `buyer` });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send(result);
    });

    app.put("/makeorderpaid/:orderinfoid", async (req, res) => {
      const orderInfoId = req.params.orderinfoid;
      console.log();
      console.log(orderInfoId);
      if (req.body.isPaid) {
        const query = { _id: ObjectId(orderInfoId) };
        const update = {
          $set: {
            paymentStatus: "paid",
          },
        };
        const result = await orderInfo.updateOne(query, update);
        res.send(result);
      }
    });

    app.get("/all-sellers", async (req, res) => {
      const query = { checked: "seller" };
      const result = await users.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    app.delete("/all-sellers/delete/:sellerId", async (req, res) => {
      const sellerId = req.params.sellerId;
      const query = { _id: ObjectId(sellerId) };
      // console.log(query);
      const result = await users.deleteOne(query);
      // console.log(result);
      res.send(result);
    });

    app.get("/all-buyers", async (req, res) => {
      const query = { checked: "buyer" };
      const result = await users.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    app.delete("/all-buyers/delete/:buyerId", async (req, res) => {
      const buyerId = req.params.buyerId;
      const query = { _id: ObjectId(buyerId) };
      // console.log(query);
      const result = await users.deleteOne(query);
      // console.log(result);
      res.send(result);
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
