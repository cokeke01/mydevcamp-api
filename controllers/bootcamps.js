const path = require('path')    //to get a file path and extension
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

//here we are going to create diff methods associated with diff routes

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults); 
   // res.status(200).json({success: true, msg: 'Show all bootcamps'});
});

// @desc    Get a single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  
        const bootcamp = await Bootcamp.findById(req.params.id);

        if(!bootcamp){
            //return res.status(400).json({success:false}); //formated object id not in DB
            return next(
                new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
            );
        }

        res.status(200).json({
            success: true,
            data: bootcamp
        });
       
   // res.status(200).json({success: true, msg: `Get bootscamp ${req.params.id}`});
});

// @desc    Create a bootcamp
// @route   GET /api/v1/bootcamp
// @access  Private
exports.createBootcamp = asyncHandler( async (req, res, next) => {
    
        // Add user to req,body
        req.body.user = req.user.id;

        // Check for published bootcamp
        const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

        // If the user is not an admin, they can only add one bootcamp
        if (publishedBootcamp && req.user.role !== 'admin') {
          return next(
            new ErrorResponse(
              `The user with ID ${req.user.id} has already published a bootcamp`,
              400
            )
          );
        }
        const bootcamp = await Bootcamp.create(req.body);

        res.status(201).json({
            success: true,
            data: bootcamp
        });
 
    //console.log(req.body);
    //res.status(200).json({success: true, msg: 'Create new bootcamps'});
});


// @desc    Update bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    
        let bootcamp = await Bootcamp.findById(req.params.id);

        if (!bootcamp) {
          return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
          );
        }

        // Make sure user is bootcamp owner
        if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
          return next(
            new ErrorResponse(
              `User ${req.user.id} is not authorized to update this bootcamp`,
              401
            )
          );
        }

        bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true
        });

        res.status(200).json({
            success: true,
            data: bootcamp
        });    
    
    //res.status(200).json({success: true, msg: `Update bootscamp ${req.params.id}`});
});

// @desc    Delete bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler( async (req, res, next) => {    

      //  const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id); findByIdAndDelete will not trigger the middleware 
      const bootcamp = await Bootcamp.findById(req.params.id); //will trigger the .remove middleware on model
    
        if(!bootcamp){
            return next(
                new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
            );
        }    

        // Make sure user is bootcamp owner
        if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
          return next(
            new ErrorResponse(
              `User ${req.user.id} is not authorized to delete this bootcamp`,
              401
            )
          );
        }

        bootcamp.remove();       

        res.status(200).json({
            success: true,
            data: {}
        });    
    //res.status(200).json({success: true, msg: `Delete bootscamp ${req.params.id}`});
});


// @desc      Get bootcamps within a radius
// @route     GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access    Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params;
  
    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;
  
    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3,963 mi / 6,378 km
    const radius = distance / 3963;
  
    const bootcamps = await Bootcamp.find({
      location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });
  
    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps
    });
  });



// @desc      Upload photo for bootcamp
// @route     PUT /api/v1/bootcamps/:id/photo
// @access    Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
  
    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }
    
    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this bootcamp`,
          401
        )
      );
    }
    

    if (!req.files) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }
  
    const file = req.files.file;
  
    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Please upload an image file`, 400));
    }
  
    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
          400
        )
      );
    }
  
    // Create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
  
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse(`Problem with file upload`, 500));
      }
  
      await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
  
      res.status(200).json({
        success: true,
        data: file.name
      });
    });
  });