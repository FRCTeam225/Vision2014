var net = require('net');
var vision = require("./TargetTracker.js")

var server = net.createServer(function(c)
{
  vision.processImage(function(img, hasTarget)
  {
    c.end(new Buffer([hasTarget?1:0]), "binary");
  });
});

server.listen(1337);


