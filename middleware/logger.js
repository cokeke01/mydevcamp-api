
// @desc    Los request to console
const logger = (req, res, next) => {
    console.log(
        `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`
    );
    next();
}


//to have access to this from other files, we need t export it
module.exports = logger;