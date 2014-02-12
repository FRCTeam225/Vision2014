var cv = require("opencv"),
	table = require("./networktable"),
	webServer = require("./WebServer.js"),
	fs = require("fs"),
	config = require("./config"),
	webServer = require("./WebServer.js");
	
var processedImage = undefined;

var options = {
    resolution: '640x480',
    compression: 25,
    duration: 10,
    fps: 10
};

var cv_stream = new cv.ImageDataStream();

cv_stream.on("data", function(im)
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
                    console.log(rect);
                    imCopy.drawContour(contours, i, [255,0,0]);
                    break;
            }
            else
            {
                    target_data = {};
            }
    }
	processedImage = imCopy;
    table.set("/techfire/hasTarget", hasTarget);
});

camera.createVideoStream(options).pipe(cv_stream);

exports.getProcessedImage = function()
{
	return processedImage;
};
