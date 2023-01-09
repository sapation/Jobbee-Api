const express = require('express');
const app  = express();

const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors')


const connectDatabase = require('./config/database');
const errorMiddleware = require('./middleware/errors');
const ErrorHandler = require('./utils/errorHandler');

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

//setup security header with helmet
app.use(helmet());

// setup Body psrser
app.use(express.json());

app.use(express.static('public'));

//Setup cookie paerser
app.use(cookieParser());

//Handle File upload
app.use(fileUpload());

//Sanitze data
app.use(mongoSanitize());

//prevent XSS attack
app.use(xssClean());

//Prevent Parameter Pollutions
app.use(hpp({
    whitelist: ['positions']
}));

//setup cors - Accessible by other domain
app.use(cors());

//Rate Limiting
const limiter = rateLimit({
    windowMs: 10*60*1000,  //10 Mint
    max: 100
});

app.use(limiter);

// Importing all routes
const jobs = require('./routes/jobs');
const auth = require('./routes/auth');
const user = require('./routes/user');


// Jobs Route
app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user);

// Handling unhandle route
app.all('*', (req, res, next)=>{
    next(new ErrorHandler(`${req.originalUrl} route not found`,404));
});

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


