const express = require('express');
const router = express.Router();

const { 
    getUserProfile,
    updatePassword,
    updateAccount,
    deleteAccount,
    getAppliedJobs,
    getAllPublishedJobs,
    getUsers,
    deleteUser
} = require('../controllers/userController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

router.use(isAuthenticated);

router.route('/me').get(getUserProfile);
router.route('/jobs/applied').get(authorizeRoles('user'), getAppliedJobs);
router.route('/jobs/published').get(authorizeRoles('employeer','admin'), getAllPublishedJobs);

router.route('/password/update').put(updatePassword);
router.route('/me/update').put(updateAccount);

router.route('/me/delete').delete(deleteAccount);

// Admin routes only
router.route('/users').get(authorizeRoles('admin'), getUsers);
router.route('/user/:id').delete(authorizeRoles('admin'), deleteUser);

module.exports = router;