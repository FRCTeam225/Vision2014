var express = require("express"),
	app = express(),
	table = require("./networktable"),
	config = require("./config")
	vision = require("./TargetTracker.js");
	
app.set("view engine", "ejs");
app.use("/static", express.static("static"));
	
app.get("/", function(req,res)
{
	res.redirect("/vision");
});

app.get("/vision", function(req,res)
{
	res.render("vision", {config: config});
});

app.get("/networktable", function(req,res)
{
	console.log(table.getEntries());
	res.render("networktable", {table: table.getEntries()});
});

app.get("/setProperty/:key/:value", function(req,res)
{
	config[req.param("key")] = req.param("value");
	res.send("set");
});

app.get("/getProperty/:key", function(req,res)
{
	try {
		res.send(config[req.param("key")]);
	} catch (e) {
		res.send("Key not found");
	}
});

app.get("/target.mjpeg", function(req,res)
{
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=first',
       'Cache-Control': 'no-cache',
       'Connection': 'close',
       'Pragma': 'no-cache'
    });

		function send(res)
		{
			var sendImage = setInterval(function(res)
			{
        vision.processImage(function(img, hasTarget)
        {
  				var currentImage = hasTarget.toBuffer();
  				res.write("--first\r\n");

  				res.write("Content-type: image/jpeg\r\n");
  				res.write("Content-Length: "+currentImage.length+"\r\n");
  				res.write("\r\n");

  				res.write(currentImage, "binary");
  				res.write("\r\n");
        });
			}, config.frameRequestRate, res);
			
			res.connection.on('close', function() { clearInterval(sendImage); });
		}
		send(res);
       
  }
});

app.get("/target.jpg", function(req,res)
{
  vision.processImage(function(img, hasTarget)
  {
    res.writeHead(200, {
       'Cache-Control': 'no-cache',
       'Connection': 'close',
       'Pragma': 'no-cache'
    });

    res.write(currentFrame.toBuffer(), "binary");
    res.end();
  });
});


//exports.init = function()
//{
	app.listen(8080);
//};
