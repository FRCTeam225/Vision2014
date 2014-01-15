var cv = require("opencv"),
        http = require("http"),
        express = require("express"),
        vapix = require('vapix'),
        table = require('./networktable'),
        app = express();

table.connect("10.2.25.2");

var stream_options = {
    resolution: '640x480',
    compression: 30,
    fps: 5
}

var camera = vapix.createCamera({
  address: '10.2.25.11',
  port: '80',
  username: 'root',
  password: 'frc225'
});

var image_stream = camera.createVideoStream(stream_options);

var currentFrame = undefined;
var target_data = {};

var high_thresh = [120,255,255];
var low_thresh = [55,90,20];


image_stream.on("data", function(imData)
{
        cv.readImage(imData, function(err, im)
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
                        imCopy.drawContour(contours, i, [0,0,255]);
                        }
                }
                table.set("/test/hasTarget", hasTarget);
                currentFrame = imCopy;
        });
});

app.get("/target.mjpeg", function(req,res)
{
  if ( currentFrame == undefined )
  {
    res.send("no image");
  }
  else
  {
        res.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=first',
           'Cache-Control': 'no-cache',
           'Connection': 'close',
           'Pragma': 'no-cache'
        });
		
		function (res)
		{
			var sendImage = setInterval(function(res)
			{
				res.write("--first\r\n");

				res.write("Content-type: image/jpeg\r\n");
				res.write("Content-Length: "+currentFrame.toBuffer().length+"\r\n");
				res.write("\r\n");

				res.write(currentFrame.toBuffer(), "binary");
				res.write("\r\n");
			}, 200, res);
			
			res.connection.on('close', function() { clearInterval(sendImage); });
		}(res);
       
  }
});

app.get("/target.jpg", function(req,res)
{
  if ( currentFrame == undefined )
  {
    res.send("no image");
  }
  else
  {
        res.writeHead(200, {
           'Cache-Control': 'no-cache',
           'Connection': 'close',
           'Pragma': 'no-cache'
        });

        res.write(currentFrame.toBuffer(), "binary");
        res.end();
  }
});


app.get("/target.json", function(req,res)
{
        res.json(target_data);
});

app.get("/", function(req,res)
{
        res.send("<img src=\"/target.mjpeg\"></img>");
});

app.listen(8081);

