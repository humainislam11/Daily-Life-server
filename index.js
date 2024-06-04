const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

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


    app.post('/users', async(req,res)=>{
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result)
    })
    app.post('/post', async (req, res) => {
      const newPost = req.body;
      const result = await postCollection.insertOne(newPost);
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