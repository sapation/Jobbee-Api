const express = require('express');
const dotenv = require("dotenv");

const app  = express();

//Setting up configurations files
dotenv.config({path: './config/config.env'});


const port = process.env.PORT
app.listen(port, ()=>{
    console.log(`Server started on ${port}`)
})