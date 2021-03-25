const expres = require("express");
const router = expres.Router();

// Importing Jobs Controllermethods
const {
     getJobs,
     newJob,
     getJobsInRadius,
     updateJob,
     deleteJob,
     getJob,
     jobStats
     } = require("../controllers/jobsController")

router.route('/jobs').get(getJobs);
router.route('/job/:id/:slug').get(getJob);
router.route('/jobs/:zipcode/:distance').get(getJobsInRadius);
router.route('/stats/:topic').get(jobStats);

router.route('/job/new').post(newJob);

router.route('/job/:id')
             .put(updateJob)
             .delete(deleteJob);


module.exports = router;