var cv = require("opencv"),
    camera = new cv.VideoCapture(0),
    table = require('./networktable'),
    events = require('events'),
    webServer = require("./WebServer.js");

var target_data = {};

table.connect("10.2.25.2", function()
{
	camera.set("CV_CAP_PROP_BRIGHTNESS", table.get("/Preferences/CV_CAP_PROP_BRIGHTNESS"));
	camera.set("CV_CAP_PROP_CONTRAST", table.get("/Preferences/CV_CAP_PROP_CONTRAST"));
	camera.set("CV_CAP_PROP_SATURATION", table.get("/Preferences/CV_CAP_PROP_SATURATION"));
	camera.set("CV_CAP_PROP_HUE", table.get("/Preferences/CV_CAP_PROP_HUE"));
	process.emit("finishedProcessing");
	webServer.init(table);
});

process.on("CVPropertyChange", function(key, value)
{
	console.log("change "+key+" to "+value);
	try {
		camera.set(key, value);
		table.set("/Preferences/"+key, parseFloat(value));
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

		low_thresh = [table.get("HBottom", 55), table.get("SBottom", 90), table.get("VBottom", 20)];
		high_thresh = [table.get("HTop", 120), table.get("STop", 255), table.get("VTop", 255)];

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

process.on("saveSettings", function()
{
	table.set("/Preferences/~S A V E~", true);
});

process.emit("finishedProcessing", undefined);


