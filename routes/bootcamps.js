
const express = require('express');

const {
    getBootcamp, 
    getBootcamps, 
    createBootcamp, 
    updateBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    bootcampPhotoUpload
    } = require ('../controllers/bootcamps'); //using destructure


const Bootcamp = require('../models/Bootcamp'); // Included after the advancedesult middleware was created


// Include other resource routers
const courseRouter = require('./courses')
const reviewRouter = require('./reviews')

const router = express.Router();


// Auth middleware
const { protect, authorize } = require('../middleware/auth');

// Include the advanced search result middleware
const advancedResults = require('../middleware/advancedResults');


// Re-route into other resource routers - request is forwared to course
router.use('/:bootcampId/courses', courseRouter);  
router.use('/:bootcampId/reviews', reviewRouter); 

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
    .route('/')
    .get(advancedResults(Bootcamp, 'courses'), getBootcamps) //model is Bootcamp, populate is courses
    .post(protect,authorize('publisher', 'admin'), createBootcamp);

router
    .route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);


module.exports = router;