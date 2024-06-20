const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbfpgjp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const userCollection = client.db("assignment-12Db").collection('users');
    const postCollection = client.db("assignment-12Db").collection('post');


    
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      try {
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
              expiresIn: '1h'
          });
          res.send({ token });
      } catch (err) {
          res.status(500).send({ error: 'Failed to generate token' });
      }
  });


  //middlewares

  const verifyToken = (req, res, next) => {
    console.log('inside verify token', req.headers.authorization);

    // Check if authorization header is present
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }

    // Split the Bearer token from the authorization header
    const token = req.headers.authorization.split(' ')[1];

    // Verify the token using the secret key
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
        }

        // Attach the decoded token to the request object
        req.decoded = decoded;
        next();
    });
};

module.exports = verifyToken;

  app.get('/users/admin/:email', verifyToken, async (req, res) => {
    const email = req.params.email;

    // Check if the email in the URL matches the email from the decoded token
    if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
    }

    try {
        // Query the user collection to find the user by email
        const query = { email: email };
        const user = await userCollection.findOne(query);

        // Check if the user has the 'admin' role
        let admin = false;
        if (user && user.role === 'admin') {
            admin = true;
        }

        // Send back the result
        res.send({ admin });
    } catch (err) {
        console.error('Error fetching user from the database', err);
        res.status(500).send({ message: 'Internal server error' });
    }
});


    app.get('/users',verifyToken, async(req, res) =>{
      
      const result = await userCollection.find().toArray();
      res.send(result);

    })

    app.post('/users', async(req,res)=>{
        const user = req.body;
        const query = {email: user.email};
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
          return res.send({message: 'user already exists', insertedId: null})
        }
        const result = await userCollection.insertOne(user);
        res.send(result)
    });
    app.post('/post', async (req, res) => {
      const newPost = req.body;
      const result = await postCollection.insertOne(newPost);
      res.send(result); 
  });

  app.put('/allPost/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const addComment = req.body;
    const Update = {
      $set: {
        comment: addComment.comment,
       
      }
    };
    const result = await postCollection.updateOne(filter, Update);
    res.send(result);
});

app.delete('/users/:id', async (req,res)=>{
  const id = req.params.id;
  const query = { _id: new ObjectId(id)}
  const result = await userCollection.deleteOne(query);
  res.send(result);
});

app.patch('/users/admin/:id', async(req, res)=>{
    const id = req.params.id;
    const filter = { _id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        role: 'admin'
      }
    }
    const result = await userCollection.updateOne(filter, updatedDoc);
    res,send(result);
});

  app.get('/allPost', async(req, res) => {
    const cursor = postCollection.find();
    const result = await cursor.toArray();
    res.send(result);
});

  app.get("/allPost/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const cursor = postCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Assignment-12 server is running');
});

app.listen(port, () => {
    console.log(`Assignment-12 server is running on port: ${port}`);
});