var cv = require("opencv"),
    camera = new cv.VideoCapture(0),
    table = require('./networktable'),
    events = require('events'),
    webServer = require("./WebServer.js"),
	fs = require("fs"),
	config = JSON.parse(fs.readFileSync("config.json"));

var target_data = {};

var high_thresh = config.highThresh;
var low_thresh = config.lowThresh;


camera.set("CV_CAP_PROP_BRIGHTNESS", config.CV_CAP_PROP_BRIGHTNESS);
camera.set("CV_CAP_PROP_CONTRAST", camera.CV_CAP_PROP_CONTRAST);
camera.set("CV_CAP_PROP_SATURATION", camera.CV_CAP_PROP_SATURATION);
camera.set("CV_CAP_PROP_HUE", camera.CV_CAP_PROP_HUE);

table.connect("10.2.25.2", function()
{
	process.emit("finishedProcessing");
	webServer.init(table);
});

process.on("CVPropertyChange", function(key, value)
{
	try {
		camera.set(key, value);
	} catch(e) {
		console.log("Property Change Failed");
	}
});

process.on("ThreshPropertyChange", function(key, value)
{
	table.set("/Preferences/"+key, parseFloat(value));
});

process.on("finishedProcessing", function()
{
	camera.read(function(err, im)
	{
                imCopy = im.copy();
                im.convertHSVscale();

                im.inRange(low_thresh, high_thresh);
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
                table.set("/techfire/hasTarget", hasTarget);
		process.emit("finishedProcessing", imCopy, target_data);
	});
}, 500);

process.emit("finishedProcessing", undefined);


