const Job = require('../models/jobs');
const geoCoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncError = require('../middleware/catchAsyncErrors')

// Get All jobs => "//api/v1/jobs"
exports.getJobs = async(req, res, next)=>{
    const jobs =await Job.find();
    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs
    });
}

// cresteing a new job => /api/v1/jobs
exports.newJob =catchAsyncError(async(req, res, next)=>{
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
    let job = await Job.findById(req.params.id);

    if(!job){
        return next(new ErrorHandler('Job not found.', 404));
    }

    job = await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success : true,
        message : 'Job Deleted.',
    })
})

// Get a single job with id and slug = /api/v1/job/:id/:slug
exports.getJob = catchAsyncError(async(req, res, next)=>{
    const job = await Job.find({$and: [{_id : req.params.id}, {slug: req.params.slug}]});

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
})