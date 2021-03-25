const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const geoCoder = require('../utils/geocoder')

const jobSchema = new mongoose.Schema({
    title:{
        type: String,
        required : [true, 'Please enter Job title'],
        trim: true,
        maxlength:[100, 'Job title can not exceed  100 characters.']
    },
    slug : String,
    description :{
        type :String,
        required : [true, 'Please enter Job description'],
        trim: true,
        maxlength:[1000, 'Job title can not exceed 1000 characters.']
    },
    email:{
        type: String,
        validate: [validator.isEmail, 'Please add a valid email address.']
    },
    address:{
        type: String,
        required:[true, 'Please add an address']
    },
    location:{
       type:{
        type:String,
        enum:['point'],
       },
       coordinates :{
           type:[Number],
           index : '2dshere'
       },
       formattedAddress : String,
       city : String,
       state : String,
       zipcode : String,
       country : String
       
    },
    company:{
        type:String,
        required:[true, 'Please add Company name']
    },
    industry:{
        type: [String],
        required: true,
        enum:{
            values:[
                'Bussiness',
                'Information Technology',
                'Banking',
                'Education',
                'Telecomunication',
                'Others'
            ],
            message: 'Please select correct options for industry'
        }
    },
    jobType:{
        type:String,
        required: true,
        enum:{
            values:[
                'Permanent',
                'Temporary',
                'Intentionship'
            ],
            message: 'Please select correct options for job type'
        }
    },

    minEducation:{
        type:String,
        required:true,
        enum:{
            values:[
                'Bachelors',
                'Masters',
                'Phd'
            ],
            message: 'Please select correct options for education' 
        }
    },
    positions:{
        type:Number,
        default: 1,
    },
    experience:{
        type:String,
        required: true,
        enum:{
            values:[
                 'No Experience',
                 '1 Year - 2 Years',
                 '2 Year - 5 Years',
                 '2 Years +'

            ],
            message: 'Please select correct options for Experience'
        },
    },

    salary:{
        type:Number,
        required : [true, 'Please enter Expected salary for this job.'],
    },

    postingDate:{
        type: Date,
        default: Date.now
    },

    lastDate:{
        type:Date,
        dafault : new Date().setDate(new Date().getDate() + 7)
    },

    applicantsApplied:{
        type: [Object],
        select : false
    }
});

// creating job slug before saving 
jobSchema.pre('save', function(next){
    // creating slug be4 saving
    this.slug = slugify(this.title,{lower: true});
    next();
});

//  setting up Locations
jobSchema.pre('save', async function(next){
    const loc = await geoCoder.geocode(this.address);

    this.location = {
        type : 'Point',
        coordinates : [loc[0].longitude, loc[0].latitude],
        formattedAddress : loc[0].formattedAddress,
        city : loc[0].city,
        state : loc[0].stateCode,
        zipcode : loc[0].zipcode,
        country : loc[0].countryCode 
    }
})

module.exports = mongoose.model("Job", jobSchema );