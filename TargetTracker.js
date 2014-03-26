var cv = require("opencv"),
	webServer = require("./WebServer.js"),
	fs = require("fs"),
	config = require("./config"),
	webServer = require("./WebServer.js"),
	request = require("request");
	
var processedImage = undefined;

exports.processImage = function(callback)
{
  request("http://10.2.25.11/mjpg/video.jpg", function (err, res, body)
  {
    cv.readImage(body, function (im)
    {
	    imCopy = im.copy();
	    im.convertHSVscale();

	    im.inRange([config.lowH, config.lowS, config.lowV], [config.highH, config.highS, config.highV]);
	    im.erode(2);
	    im.dilate(3);

	    var hasTarget = false;
	    contours = im.findContours();
	    for ( var i = 0; i < contours.size(); i++ )
	    {
        contours.approxPolyDP(i, 7, true);
        rect = contours.boundingRect(i);
  	    rect.ratio = rect.width/rect.height;
  	    if ( contours.cornerCount(i) == 4  && rect.ratio > 2 )
  	    {
          	hasTarget = true;
          	target_data = rect;
          	imCopy.drawContour(contours, i, [255,0,0]);
          	break;
  	    }
  	    else
  	    {
            imCopy.drawContour(contours, i, [0,0,255]);
          	target_data = {};
  	    }
    	}
	    callback(hasTarget, image);
    });
  });
};
