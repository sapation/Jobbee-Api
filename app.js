const express = require('express');
const dotenv = require("dotenv");

const app  = express();

const connectDatabase = require('./config/database');
const errorMiddleware = require('./middleware/errors');

//Setting up configurations files
dotenv.config({path: "./config/config.env"});

// Handling uncautghtException
process.on('uncaughtException', err =>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to uncaughtException');
    process.exit(1);
})

// conecting to database
connectDatabase();

// setup Body psrser
app.use(express.json());

// Importing all routes
const jobs = require('./routes/jobs');
const ErrorHandler = require('./utils/errorHandler');

// Jobs Route
app.use("/api/v1", jobs);

// Handling unhandle route
app.all('*', (req, res, next)=>{
    next(new ErrorHandler(`${req.originalUrl} route not found`,404));
})
// Middleware 
app.use(errorMiddleware);

// port
const port = process.env.PORT || 3000;

const server = app.listen(port, ()=>{
    console.log(`Server started on ${port} in ${process.env.NODE_ENV} mode`)
});

// Handle unhandle promises rejection
process.on('unhandledRejection', err =>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to handle promise rejection');
    server.close(()=>{
        process.exit(1);
    })
})


