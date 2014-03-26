var table = require("./networktable");
	
table.connect("10.2.25.2", function()
{
	require("./crioserver");
  require("./TargetTracker");
	require("./WebServer");
});
