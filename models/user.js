const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email address'],
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email']
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'employeer'],
            message: 'Please select correct role'
        },
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please enter password for your account'],
        minlength: [8, 'Your password must be at least 8 characters long'],
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date ,

},
{
    toJSON : {virtuals : true},
    toObject : {virtuals : true},
});

//Encrpting password before saving 
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) next();
    this.password = await bcrypt.hash(this.password, 10);
});

//Return  Json Web Token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({id : this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    })
}

//comapre user password with database password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

//Generate password token
userSchema.methods.getResetPasswordToken = function() {
    //Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');

    //Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

    //Set Token expire time
    this.resetPasswordExpire = Date.now() + 30*60*1000;

    return resetToken;
}

//Show all job created by user using virtuals
userSchema.virtual('jobPublished', {
    ref : 'Job',
    localField : '_id',
    foreignField : 'user',
    justOne : false
});

module.exports = mongoose.model('User', userSchema);