var Dissolve = require("dissolve"),
    Concentrate = require("concentrate"),
    net = require("net"),
    events = require("events");

var entries = new Array();

function packAssignmentValue(stack, value)
{
        if ( typeof value == "boolean" )
                return stack.uint8(value?0x01:0x00);
        else if ( typeof value == "number" )
                return stack.doublebe(value);
        return null;
}

function getAssignmentValueType(value)
{
        if ( typeof value == "boolean" )
                return 0x00;
        else if ( typeof value == "number" )
                return 0x01;
        return 0x01;
}

var getByEntryID = function(entryID)
{
        for ( k in entries )
        {
		console.log(entries[k]);
		console.log(entryID);
                if (entries[k].entryID == entryID)
                        return entries[k];
        }
        return undefined;
};


var parser = Dissolve().loop(function()
{
        this.uint8("msgType").tap(function()
        {
                if ( this.vars.msgType == 0x10 ) // Entry Assignment
                {
                        function addNewEntry()
                        {
				console.log(this.vars);
                                entries[this.vars.entryID] = this.vars;
                                this.vars = {};
                        }

                        var kl = 0;
                        var stack = this.uint16be("keyLength").tap (function() {
                                this.string("key", this.vars.keyLength)
                                .uint8("valueType")
                                .uint16be("entryID")
                                .uint16be("sequence").tap(function()
                                {
                                        if ( this.vars.valueType == 0x00 )
                                                this.uint8("value").tap(addNewEntry);
                                        else if ( this.vars.valueType == 0x01 )
                                                this.doublebe("value").tap(addNewEntry);
                                });
                        });
                }
                else if ( this.vars.msgType == 0x11 )
                {
                        function editExistingEntry()
                        {
                                entries[this.vars.entryID].value = this.vars.value;
                                this.vars = {};
                        }

                        this.uint16("entryID").
                        uint16("sequence").tap(function() {
			    oldkey = getByEntryID(this.vars.entryID);
                            console.log(oldkey);
			    if ( oldkey.valueType == 0x00 )
			    {
                                    this.uint8("value").tap(editExistingEntry);
                            		console.log("reading bool");
			    }
				else if ( oldkey.valueType == 0x01 )
                                    this.doublebe("value").tap(editExistingEntry);
                        });
                }
        });
});

exports.connect = function(host, connect)
{
        sock = net.connect(1735, host, function()
        {
                data = Concentrate().uint8(0x01).uint16be(512).result();
                sock.write(data, "binary");
                //sock.pipe(parser);
		if ( connect != undefined )
			setTimeout(connect, 500);
        });
};

exports.get = function(key, defaultValue)
{
        for ( k in entries )
        {
                if (entries[k].key == key)
                        return entries[k].value;
        }
        return defaultValue;
};

exports.getEntries = function()
{
	return entries;
};

exports.set = function(key, value)
{
        var entry = undefined;
        for ( k in entries )
        {
                if (entries[k].key == key)
                        entry = entries[k];
        }

        var data = undefined;
        if ( entry == undefined )
        {
                data = Concentrate()
                        .uint8(0x10)
                        .uint16be(key.length).string(key)
                        .uint8(getAssignmentValueType(value))
                        .uint16be(0xFFFF)
                        .uint16be(0x01);
                if ( typeof value == "boolean" )
                        data.uint8(value?0x01:0x00);
                else if ( typeof value == "number" )
                        data.doublebe(value);
        }
        else
        {
                entry.sequence++;
                data = Concentrate()
                        .uint8(0x11)
                        .uint16be(entry.entryID)
                        .uint16be(entry.sequence);
                if ( typeof value == "boolean" )
                        data.uint8(value?0x01:0x00);
                else if ( typeof value == "number" )
                        data.doublebe(value);
        }
        d = data.result();
	console.log(d);
        sock.write(d, "binary");
};

