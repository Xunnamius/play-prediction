/*
---
description: A console-like object built around the Ajax Push Engine (APE).

license: MIT-style license

authors:
- Xunnamius

requires:
- core/1.4

provides: [APE.Console]
...
*/

/* documentation and updates @ http://github.com/Xunnamius/apeConsole */
(function() // Private
{
	/* TODO: DECOUPLE DIS BITCH */
	/* TODO: Fix the fucking scrolling problem. I mean really, what the hell. */
	var Version = 1.0,
		
		// Constants
		IMPORTANT = ['IDENT', 'JOIN'],
		INFO = ['SESSION', 'SESSIONS'],
		SUCCESS = ['CONNECT'],
		WARN = [],
		AUTO_IGNORE = ['CHECK', 'CLOSE', 'STAT_LOAD_DATA', 'STATUS_LOAD'],
		REPAIR_WAIT = 9000,
		
		// TODO: Extract some of these methods into their own little Interface files so that other APE-based classes may use them!
		// Private method "cout" takes log method input and transforms it into
		// 		something xHTML can display without barfing all over the page
		cout = function(type /*, ... */)
		{
			var msg = '['+getTimeString()+'] ';
			
			// Hide that "console is empty" thing
			if(!this.co_ep.hasClass('hide')) this.co_ep.addClass('hide');
			
			// Make sure xHTML doesn't barf all over the page
			Array.from(arguments).each(function(item, index)
			{
				if(index)
				{
					if(typeof(item) == 'string') msg = msg + ' ' + item;
					else
					{
						var data = JSON.encode.attempt(item);
						
						if(data) msg = msg + ' ' + data;
						else
						{
							var uniqID = false;
							if(!this.verbose)
							{
								uniqID = String.uniqueID();
								console.warn(uniqID, ':', item);
							}
							
							msg += (' [Circular JSON]' + (uniqID ? (' (check console entry "'+uniqID+'")') : ''));
						}
					}
				}
			}.bind(this));
			
			// No empty messages (if you really want one, use the space bar)
			if(!msg)
			{
				msg = '(empty)';
				type = 'empty';
			}
			
			// Out the door
			this.co.grab(new Element('p', { 'class': 'lcontent ltype_'+type, html: msg }));
			if(!this.co.isFocused) this.co.Fxscroll.toBottom();
		},
	
		// Private method "unshiftArgs" turns the arguments object into an
		// 		array and unshifts a value into it
		unshiftArgs = function(args, shift)
		{
			// Wham bam.
			args = Array.from(args);
			args.unshift(shift);
			return args;
		},
		
		// Private method "getTimeString" returns HH:MM:SS as a string
		getTimeString = function(dateObj){ return (dateObj || new Date()).format('%T') };
	
	// Must have the APE JSF around for this to work!
	this.APE.Console = new Class(
	{
		//Extends: APE.Client,
		Implements: [Options, Events],
		
		options:
		{
			apeClient: null,		// INSTANCE of the APE.Client class
			verbose: false,			// Debug (off by default)
			identifier: '',			// APE identifier
			username: '',			// This user's name
			channels: '',			// APE channel(s)
			console: null,			// Console content container element
			consoleEmptyP: null,	// Console "no-content" element
			sessid: null			// (PHP) Session Identification code
		},
		
		initialize: function(options)
		{
			options.channels = Array.from(options.channels);
			this.setOptions(options);
			
			/* Create shortcuts */
			this.co 	 = $(this.options.console);			// The console content object shortcut
			this.co_ep 	 = $(this.options.consoleEmptyP);	// The thingy that says "empty console"
			this.ape	 = this.options.apeClient;			// APE
			this.verbose = this.options.verbose;			// Shall we post everything to the REAL console? (watch out for console-less IE!)
			
			this.co.isFocused = false; // Keeping track of console focus
			this.co.Fxscroll = new Fx.Scroll(this.co, { wheelStops: false, 'link': 'cancel' });
			this.started = false;
			
			// Don't let the console hang on startup!
			this.setWatchDog();
			this.period = -1; // TODO: Remove this stupid crap.
			
			/* Initialize command history & ignore arrays */
			this.cmdHistory = [0];
			this.cmdIgnore = AUTO_IGNORE;
			
			/* Initialize our events (ALL OF THEM!) */
			
			this.co.addEvent('focus', function(e){ this.isFocused = true; });
			this.co.addEvent('blur', function(e){ this.isFocused = false; });
			
			this.ape.addEvent('multiPipeCreate', function(pipe, properties)
			{
				if(this.verbose) console.info('(multiPipeCreate: ', arguments, ')');
				this.success('Client is now observing multipipe', this.quote(pipe.properties.name));
				
				if(this.options.channels.contains(pipe.properties.name))
				{
					this.important('Ready.');
					this.fireEvent('online');
				}
			}.bind(this));
			
			this.ape.addEvent('userJoin', function(user, pipe)
			{
				if(this.verbose) console.info('(userJoin: ', arguments, ')');
				if(user.properties.username != this.options.username)
				{
					// TODO: make this better
					if(pipe.properties.name == 'admin_console')
						this.warn('Administrator', this.quote(user.properties.username), 'has logged in.');
					else this.warn((user.properties.anon?'Anonymous User':'User'), this.quote(user.properties.username), 'has logged in.');
				}
				
				else
				{
					if(!this.acknowledged)
					{
						this.success(' * The server has acknowledged your connection.');
						this.acknowledged = true;
					}
					
					else if(this.acknowledged != -1)
					{
						this.warn('You have several console instances sending data to the server, which is not allowed. Said connections will be terminated shortly.');
						this.acknowledged = -1;
					}
				}
			}.bind(this));
			
			this.ape.addEvent('userLeft', function(user, pipe)
			{
				if(this.verbose) console.info('(userLeft: ', arguments, ')');
				if(user.properties.username != this.options.username)
				{
					// TODO: make this better
					if(pipe.properties.name == 'admin_console')
						this.warn('Administrator', this.quote(user.properties.username), 'has logged off.');
					else this.warn((user.properties.anon?'Anonymous User':'User'), this.quote(user.properties.username), 'has logged off.');
				}
				
				else this.warn(' * a previous console connection of yours has been terminated.');
			}.bind(this));
			
			this.ape.addEvent('apeDisconnect', function()
			{
				if(this.verbose) console.info('(apeDisconnect: ', arguments, ')');
				this.error('You have been disconnected from the server!');
			}.bind(this));
			
			this.ape.addEvent('multiPipeDelete', function()
			{
				if(this.verbose) console.info('(multiPipeDelete: ', arguments, ')');
				this.error('Your connection to the server has been forcefully terminated. (wtf?)');
			}.bind(this));
			
			this.ape.addEvent('onRaw', function(data)
			{
				if(!this.cmdIgnore.contains(data.raw))
				{
					if(this.verbose) console.log('Receiving RAW data: ', arguments);
					var msg = [ 'Receiving RAW: [', this.u(data.raw), ' : ', data.data,']' ];
					
					if(data.raw == 'ERR')
					{
						if(data.data.value != 'ALREADY_ON_CHANNEL') // We don't really care...
							this.error.apply(this, [ 'RAW ERROR: [', this.u(data.raw), ' : ', data.data,']' ]);
					}
					
					else
					{
						if(WARN.contains(data.raw)) this.warn.apply(this, msg);
						else if(INFO.contains(data.raw)) this.info.apply(this, msg);
						else if(SUCCESS.contains(data.raw)) this.success.apply(this, msg);
						else if(IMPORTANT.contains(data.raw)) this.important.apply(this, msg);
						else this.log.apply(this, msg);
					}
				}
			}.bind(this));
			
			this.ape.addEvent('onCmd', function(cmd, data)
			{
				if(!this.cmdIgnore.contains(cmd))
				{
					var d = data, msg;
					if(this.verbose) console.log('Sent command data: ', arguments);
					if(!data || (typeof(data) == 'object' && !Object.getLength(data))) d = '(no data)';
					
					msg = [ 'Sent command: [', this.u(cmd), ' : ', d,']' ];
					
					if(WARN.contains(cmd)) this.warn.apply(this, msg);
					else if(INFO.contains(cmd)) this.info.apply(this, msg);
					else if(SUCCESS.contains(cmd)) this.success.apply(this, msg);
					else if(IMPORTANT.contains(cmd)) this.important.apply(this, msg);
					else this.log.apply(this, msg);
				}
			}.bind(this));
			
			this.ape.addEvent('uniPipeCreate', function(pipe, opts)
			{
				console.error('unipipe created. This means chatting may work to some extent!');
			}.bind(this));
			
			this.ape.addEvent('uniPipeDelete', function()
			{
				console.error('unipipe destroyed.');
			}.bind(this));
			
			if(this.options.load)  this.ape.addEvent('onLoad', this.options.load.bind(this));
			if(this.options.ready) this.ape.addEvent('onReady', this.options.ready.bind(this));
			
			/* Specific RAW events */
			
			this.ape.onRaw('STAT_DATA', function(data)
			{
				if(this.verbose) console.log('(RAW_STATUS: ', arguments, ')');
				
				var status = '<ol class="RAW_STATUS">';
				Object.each(data.data, function(value, key)
				{
					status += ('<li><span class="key">'+
							  (typeof(key)=='string' ? key : JSON.encode(key))+
							  '</span>: <span class="value">'+
							  (typeof(value)=='string' ? value : JSON.encode(value))+
							  '</span></li>');
				});
				
				this.info('Server Status:<br />', status, '</ol>');
			}.bind(this));
			
			this.ape.onRaw('IDENT', function(data)
			{
				clearTimeout(this.sentinel);
				this.repairing = false;
				this.fireEvent('enable');
			}.bind(this));
			
			// TODO: GOD DAMNIT DECOUPLE THIS SHIT. IT IS DISGUSTING!
			this.ape.onRaw('STAT_LOAD_DATA', function(data)
			{ $('server_load').set('text', data.data.load); });
			
			// TODO: change this "data.data" shit
			this.ape.onRaw('PHASE_GET', function(data)
			{
				this.important('Current Phase: ', data.data.phase);
				// TODO: HERE TOO DAMNIT >:(
				$('phase_status').set('text', 'Current Phase: '+data.data.phase.capitalize()).highlight();
				
				// TODO: Abstract this out into its own class DAMNIT. DRY!!!
				var target = $$('#phase_chain p.phase_box.active');
				if(target) target.removeClass('active');
				$('phase_'+data.data.phase).addClass('active');
			}.bind(this));
			
			this.ape.onRaw('PHASE_SHIFT', function(data)
			{
				var phase = this.quote(data.data.phase.capitalize()), adm = this.u(data.data.initiator);
				
				if(data.data.forced)
					this.superImportant(' ** Administrator', adm, 'FORCED a phase shift! The server has entered the', phase, 'phase.');
				else this.warn(' ** Administrator', adm, 'initiated a phase shift. The server has entered the', phase, 'phase.');
				
				// TODO: HERE TOO >:(
				$('phase_status').set('text', 'Current Phase: '+data.data.phase.capitalize()).highlight();
				var target = $$('#phase_chain p.phase_box.active');
				if(target) target.removeClass('active');
				$('phase_'+data.data.phase).addClass('active');
			}.bind(this));
			
			/* Inline "start()" */
			if(!this.started)
			{
				this.started = true; // Anyone using this class needs to set this in order for toggle to work!
				if(this.options.start) this.options.start.call(this);
			}
			
			/* Method wrappers */
			
			this.options.start = function()
			{
				this.important('Re-establishing server connection [', this.options.identifier,'] ...');
				this.setWatchDog();
				this.repairConnection(true);
				this.log('And... we\'re back!');
				this.started = true;
				this.fireEvent('reconnect');
				return true;
			}.bind(this);
			
			var sto = this.options.stop;
			this.options.stop = function()
			{
				var ret = false;
				if(this.started)
				{
					this.important('Closing connection to channel', this.quote(this.options.channels.toString()), '[', this.options.identifier,'] ...');
					this.ape.core.clearSession();
					this.ape.core.quit();
					this.repairing = false;
					this.started = false;
				
					if(sto) ret = sto.call(this);
					else ret = true;
					this.superImportant('Connection closed. Type "start" to open a new connection.');
					this.fireEvent('disconnect');
				}
				
				return ret;
			}.bind(this);
			
			this.cmdIgnore.OVR_contains = this.cmdIgnore.contains;
			this.cmdIgnore.OVR_include = this.cmdIgnore.include;
			this.cmdIgnore.contains = function(item){ return this.cmdIgnore.OVR_contains(item.toString().toUpperCase()); }.bind(this);
			this.cmdIgnore.include = function(item){ return this.cmdIgnore.OVR_include(item.toString().toUpperCase()); }.bind(this);
		},
		
		/* Methods: log, important, warn, error, et al. ( [...] )
		 * These methods generate different types of log messages within the console window.
		 *
		 * @param ... [Optional] The message you would like to generate. Comma separated. All data types supported.
		 * @return NULL
		**/
		log: 			function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'log')); },
		info: 			function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'info')); },
		important: 		function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'important')); },
		warn: 			function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'warn')); },
		error: 			function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'error')); },
		superImportant: function(/* ... */){ this.error.apply(this, arguments); },
		success:		function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'success')); },
		echo:			function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'echo')); },
		criticalError:   function(/* ... */){ cout.apply(this, unshiftArgs(arguments, 'criticalError')); },
		
		/* Method: anchor( string URI, TEXT ), quote ( string str ), u ( string str )
		 * These sugar methods take the text input and return formatted output
		 *
		 * @param URI/str text to format
		 * @return HTMLAnchorElement/String
		**/
		anchor: function(URI, TEXT){ return '<a href="'+URI+'">'+(TEXT?TEXT:URI)+'</a>'; },
		quote:  function(str){ return '"'+str+'"'; },
		u:  function(str){ return '<span class="underline">'+str+'</span>'; },
		
		// TODO: abstract this function and have it passed in by reference instead!
		/* Method: sendCMD( string command [, string paramObjectString] )
		 * This method sends a raw command to the APE server
		 *
		 * @param command The command name (case sensitive)
		 * @param paramObjectString The object of params to send to the server.
		 * @return NULL
		**/
		sendCMD: function(command, paramsObject)
		{
			paramsObject = paramsObject || /*(!paramsObject && ['string', 'number'].contains(typeof(paramsObject)))) ? paramsObject :*/ {};
			var dataObject = Object.merge(paramsObject, { 'phpsessid':this.options.sessid });
			if(this.verbose) console.log('Building command: "', command, '" with', paramsObject, '->', dataObject);
			this.ape.core.request.cycledStack.add(command.toString(), dataObject); // Add command to the send stack
		},
		
		/* Method: clear()
		 * This method clears the console
		 *
		 * @return NULL
		**/
		clear: function()
		{
			this.co.empty();
			this.co.grab(this.co_ep);
			if(this.co_ep.hasClass('hide')) this.co_ep.removeClass('hide');
		},
		
		// TODO: Decouple this method. Use an event system instead DAMNIT. FUCK!!!!!!!!!!!!!!!
		/* Method: parseInput( string input )
		 * This method parses input in search of a command to execute
		 *
		 * @return NULL
		**/
		parseInput: function(input)
		{
			// We have at MOST three (3) parts per command (that's TWO (2) spaces)
			var commands = input.split(' ', 2), cmd = commands[0].toLowerCase();
			
			// Gawd damn... I had to do all of this just to look for two measly little spaces in a string (optimized conditional :D)
			if(commands[2] = input.indexOf(' ')+1 && input.substr(commands[2], input.lastIndexOf(' ')).indexOf(' ')+1)
				commands[2] = input.substr(commands[2]+input.substr(commands[2]).indexOf(' ')+1);
			else commands.splice(2,1);
			
			if(!this.started && cmd != 'start')
			{
				this.error('The console is unable to accept commands in its current state.');
				this.log('(try "start"ing the console up first)');
			}
			
			else switch(cmd)
			{
				// Send a straight up command to the server in the form of 'server COMMANDNAME [JSONOBJECT1, JSONOBJECT2, ...]'
				case 'server':
					if(commands[1]) this.sendCMD(commands[1], commands[2]);
					else this.error(this.quote(commands[0]), ' alone is not a valid command.');
					break;
				
				// TODO: Send command to send message to specific admin, to all admins (including self), or to all users (including all admins & self)
				case 'msg':
					// TODO: "*" sends to all admins; "**" sends to all users
					this.log('(received msg command)');
					break;
				
				// Clear the console
				case 'clear':
					this.clear();
					break;
				
				// Send command to get pertinent server stats
				case 'status':
					this.sendCMD('STATUS');
					break;
					
				// Begin a phase shift
				case 'phase':
					
					if(commands[1] && commands[1].toLowerCase() == 'shift')
					{
						// TODO: when decoupled, check to make sure the target phase actually exists!
						if(commands[2]) this.sendCMD('PHASE', { method: 'SHIFT', newphase: commands[2].toLowerCase() });
						else this.error(this.quote(commands[0]+' '+commands[1]), 'is not a valid phase command.');
					}
					
					// Send command to get current phase
					else this.sendCMD('PHASE', { method: 'GET' });
					
					break;
				
				// Break off all communications with the server
				case 'stop':
					if(this.options.stop) result = this.options.stop.call(this);
					
					if(!result) this.error('Failed to execute "stop" command.');
					else this.success('Command "stop" executed successfully!');
					
					break;
				session
				// Resume communications with the server (if stopped)
				case 'start':
					if(this.options.start) result = this.options.start.call(this);
					
					if(!result) this.error('Failed to execute "start" command.');
					else this.success('Command "start" executed successfully!');
					
					break;
				
				// Ignore the occurance of a certain RAW (by name)
				case 'ignored':
					if(this.cmdIgnore.length) this.cmdIgnore.each(function(item){ this.log(item); }.bind(this));
					else this.warn('You are not ignoring any commands/RAWs!');
					break;
					
				case 'ignore':
					if(commands[1])
					{
						commands[1] = commands[1].toUpperCase();
						if(!this.cmdIgnore.contains(commands[1]))
						{
							this.cmdIgnore.include(commands[1]);
							this.success('Ignoring all commands/RAWS that match', this.quote(commands[1]));
						}
						
						else this.warn('You are already ignoring ', this.quote(commands[1]));
					}
					
					else this.error(this.quote(commands[0]+' '+commands[1]), 'is not a valid ignorance command.');
					break;
				
				// Opposite of the above
				case 'unignore':
					var c = commands[1].toUpperCase();
					
					if(c)
					{
						if(c == '*')
						{
							this.cmdIgnore.empty();
							this.success('Stopped ignoring all commands/RAWs.');
						}
						
						else
						{
							if(this.cmdIgnore.contains(c))
							{
								c = this.cmdIgnore.splice(this.cmdIgnore.indexOf(c), 1);
								this.success('Paying attention to all commands/RAWS that match', this.quote(c));
							}
							
							else this.error('Cannot unignore', this.quote(c));
						}
					}
					
					else this.error(this.quote(commands[0]+' '+c), 'is not a valid command. Type "help" for help.');
					break;
				
				case 'echo':
					this.echo(commands[1] + (commands[2]?' '+commands[2]:''));
					break;
				
				case 'help':
					this.important('Command List:');
					this.log('server COMMANDNAME [JSONOBJECT1, JSONOBJECT2, ...]', '<strong>Send a command to the server</strong>');
					this.log('msg TARGET MSGSTRING', '<strong>Send a (private?) message to the admin of your choice (also accepts: "*" sends to all admins; "**" sends to all users)</strong>');
					this.log('clear', '<strong>Clear the console</strong>');
					this.log('status', '<strong>Grab some (potentially) useful server stats</strong>');
					this.log('phase', '<strong>Return the current phase, timer, and any other pertinent information</strong>');
					this.log('phase shift PHASENAME', '<strong>Attempt to initiate a phase shift (obviously, you can\'t control certain phases from here. Try the', this.anchor('#!/phase_manager', 'Phase Manager'), 'tab instead.)</strong>');
					this.log('stop', '<strong>Break off communications with the server</strong>');
					this.log('start', '<strong>Resume communications with the server</strong>');
					this.log('ignore', '<strong>Ignore all RAWs/commands of a certain type (name)</strong>');
					this.log('unignore', '<strong>Stop ignoring a specific RAW or command ("*" stops ignoring ALL RAWs/commands)</strong>');
					this.log('ignored', '<strong>Return a list of all the RAWs/commands you\'re currently ignoring</strong>');
					this.log('echo STRINGMESSAGE', '<strong>Inject a string directly into the console</strong>');
					this.log('help', '<strong>Display this message again</strong><br /><br /><div style="text-align: center">--------------------------</div>');
					break;
				
				case 'no':
					if(this.repairing)
					{
						clearTimeout(this.sentinel);
						this.warn('<strong>Refresh aborted. Connection lost.</strong>');
						this.repairing = false;
						this.options.stop.call(this);
						break;
					}
				
				// ?
				default:
					this.error(this.quote(commands[0]), 'is not recognized as an internal or external command. Type "help" for a list of commands.');
					break;
			}
			
			// Update history array, and reset "pointer"
			this.cmdHistory.push(input);
			this.cmdHistory[0] = 0;
		},
		
		/* Method: recallInput()
		 * This method traverses the command history array and returns a command string
		 *
		 * @return string command
		**/
		recallInput: function(dir)
		{
			if(!(this.cmdHistory.length-1)) return ''; // Don't waste my time!
			
			// Make sure we're not at the end/beginning of the stack (no walking off the array!)
			if(dir == '+' && this.cmdHistory.length-this.cmdHistory[0] > 1) this.cmdHistory[0]++;
			else if(dir == '-' && this.cmdHistory[0] > 1) this.cmdHistory[0]--;
			return this.cmdHistory[this.cmdHistory.length-this.cmdHistory[0]];
		},
		
		/* Method: toggle()
		 * This method toggles between the start() and stop() methods
		 *
		 * @return bool true/false on success/failure (respectively)
		**/
		toggle: function()
		{
			if(this.started) return this.options.stop?this.options.stop.call(this):false;
			else return this.options.start?this.options.start.call(this):false;
		},
		
		/* Method: repairConnection()
		 * This method attempts to repair the connection to the server
		 *
		 * @return NULL
		**/
		repairConnection: function(notRepairMode)
		{
			if(!notRepairMode)
			{
				if(this.repairing) return;
				this.repairing = true;
				
				this.info('Attempting to repair connection...');
			}
			
			// Reset the cookie, the frequency, and clear the session
			var tmp	= JSON.decode(Cookie.read('APE_Cookie'), {'domain': document.domain}) || {};
			Cookie.dispose('APE_Cookie', {'domain': document.domain});
			
			tmp.frequency = 0;
			this.ape.core.options.frequency = APE.Config.frequency = tmp.frequency;
			
			Cookie.write('APE_Cookie', JSON.encode(tmp), {'domain': document.domain});
			
			this.ape.core.clearSession();
			this.ape.core.initialize(this.ape.core.options);
			
			if(!notRepairMode)
			{
				this.sentinel = (function()
				{
					this.fireEvent('repairFailed');
					this.error('Unable to repair connection. Refreshing the page in 10 seconds. Enter "no" to abort.');
					this.sentinel = (function(){ location.reload(true); }).delay(10000);
				}).delay(REPAIR_WAIT, this);
			}
		},
		
		// Watch'n for connection problems!
		setWatchDog: function()
		{
			this.sentinel = (function(){ this.repairConnection(); }).delay(REPAIR_WAIT, this);
		}
	});
})();