const Job = require('../models/jobs');
const geoCoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncError = require('../middleware/catchAsyncErrors')
const APIFilters = require('../utils/apiFilters')
const path = require('path');
const fs = require('fs');

// Get All jobs => "//api/v1/jobs"
exports.getJobs = async(req, res, next)=>{

    const apiFilters = new APIFilters(Job.find(), req.query)
                        .filter()
                        .sort()
                        .limitFields()
                        .searchByQuery()
                        .pagination();

    const jobs = await apiFilters.query;
    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs
    });
}

// cresteing a new job => /api/v1/jobs
exports.newJob = catchAsyncError(async(req, res, next)=>{
    //Adding job creator to the job
    req.body.user = req.user.id;

    const job = await Job.create(req.body);

    res.status(200).json({
        success: true,
        message: 'Job Created.',
        data: job
    });
});

// update jobs  => /api/v1/job/:id
exports.updateJob = catchAsyncError(async (req, res, next)=>{
   
    let job = await Job.findById(req.params.id).exec();
    
    if(!job){
       return next(new ErrorHandler('Job not found.', 404));
    }

    //check if the user is owner
    if (job.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorHandler(`User ${req.user.id} do not have the right to update this job`, 501))
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators : true,
        useFindAndModify : false
    }),

    res.status(200).json({
        success : true,
        message : 'Job Updated.',
        data : job
    })
})

// Delete a job => /api/v1/job:id/delete
exports.deleteJob = catchAsyncError(async (req, res , next)=>{
    let job = await Job.findById(req.params.id).select('+applicantsApplied');

    if(!job){
        return next(new ErrorHandler('Job not found.', 404));
    }

    //check if the user is owner
    if (job.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorHandler(`User ${req.user.id} do not have the right to delete this job`,501))
    }

    //Deleting files associated with job
    for(let i = 0; i< job.applicantsApplied.length; i++){
        let filePath = `${__dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace('\\controllers', '');

        fs.unlink(filePath, err => {
            if (err) return console.log(err);
        });
    }

    job = await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success : true,
        message : 'Job Deleted.',
    })
})

// Get a single job with id and slug = /api/v1/job/:id/:slug
exports.getJob = catchAsyncError(async(req, res, next)=>{
    const job = await Job.find({$and: [{_id : req.params.id}, {slug: req.params.slug}]})
            .populate({
                path : 'user',
                select : 'name'
            });

    if(!job || job.length === 0){
        return next(new ErrorHandler('Job not found.', 404));
    }

    res.status(200).json({
        success : true,
        data: job
    });
})

// Search jobs within the radius => /api/v1/:zipcode/:distance
exports.getJobsInRadius = catchAsyncError(async (req, res, next)=>{
    const { zipcode, distance } = req.params;

    const loc = await geoCoder.geocode(zipcode);
    const latitude = loc[0].latitude;
    const longitude = loc[0].longitude;

    const radius = distance / 3963;
    const jobs = await Job.find({
        location:{ $geoWithin: {$centerSphere: [[longitude, latitude], radius]}}
    });

    res.status(200).json({
        success : true,
        result : jobs.length,
        data : jobs
    })
})

// Get stats about a topic  => /api/v1/stats/:topic
exports.jobStats = catchAsyncError(async (req, res, next)=>{
        const stats  = await Job.aggregate([
            {
                $match : {$text :{$search :"\"" + req.params.topic +"\""}}
            },
            {
                $group :{
                    _id : {$toUpper: '$experience'},
                    totalJobs : {$sum : 1},
                    avgPosition : {$avg : '$positions'},
                    avgSalary : {$avg : '$salary'},
                    minSalary : {$min : '$salary'},
                    maxSalary : {$max : '$salary'}
                }
            }
        ]);

        if(stats.length === 0){
            return next(new ErrorHandler(`No Stats found for - ${req.params.topic}`, 200));
        }

        res.status(200).json({
            success : true,
            data : stats
        })
});

//Apply to job using resume => /api/v1/job/:id/apply
exports.applyJob = catchAsyncError(async(req, res, next)=> {
    let job = await Job.findById(req.params.id).select('+applicantsApplied');

    if(!job) {
        return next(new ErrorHandler('Job not found', 404));
    }

    //check that if the job last date has been passed or not
    if(job.lastDate < new Date(Date.now())) {
         return next( new ErrorHandler('You can not apply to this job. Date is over',400))
    }

    //check if user has applied already
    for (let i=0; i< job.applicantsApplied.length; i++) {
        if(job.applicantsApplied[i].id === req.user.id) {
            return next(new ErrorHandler('You have alreday applied to this job',400))
        }
    }

    //Check the file 
    if(!req.files) {
        return next(new ErrorHandler('Please upload file.', 400))
    }

    const file = req.files.file;

    //check file type
    const supportedFiles = /.docs|.pdf/;
    if(!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler('Please upload supported document file.',400))
    }

    //check document size
    if(file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler('Please upload file less that 2MB.', 400));
    }

    //Renaming resume
    file.name = `${req.user.name.replace(' ','_')}_${job._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async err => {
        if(err) {
            console.log(err);
            return next( new ErrorHandler('Resume upload failed.', 500))
        }

        await Job.findByIdAndUpdate(req.params.id, {$push : {
            applicantsApplied : {
                id : req.user.id,
                resume : file.name
            }
        }}, {
            new : true,
            runValidators : true,
            useFindAndModify : false
        });

        res.status(200).json({
            success : true,
            message : 'Applied to Job sucessfully.',
            data : file.name
        })
    })
})