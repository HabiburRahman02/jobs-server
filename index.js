const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const port = process.env.PORT || 9000
const app = express()

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster3.ggy8e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster3`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    const jobsCollection = client.db('jobsDB').collection('jobs');
    const bidsCollection = client.db('jobsDB').collection('bids');

    // jobs related apis
    // app.get('/job', async (req, res) => {
    //   const email = req.query.email;
    //   const query = {email}
    //   const result = await jobsCollection.find(query).toArray();
    //   res.send(result)
    // })
    app.get('/jobById/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query);
      res.send(result)
    })

    app.get('/job/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const result = await jobsCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/jobs', async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result)
    })

    app.post('/jobs', async (req, res) => {
      const jobs = req.body
      const result = await jobsCollection.insertOne(jobs);
      res.send(result)
    })

    app.put('/job-update/:id', async (req, res) => {
      const id = req.params.id;
      const job = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updated = {
        $set: job
      }
      const result = await jobsCollection.updateOne(filter, updated, options)
      res.send(result)
    })

    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    })


    //  bids related apis
    app.get('/bids/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const result = await bidsCollection.find(filter).toArray();
      res.send(result);
    })

    app.get('/bid-requests/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { buyerEmail: email };
      const result = await bidsCollection.find(filter).toArray();
      res.send(result);
    })

    app.post('/bids', async (req, res) => {
      const bids = req.body
      const bid_id = bids.bid_id
      // if already bibs this job then return a a status
      const query = { email: bids?.email, bid_id: bids.bid_id }
      const exist = await bidsCollection.find(query).toArray();
      // if(exist){
      //   return res.status(400).send({message:'already bid this job post'})
      // }

      // increase bid_count in jobs collection
      const filter = { _id: new ObjectId(bid_id) }
      const options = { upsert: true }
      // const bidDetails = await jobsCollection.findOne(filter)
      // console.log(bidDetails);
      // let update;
      // if(bidDetails.bid_count){
      //    update = {$inc: { bid_count: 1 }}
      // }
      // else{
      //    update = {$set: { bid_count: 1 }}
      // }
      const update = {
        $inc: {
          bid_count: 1
        }
      }
      const firstResult = await jobsCollection.updateOne(filter, update)

      const result = await bidsCollection.insertOne(bids);
      res.send(result)
    })

    app.patch('/bid-status-update/:id', async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      console.log(status);
      const query = { _id: new ObjectId(id) }
      const update = {
        $set: {
          status: status
        }
      }
      const result = await bidsCollection.updateOne(query, update);
      res.send(result)
    })

    // all jobs filter by categories asc, dsc and more
    app.get('/all-jobs', async (req, res) => {
      const filterByCategory = req.query.filterByCategory;
      const search = req.query.search;
      let query = {}

      if(filterByCategory){
        query.category =  filterByCategory
      }
      if(search){
        query.job_title = {$regex: search, $options: 'i'}
      }

      const result = await jobsCollection.find(query).toArray();
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)
app.get('/', (req, res) => {
  res.send('Hello from SoloSphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
