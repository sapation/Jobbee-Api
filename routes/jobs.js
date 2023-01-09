const express = require("express");
const router = express.Router();


// Importing Jobs Controllermethods
const {
     getJobs,
     newJob,
     getJobsInRadius,
     updateJob,
     deleteJob,
     getJob,
     jobStats,
     applyJob
} = require("../controllers/jobsController")
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

router.route('/jobs').get(getJobs);
router.route('/job/:id/:slug').get(getJob);
router.route('/jobs/:zipcode/:distance').get(getJobsInRadius);
router.route('/stats/:topic').get(jobStats);

router.route('/job/new').post(isAuthenticated, authorizeRoles('employeer', 'admin'), newJob);
router.route('/job/:id/apply').put(isAuthenticated, authorizeRoles('user'),applyJob)

router.route('/job/:id')
     .put(isAuthenticated, authorizeRoles('employeer', 'admin'), updateJob)
     .delete(isAuthenticated, authorizeRoles('employeer', 'admin'), deleteJob);


module.exports = router;