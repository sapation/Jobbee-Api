// create and save token in cookies 
const sendToken = (user, statusCode, res) => {
    //crete JWT token
    const token = user.getJwtToken();

    //options
    const options = {
        expires : new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 1000*24*60*60),
        httpOnly : true
    }

    if(process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
        success : true,
        token
    })
}

module.exports = sendToken;