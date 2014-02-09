var http = require("http"),
    express = require("express"),
    app = express();


var table = undefined;
var currentFrame = undefined;
var target_data = undefined;
var cameraEvents = undefined;

app.set("view engine", "ejs");
app.use("/static", express.static("static"));



app.get("/", function(req,res)
{
        res.render("index");
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
		
		function send(res)
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
		}
		send(res);
       
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

app.get("/setCVProp/:prop/:value", function(req,res)
{
	process.emit("CVPropertyChange", req.param("prop"), req.param("value"));
	res.send("Set");
});

app.get("/setThreshProp/:prop/:value", function(req,res)
{
	process.emit("ThreshPropertyChange", req.param("prop"), req.param("value"));
	res.send("Set");
});

app.get("/save", function(req,res)
{
	process.emit("saveSettings");
	res.send("Set");
});

app.get("/networktable", function(req,res)
{
	res.render("networktable");
});

app.get("/vision", function(req,res)
{
	res.render("vision");
});

exports.init = function(networkTable)
{
	table = networkTable;
	process.on("finishedProcessing", function(newFrame, data)
	{
		currentFrame = newFrame;
		target_data = data;
	});
	app.listen(8081);
}
