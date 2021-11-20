const express = require('express');

const {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse
    } = require ('../controllers/courses'); //using destructure


const Course = require('../models/Course'); //included because of advancedResult query

const router = express.Router({mergeParams: true});  // Enabling mergeParams for re-routed request to work


// Auth middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults'); //for advanced query middleware

router
.route('/')
.get(
    advancedResults(Course, {
      path: 'bootcamp',
      select: 'name description'
    }),
    getCourses
    )
.post(protect, authorize('publisher', 'admin'), addCourse);

router
.route('/:id')
.get(getCourse)
.put(protect, authorize('publisher', 'admin'), updateCourse)
.delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;