const express = require('express')
const cors = require('cors')
const nodemailer = require("nodemailer");

const app = express()
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');




require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
const SslCommerzPayment = require('sslcommerz');



// middlware
app.use(cors({
  origin:"*",
  methods:["GET,POST,PUT,DELETE"]
}))
app.use(express.json())
app.use(express.urlencoded({ extended: false }));


const port = process.env.PORT||5000



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cjwnnop.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const offerCollection= client.db('tours').collection("offerInfo")
const bookingsCollection = client.db('tours').collection("bookings")
const paymentCollecetion =client.db('tours').collection("payment")
const usersCollecetion =client.db('tours').collection("users")



async function run() {
    try {
      
      app.post('/init',async (req, res) => {
        
        console.log('hitting')
        const productInfo = {
            total_amount:req.body.total_amount,
            currency: 'BDT',
            tran_id: uuidv4(),
            success_url: 'https://tourisum-server.vercel.app/success',
            fail_url: 'https://tourisum-server.vercel.app/failure',
            cancel_url: 'https://tourisum-server.vercel.app/cancel',
            ipn_url: 'https://tourisum-server.vercel.app/ipn',
            shipping_method: 'Courier',
            product_name: req.body. product_name,
            product_category: 'Electronic',
            product_profile: 'general',
            cus_name: req.body. cus_name,
            cus_email: req.body. cus_email,
            cus_add1: 'Dhaka',
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: req.body.cus_phone,
            cus_fax: '01711111111',
            ship_name: 'Customer Name',
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
            multi_card_name: 'mastercard',
            value_a: 'ref001_A',
            value_b: 'ref002_B',
            value_c: 'ref003_C',
            value_d: 'ref004_D'
        };
        const result =  await paymentCollecetion.insertOne(productInfo);
        const sslcommer = new SslCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD,false) //true for live default false for sandbox
        sslcommer.init(productInfo).then(data => {
          const info = { ...productInfo, ...data } 
          if (info.GatewayPageURL) {
            res.json(info.GatewayPageURL)
            res.send(result)
        }
         else {
                return res.status(400).json({
                    message: "SSL session was not successful"
                })
              }
        });
    })
    
//     app.post("/success", async (req, res) => {

//       const result = await paymentCollecetion.updateOne({ tran_id: req.body.tran_id }, {
//           $set: {
//               val_id: req.body.val_id
//           }
//       })

//       res.redirect(`https://tourism-server-assi-11.vercel.app/success/${req.body.tran_id}`)

//   })
//   app.post("/failure", async (req, res) => {
//     const result = await paymentCollecetion.deleteOne({ tran_id: req.body.tran_id })

//     res.redirect(`http://localhost:3000`)
// })
// app.post("/cancel", async (req, res) => {
//   const result = await paymentCollecetion.deleteOne({ tran_id: req.body.tran_id })

//   res.redirect(`http://localhost:3000`)
// })
// app.post("/ipn", (req, res) => {
//   console.log(req.body)
//   res.send(req.body);
// })
// app.post('/validate', async (req, res) => {
//   const result = await paymentCollecetion.findOne({
//       tran_id: req.body.tran_id
//   })

//   if (result.val_id === req.body.val_id) {
//       const update = await paymentCollecetion.updateOne({ tran_id: req.body.tran_id }, {
//           $set: {
//               paymentStatus: 'paymentComplete'
//           }
//       })
//       console.log(update);
//       res.send(update.modifiedCount > 0)

//   }
//   else {
//       res.send("Chor detected")
//   }

// })

      app.get('/offers',async(req,res)=>{
        const query = {}
        const cursor = offerCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
      })
      
     
    //   single info details
    app.get('/offers/:id', async(req,res)=>{
        const id=req.params.id
        const query = {_id: ObjectId(id)}
        const curser = await offerCollection.findOne(query)
        res.send(curser);
    })
    
  
    // booking post
    app.post('/bookings',async(req,res)=>{
      const bookings = req.body;
      const result = await bookingsCollection.insertOne(bookings)
      sendEmail(bookings)
      res.send(result)
    })
    // get bookings
    app.get('/bookings',async(req,res)=>{
        const email = req.query.email;
        if(email){
          const query = {email:email}
          const curser =  bookingsCollection.find(query)
          const result=await curser.toArray()
          res.send(result)
        }
       else{
        
        const queries ={}
        const cursing = bookingsCollection.find(queries)
        const data = await cursing.toArray()
        res.send(data)
       }
       app.get('/bookings/:id', async(req,res)=>{
        
        const id = req.params.id.trim()
        
        const query = { _id: ObjectId(id)}
       const result = await bookingsCollection.findOne(query)
        res.send(result)
        
       
        
          
       })
      //  delete operation bookings
      app.delete('/bookings/:id',async(req,res)=>{
        const id = req.params.id;
        const query ={_id: ObjectId(id)}
        const result= await bookingsCollection.deleteOne(query)
        res.send(result)

      })
        
        
    })
    app.post('/offers',async(req,res)=>{
      const offerings= req.body;
      const result= await offerCollection.insertOne(offerings)
      res.send(result)
    })

    // ssl commerez
    //sslcommerz init
    app.post('/users',async(req,res)=>{
      const user = req.body;
      console.log(user)
      const filter = await usersCollecetion.insertOne(user)
      res.send(filter)
    })

 
          


    } finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Welcome to Tours')
})

app.listen(port, () => {
  console.log(`Working done Tours ${port}`)
})