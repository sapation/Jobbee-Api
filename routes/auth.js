const express = require('express');
const router = express.Router();

const { registerUser, loginUser, forgotPassword, resetPassword, logout} = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(isAuthenticated, logout);

router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);

module.exports = router;