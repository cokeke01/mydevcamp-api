const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err }

    error.message = err.message;

    //log to console for dev
    //console.log(err.stack.red);
    console.log(err);

    // Mongoose bad ObjectId
    if(err.name === 'CastError'){
        const message = `Resource not found`;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if(err.code === 11000){
        const message = 'Duplicate field value entered';
        error =  new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if(err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(val => val.message);
        error =  new ErrorResponse(message, 400);
    }

    //console.log(err.name); //tells us its a CastError

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};

module.exports = errorHandler;

//this is a middleware and will be run through app.use on our server.js