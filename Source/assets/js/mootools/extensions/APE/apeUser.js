(function()
{
	var // Constants
		REPAIR_WAIT = 60000; // How long do we want to wait until we conclude that the connection has been lost?
		
	this.APE.User = new Class({
		Implements: [Options, Events],
		
		global: {}, // End-developers can store whatever they want here without namespacing/scope issues
		
		options:
		{
			apeClient: null,				// INSTANCE of the APE.Client class
			identifier: 'ape',				// APE identifier
			username: 'Anonymous',			// This user's name
			channels: '',					// APE channel(s)
			enableConnectionRepair: true,	// Attempts to repair the connection during initialization
			
			// Objects to send with the APE start() and load() methods (respectively)
			startObj: {},
			loadObj: {}
		},
		
		initialize: function(options)
		{
			/* Environment */
			this.setOptions(options);
			
			/* Initialization */
			this.ape = this.options.apeClient;
			if(this.options.init) this.options.init.apply(this);
			this.started = false;
			this.anon = false;
			this.global.cmdObject = {};
			this.global.answer = null;
			this.global.points = 0;
			
			/* Old-version method keeper */
			var old = {options:{}};
			old.options.load = this.options.load;
			old.options.ready = this.options.ready;
			old.options.start = this.options.start;
			old.options.stop = this.options.stop;
			
			/* Method wrappers */
			this.options.load = function()
			{
				if(old.options.load) old.options.load.apply(this);
				
				if(this.ape.core.options.restore) this.ape.core.start();
				else this.ape.core.start(this.options.startObj);
				
				if(this.options.enableConnectionRepair)
					(function(){ if(!this.started) this.repairConnection(); }).delay(REPAIR_WAIT, this);
			}.bind(this);
			
			this.options.ready = function()
			{
				if(old.options.ready) old.options.ready.apply(this);
				this.ape.core.join(this.options.channels);
			}.bind(this);
			
			this.options.start = function()
			{
				if(old.options.start) old.options.start.apply(this);
				
				if(!this.started)
				{
					if(!this.options.identifier) this.options.identifier = 'ape';
					this.ape.load(Object.merge({ 'identifier': this.options.identifier }, this.options.loadObj));
				}
				
				else this.repairConnection();
			}.bind(this);
			
			this.options.stop = function()
			{
				if(old.options.stop) old.options.stop.apply(this);
				this.ape.core.quit();
			}.bind(this);
			
			if(!this.options.makeDataObject) this.options.makeDataObject = function(item){ return item; };
			else this.options.makeDataObject.bind = this.options.makeDataObject.bind(this);
			
			/* Register methods with their appropriate event handlers */
			this.ape.addEvent('onLoad', this.options.load);
			this.ape.addEvent('onReady', this.options.ready);
			
			/* APE-specific event handlers */
			this.ape.onRaw('IDENT', function(response)
			{
				// Means the server changed the user's name. Probably an anonymous user!
				if(response.data.user.properties.username != this.options.username)
					this.fireEvent('modified', response.data.user.properties.username);
				
				this.started = true;
				this.fireEvent('apeready');
			}.bind(this));
			
			this.ape.addEvent('multiPipeCreate', function(pipe, properties)
			{ this.fireEvent('chanConnect', pipe, properties); }.bind(this));
			
			this.ape.addEvent('apeDisconnect', function()
			{ this.fireEvent('servDisconnect'); }.bind(this));
			
			this.ape.addEvent('multiPipeDelete', function()
			{ this.fireEvent('chanDisconnect'); }.bind(this));
			
			// Error-response watchdog
			this.ape.addEvent('onRaw', function(response)
			{ if(response.raw == 'ERR') this.fireEvent('error', [response.data.value, response.data.code]); }.bind(this));
			
			/* Final bindings */
			this.stop = this.options.stop;
			this.start = this.options.start;
			this.start();
		},
		
		/* Method: sendCMD( string command [, string paramObjectString] )
		 * This method sends a raw command to the APE server
		 *
		 * @param command The command name (case sensitive)
		 * @param paramObjectString The object of params to send to the server.
		 * @return NULL
		**/
		sendCMD: function(command, paramsObject)
		{
			paramsObject = this.options.makeDataObject.call(this, paramsObject || {});
			this.ape.core.request.cycledStack.add(
				command.toString(),
				paramsObject
			); // Add command to the send stack
		},
		
		/* Method: repairConnection()
		 * This method attempts to repair the connection to the server
		 *
		 * @return NULL
		**/
		repairConnection: function()
		{
			// Reset the cookie, the frequency, and clear out any session data
			var tmp	= JSON.decode(Cookie.read('APE_Cookie'), { 'domain': document.domain }) || {};
			Cookie.dispose('APE_Cookie', { 'domain': document.domain });
			
			tmp.frequency = 0;
			this.ape.core.options.frequency = APE.Config.frequency = tmp.frequency;
			
			Cookie.write('APE_Cookie', JSON.encode(tmp), { 'domain': document.domain });
			
			this.ape.core.clearSession();
			this.ape.core.initialize(this.ape.core.options);
			
			(function()
			{
				if(!this.started)
				{
					this.fireEvent('connectionLost');
					location.reload(true);
				}
			}).delay(REPAIR_WAIT, this);
		},
		
		/* Method: addRawEvent( targetRAW, [perpetuate, ] fn )
		 * This method listens for a specific RAW response from the APE.
		 * Once the response is fired, it is immediately removed if perpetual is false.
		 *
		 * @return e the function reference (to use removeEvent manually)
		**/
		addRawEvent: function(targetRAW, perpetuate, fn)
		{
			if(arguments.length == 2)
			{
				var fn = perpetuate;
				perpetuate = false;
			}
			
			var e = this.ape.addEvent('onRaw', function(response)
			{
				if(Array.from(targetRAW).contains(response.raw))
				{
					fn.apply(this, Array.from(arguments));
					if(!perpetuate) this.ape.removeEvent('onRaw', e);
				}
			}.bind(this));
			
			return e;
		}
	});
})();