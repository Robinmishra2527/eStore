require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');

// App configuration.
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles: true
}));

// routes of the files.

app.use('/user', require('./routes/userRoutes'))
app.use('/api', require('./routes/categoryRoutes'))
app.use('/api', require('./routes/upload'))
app.use('/api', require('./routes/productRoutes'))
app.use('/api', require('./routes/paymentRoutes'))

//connect to mongodb cluster.
const URI = process.env.MONGODB_URL
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => {
    if(err) throw err;
    console.log('Connected to MongoDb cluster.!')
})

// connection for the mongodb compass
// mongoose.connect('mongodb://localhost/mern-eShop', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
//     .then(() => console.log('Connected to MongoDb compass.!'))
//     .catch((err)=>console.log(err));

app.get('/', (req, res) => {
    res.json({msg: 'welcome to eStore Home Page.'})
})

// listner.

const port = process.env.PORT || 8000
app.listen(port, () => {
    console.log(`Running on Port: ${port}`)
})





