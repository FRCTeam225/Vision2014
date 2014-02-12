var vision = require("./TargetTracker"),
	webServer = require("./WebServer"),
	table = require("./networktable");
	
webServer.init();
	/*
table.connect("10.2.25.2", function()
{
	webServer.init();
});*/