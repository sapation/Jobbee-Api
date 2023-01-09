const User = require('../models/user');
const Job = require('../models/jobs');
const catchAsyncError = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwtToken');
const APIFilters = require('../utils/apiFilters');
const fs = require('fs');
const user = require('../models/user');


//Get current user profile => /api/v1/me
exports.getUserProfile = catchAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.user.id)
        .populate({
            path : 'jobPublished',
            select : 'title postingDate'
        });

    res.status(200).json({
        success : true,
        data : user
    })
});

//Update current user password => /api/v1/password/update
exports.updatePassword = catchAsyncError(async(req, res, next) =>{
    const user = await User.findById(req.user.id).select('+password');

    //Check previous user password
    const isMatched = await user.comparePassword(req.body.currentPassword);
    if(!isMatched) {
        return next(new ErrorHandler('Old Password is incorrect.', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendToken(user, 200, res);
});

//Update current user => /api/v1/me/update
exports.updateAccount = catchAsyncError(async(req, res, next) =>{
    const userOld = await User.findById(req.user.id);
    const newUserData = {
        name : req.body.name || userOld.name,
        email : req.body.email || userOld.email
    }

    await User.findByIdAndUpdate(req.user.id, newUserData, {
        new : true,
        runValidators : true,
        useFindAndModify: false
    });

    res.status(200).json({
        success : true,
        message : 'Profile updated successfully'
    })
});

//Show all applied jobs => /api/v1/applied
exports.getAppliedJobs = catchAsyncError(async(req, res, next) =>{
    console.log(req.user);
    const jobs = await Job.find({'applicantsApplied.id' : req.user.id}).select('+applicantsApplied');

    res.status(200).json({
        success : true,
        results : jobs.length,
        data : jobs
    })
});

//Show all jobs published by employeer => /api/v1/publish
exports.getAllPublishedJobs = catchAsyncError(async(req, res, next) => {
    const jobs = await Job.find({user : req.user.id});

    res.status(200).json({
        success : true,
        results : jobs.length,
        data : jobs
    })
});

//Delete current user => /api/v1/me/delete
exports.deleteAccount = catchAsyncError(async(req, res, next)=> {
    deleteUserData(req.user.id, res.user.role);

    await User.findByIdAndDelete(req.user.id)

    res.cookie('token', 'none', {
        expires : new Date(Date.now()),
        httpOnly : true
    });

    res.status(200).json({
        success : true,
        message : 'Your Account has been deleted.'
    })
});

//Adding controllers methods that only admin accessible

//show all user => /api/v1/users
exports.getUsers = catchAsyncError(async(req, res, next) =>{
    const apiFilters = new APIFilters(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();

    const users = await apiFilters.query;

    res.status(200).json({
        success : true,
        results : users.length,
        data : users
    })
});

// Delete User(admin)   => /api/v1/user/:id
exports.deleteUser = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
    }

    deleteUserData(user.id, user.role);
    await user.remove();

    res.status(200).json({
        success : true,
        message : 'User is deleted by Admin.'
    });

});




//Delete User files and Employeer jobs
async function deleteUserData(user, role) {
    if (role === 'employeer') {
        await jobStats.deleteMany({user : user})
    }

    if (role === 'user') {
        const appliedJobs = await Job.find({'applicantsApplied.id' : user}).select('+applicantsApplied');

        for(let i=0; i<appliedJobs.length; i++) {
            let obj = appliedJobs[i].applicantsApplied.find(o => o.id === user);

            let filePath = `${__dirname}/public/uploads/${obj.resume}`.replace('\\controllers', '');

            fs.unlink(filePath, err => {
                if (err) return console.log(err);
            });

            appliedJobs[i].applicantsApplied.splice(appliedJobs[i].applicantsApplied.indexOf(obj.id));

            await appliedJobs[i].save();
        }
    }
}