const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbfpgjp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const userCollection = client.db("assignment-12Db").collection('users');
    const postCollection = client.db("assignment-12Db").collection('post');

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      try {
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.send({ token });
      } catch (err) {
        res.status(500).send({ error: 'Failed to generate token' });
      }
    });

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      try {
        const email = req.decoded.email;
        const user = await userCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ message: 'User not found' });
        }
        if (user.role !== 'admin') {
          return res.status(403).send({ message: 'Forbidden access' });
        }
        next();
      } catch (error) {
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
      }
    };

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      try {
        const user = await userCollection.findOne({ email });
        res.send({ admin: user && user.role === 'admin' });
      } catch (err) {
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const existingUser = await userCollection.findOne({ email: user.email });
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.post('/post', async (req, res) => {
      const newPost = req.body;
      const result = await postCollection.insertOne(newPost);
      res.send(result);
    });

    app.put('/allPost/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const newComment = req.body.comment;
      const post = await postCollection.findOne(filter);
      if (post) {
        const updatedComments = post.comments || [];
        updatedComments.push(newComment);
        const result = await postCollection.updateOne(filter, { $set: { comments: updatedComments } });
        res.send(result);
      } else {
        res.status(404).send({ message: 'Post not found' });
      }
    });

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: 'admin' } }
      );
      res.send(result);
    });

    app.get('/allPost', async (req, res) => {
      const cursor = postCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    

    app.get('/allPost/:email', async (req, res) => {
      const email = req.params.email;
      const posts = await postCollection.find({ email }).toArray();
      res.send(posts);
    });

  } finally {
    // Ensure that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Assignment-12 server is running');
});

app.listen(port, () => {
  console.log(`Assignment-12 server is running on port: ${port}`);
});
