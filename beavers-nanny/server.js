var WebSocketServer = require('websocket').server;	// Requires websocket plugin; run 'npm install websocket'
var http = require('http');
var spawn = require('child_process').spawn;

function LOG(message)
{
	console.log("LOG " + (new Date()) + ": " + message);
}


var status = {
	audio: false,
	video: false,
};


var server = {
	_protocol: 'nanny-basic',
	_http: null,
	_ws: null,
	_connections: [],
	_connectionCounter: 0,

	// Internal function used as a close callback for connections.
	_closeConnection: function(reasonCode, description)
	{
		// Note that this function is always binded, so this points to current connection.
		LOG("Closing connection #" + this.absId);
		var last = server._connections.pop();
		if (this.id < server._connections.length) {
			server._connections[this.id] = last;			// patch the hole in the array by last item
			server._connections[this.id].id = this.id;		// update index of moved connection
		}
		
		// The list is empty, terminate audio recording.
		if (server._connections.length == 0) {
			audio.stop();
		}
	},


	_receiveCommand: function(msg)
	{
		if (msg.type !== 'utf8') return;
		var data = msg.utf8Data;
		LOG("Message received from connection #" + this.absId);
		
		try {
			var cmd = JSON.parse(data);
			if (!cmd.command || !commands[cmd.command])
				throw "Invalid command '" + cmd.command + "'.";
			
			LOG("Invoking command " + cmd.command);
			var res = commands[cmd.command](cmd.args);

			this.wsConnection.send(JSON.stringify({
				id: cmd.id,
				res: res,
			}));
		}
		catch(e) {
			var error = { error: String(e) };
			LOG("Command Error: " + error.error);
			if (cmd && cmd.id !== undefined)
				error.id = cmd.id;
			this.wsConnection.send(JSON.stringify(error));
		}		
	},
	
	
	// Initialization function that starts the server.
	init: function(port)
	{
		LOG("Beaver's nanny server initialization ...");
		var server = this;
		
		// Prepare a http server for the web socket server.
		this._http = http.createServer(function(request, response) {
			// No regular HTTP requests are accepted.
			LOG("Received HTTP request for " + request.url);
			response.writeHead(404);
			response.end();
		});
		this._http.listen(port, function() {
			LOG('Starting HTTP server on port ' + port + '...');
		});
		
		// Create a web socket server and attach it to existing http server.
		this._ws = new WebSocketServer({
			httpServer: this._http,
			autoAcceptConnections: false,
		});

		// Handling new connections ...
		this._ws.on('request', function(request) {
			// Verify the client requests the right protocol.
			LOG(request.requestedProtocols);
			if (request.requestedProtocols.indexOf(server._protocol) == -1) {
				LOG('Connection from origin ' + request.origin + ' rejected (wrong protocol).');
				request.reject();
				return;
			}
			
			// Create connection object
			var connection = {
				id:				server._connections.length,
				absId:			server._connectionCounter++,
				wsConnection:	request.accept(server._protocol, request.origin),
			};
			server._connections.push(connection);
			LOG('New connection #' + connection.absId + ' from origin ' + request.origin);
			
			// Add callback handlers ...
			connection.wsConnection.on('close', server._closeConnection.bind(connection));
			connection.wsConnection.on('message', server._receiveCommand.bind(connection));
			audio.start();
		});
	},
	
	broadcast: function(data) {
		if (!data || data.length == 0) return; 
		for (var c in server._connections) {
			var connection = server._connections[c];
			connection.wsConnection.send(data);
		}		
	}
};


// TODO: add event handler for terminating each process
// Audio arecord process
var audio = {
	_arecord: null,
	
	isRunning: function()
	{
		return (this._arecord != null);
	},
	
	start: function()
	{
		if (this._arecord) return;
		this._arecord = spawn('/usr/bin/arecord', [ '-t', 'raw', '-f', 'S16_LE', '-r', '44100', '-c', '2', '-D', 'hw:1,0' ], {
			stdio: [ 'ignore', 'pipe', 2 ]
		});
		this._arecord.stdout.on('data', function(data){
			server.broadcast(data);
		});
		status.audio = true;
	},
	
	stop: function()
	{
		status.audio = false;
		if (!this._arecord) return;
		this._arecord.kill();
		this._arecord = null;
	},
};


// Video MJPEG streamer process
var video = {
	_mjpeg: null,
	
	start: function()
	{
		if (this._mjpeg) return;
		this._mjpeg = spawn('/usr/local/bin/mjpg_streamer', [ '-i', '/usr/local/lib/mjpg-streamer/input_uvc.so -f 5 -r 640x480 -y', '-o', '/usr/local/lib/mjpg-streamer/output_http.so -p 8889 -w /usr/local/www' ]);
		status.video = true;
	},
	
	stop: function()
	{
		status.video = false;
		if (!this._mjpeg) return;
		this._mjpeg.kill();
		this._mjpeg = null;		
	}
};


// List of command functions which can be triggered from the client.
// Each function gets an args object with call arguments and return a response that is sent back.
var commands = {
	getStatus: function(args) {
		return status;
	},
	startVideo: function(args) {
		video.start();
		return status;
	},
	stopVideo: function(args) {
		video.stop();
		return status;
	},
};




/*
 * Main Script
 */

server.init(8888);

function cleanup() {
	LOG("Shutting down...");
	audio.stop();
	video.stop();
	process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

