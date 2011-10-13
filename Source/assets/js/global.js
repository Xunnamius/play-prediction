// (c) Copyright 2011+ Dark Gray. All Rights Reserved.
// Revamped in 2011 by Xunnamius of Dark Gray. Go MooTools!

// Start things off...
(function(){
	
	/**
	 *
	 * Constants and Environment Variables
	 *
	**/
	var CONSOLE_ERROR = typeof(console) != 'undefined' && typeof(console.error) == 'function',
		CONSOLE_WARN = typeof(console) != 'undefined' && typeof(console.warn)  == 'function',
		CONSOLE_INFO = typeof(console) != 'undefined' && typeof(console.info)  == 'function',
		CONSOLE_LOG = typeof(console) != 'undefined' && typeof(console.log)  == 'function',
		
		// TODO: This should be coming from mysql runtime data, NOT hard coded!
		PHASES = ['polling', 'judgment', 'waiting'],
		SPECIAL_PHASES = ['preparation', 'away', 'standby'],
		
		// Class instantiations (to be initialized later)
		viewport, ape, user,
		
		// Displays error messages to the user
		displayMessage = function(targetScreen, msg)
		{
			console.log(targetScreen);
			targetScreen.getChildren('p')[0].set('text', msg);
			viewport.shift(targetScreen);
		},
		
		// AJAX REST API
		RESTAPI =
		{
			object:
			{
				url: PHP_realHost+'restapi/',
				method: 'post',
				link: 'ignore',
				timeout: 60000,
				noCache: true,
				secure: true,
				errorDisplayObject: null, // Be sure to set this yourself!
				
				onError: function(response, error)
				{
					// Report error to user
					displayMessage(errorDisplayObject, 'There was a problem understanding the server. Please report this error!');
					if(CONSOLE_ERROR) console.error(error, ' -> ', response);
				},
				
				onFailure: function(xhr)
				{
					// Report failure to user
					displayMessage(errorDisplayObject, 'Your request has failed. Please try again!');
					if(CONSOLE_ERROR) console.error(xhr);
				},
				
				onException: function(header, value)
				{
					// Report exception to user
					displayMessage(errorDisplayObject, 'Woah. Something weird happened, sorry about that. Please, refresh the page.');
					if(CONSOLE_ERROR) console.error(header, ' >> ', value);
				},
				
				onTimeout: function()
				{
					// Tell the user that their request has timed out!
					displayMessage(errorDisplayObject, 'It\s taking longer than we expected to connect to our servers. Please refresh the page and try again.');
					if(CONSOLE_ERROR) console.error('[ Your request has timed out! Please reload the page. ]');
					this.cancel();
				}
			},
			
			request: {}
		};
	
	// JSON AJAX-request wrapper
	Request.JSON.wrapper = function(errorDisplayObject, mux){ return new Request.JSON(Object.merge(RESTAPI.object, { onSuccess: mux, 'errorDisplayObject': errorDisplayObject })); };
		
	/**
	 *
	 * RESTAPI request Objects
	 *
	**/
	
	// Initiates a connection with the PHP/MySQL server, grabs data, makes connections
	RESTAPI.request.connect = function()
	{
		// Handshake with PHP, TODO: grab login info, all the quick stuff, etc.
		var dispObject = $('display2_screen');
		Request.JSON.wrapper(dispObject, function(response)
		{
			if(response && response['status'] == 'ready')
			{
				RESTAPI.request.init();
			}
			
			else displayMessage(dispObject, 'An unexpected error occured. Please refresh the page!'); // Error out
		}).send('rapi=1&req=connect');
	};
	
	// Asks the user for his or her orientation, and then brings said user to the appropriate window (whatever that may be at the moment)
	RESTAPI.request.init = function()
	{
		viewport.chain(function()
		{
			// Handshake with PHP
			var dispObject = $('display_screen');
			Request.JSON.wrapper(dispObject, function(response)
			{
				if(response)
				{
					// At this point, we "have" all the data we want, and we know we're connected to our servers. Yay!
					// TODO: do all the storage and what not here
					if(CONSOLE_INFO) console.info('Data:', response);
					
					// TODO: Grab our PHP session data. We'll be needing it!
					var phpsessid = Cookie.read('PHPSESSID'),
					
					// Handshake with APE (via the APE.User class) TODO: WITH REAL DATA DAMNIT
					usernameThatCameFromPHP = 'Anonymous'; /* TODO: logic here to provide username if it is available */
					
					user = new APE.User({
						apeClient: ape,
						channels: 'user_application',
						identifier: 'playprediction',
						phpsessid: phpsessid,
						username: usernameThatCameFromPHP,
						
						// Object that is passed in to APE's "start()" method
						startObj: {
							'PHP_sess_id': phpsessid,
							'PHP_username': usernameThatCameFromPHP,
						},
						
						// Allows for the construction of custom data objects to be sent along with EVERY request.
						// Must return the new object (the current object is passed in by default)!
						makeDataObject: function(item)
						{ return Object.merge(item, { 'phpsessid': phpsessid }, this.global.cmdObject); }
					});
					
					// TODO: do something about this, it may cause problems later
					user.addEvent('servDisconnect', function(){ displayMessage(dispObject, 'You have been disconnected from the server!'); });
					user.addEvent('chanDisconnect', function(){ displayMessage(dispObject, 'You have been disconnected from the game!'); });
					user.addEvent('modified', function(newUsername)
					{
						this.options.username = newUsername;
						this.anon = true;
						alert('Hello '+newUsername+'.\nYou are playing as an anonymous user! Your data is not being saved!\n\n(Replace this popup with a nice JS popup)');
					});
					
					// For the show stoppers. Be sure to clean up the screen if you plan on leaving the app intact :P
					user.addEvent('error', function(errorName, errorID)
					{
						var dispObject = $('display3_screen');
						if(CONSOLE_ERROR) console.error('APE error: ('+errorID+')', errorName);
						
						// Bad apesessid
						if(errorID == '004')
							displayMessage(dispObject, 'Your session has timed out. Please refresh the page.');
						else if(errorID != '100') displayMessage(dispObject, 'Error: "'+errorName+'" ('+errorID+')');
					});
					
					user.addEvent('apeready', function()
					{
						// Move along...
						RESTAPI.request.orient();
					});
				}
				
				else displayMessage(dispObject, 'An unexpected error occured. Please refresh the page!'); // Error out
			}).send('rapi=1&req=init');
		}).shiftLeft('display2_screen');
	};
	
	RESTAPI.request.orient = function()
	{
		// Home & Away buttons
		viewport.shiftRight('orientation_screen');
	};
	
	var turn = true;
	// Handles any phase shifts
	RESTAPI.request.shift = function(phase)
	{
		if(PHASES.combine(SPECIAL_PHASES).contains(phase))
		{
			if(turn) dispObject = $('display2_screen');
			else	 dispObject = $('display_screen');
			
			if(SPECIAL_PHASES.contains(phase))
			{
				if(phase == SPECIAL_PHASES[2])
				{
					displayMessage(dispObject, 'Sorry, no game is playing at the moment.');
				}
				
				else if(phase == SPECIAL_PHASES[1])
				{
					displayMessage(dispObject, 'Oh no! We are experiencing technical difficulties!');
				}
				
				else if(phase == SPECIAL_PHASES[0]) // phase == 'preparation'
				{
					displayMessage(dispObject, 'The next game starts in [BIG BOLD INTEGER X] seconds!');
				}
				
				turn = !turn;
				return;
			}
			
			else
			{
				if(phase == PHASES[0])
				{
					viewport.shiftDown($('play_screen'));
					return;
				}
				
				else if(phase == PHASES[1])
				{
					dispObject.set('text', 'Judging the play...');
					viewport.shiftUp(dispObject);
					turn = !turn;
					return;
				}
				
				else if(phase == PHASES[2])
				{
					dispObject.set('text', '[YOUR SCORE HERE]');
					viewport.shift(dispObject);
					turn = !turn;
					return;
				}
			}
		}
		
		displayMessage(dispObject, 'Woah! An unexpected error occured. Please refresh the page.'); // Error out
	};
	
	window.addEvent('domready', function()
	{
		/**
		 *
		 * Initialize our Environment
		 *
		**/
		
		// Handles the animation behind the target view's movement
		// into focus and the current view's movement out of focus
		viewport = new ViewManager();
		ape = new APE.Client();
		
		// Event delegation paradigm
		$('inner_wrapper').addEvent('click:relay(input.button)', function(e, target)
		{
			e.stop();
			var tid = target.getProperty('id'); // Target ID
			
			if(!user.global.orientation && ['home', 'away'].contains(tid))
			{
				// TODO: switch this and a buncha other things over to serverside (instead of sending by way of CS... eww)
				user.global.cmdObject.orientation = tid;
				
				// Set up the APE phase shifter
				user.addRawEvent(['PHASE_GET', 'PHASE_SHIFT'], true, function(response)
				{ RESTAPI.request.shift(response.data.phase); });
				
				user.addRawEvent('JUDGEMENT', true, function(response)
				{
					if(user.global.answer == response.data.correct)
					{
						alert('You guessed correctly! 1 point for you!');
						user.global.answer = null;
						user.global.points = user.global.points + 1;
					}
					
					else alert('You guessed wrong, no points for you.');
				});
				
				user.sendCMD('PHASE', { method: 'GET' });
			}
			
			else if(target.hasClass('play_screen'))
			{
				user.global.answer = target.getProperty('id').substr(7);
				alert('You chose: '+user.global.answer+'. You currently have '+user.global.points+' points.');
			}
		});
		
		// Kick-off
		RESTAPI.request.connect();
	});
})();