(function()
{
	window.addEvent('domready', function()
	{
		// Connect to the APE
		var client = new APE.Client(), hashNav = new HashNav(),
		
		// Create a new instance of the APE.Console class
		// We'll be using this object to start things off around here...
		apeConsole = new APE.Console({
			verbose: false, // :DEBUG:
			
			apeClient: client,
			
			identifier: 'playprediction',
			username: PHP_username,
			channels: ['admin_console', 'user_application'],
			
			console: 		$('log_content'),
			consoleEmptyP: 	$('log_tail_empty'),
			
			load: function()
			{
				this.options.sessid = this.options.sessid || Cookie.read('PHPSESSID') || null;
				
				if(this.ape.core.options.restore)
				{
					this.log('Attempting to resume core session [', this.options.sessid, ']...');
					this.ape.core.start(); // Ask the APE Server for a user session
				}
				
                else
				{
					this.log('Starting core [', this.options.sessid, ']...');
					this.ape.core.start({ 'PHP_sess_id': this.options.sessid, 'PHP_username': PHP_username /* TODO: no seriously, replace this with a serverside mysql data grab using the sessid */ }); // It's not a session restoration!
				}
				
				if(this.verbose) console.info('(load: ', arguments, ')');
			},
			
			ready: function()
			{
				this.log('Joining multipipe channel(s):', this.quote(this.options.channels.toString()), '...');
				this.ape.core.join(this.options.channels);
				if(this.verbose) console.info('(ready: ', arguments, ')');
			},
			
			start: function()
			{
				if(this.options.identifier)
					this.ape.load({ 'identifier': this.options.identifier });
			}
		}),
		
		unlockConsole = function()
		{
			var submt = function()
			{
				apeConsole.parseInput(this.getProperty('value'));
				this.setProperty('value', '');
			};
			
			// Console's input box (up key, down key, enter button)
			$('text_cmd').addEvent('keydown', function(e)
			{
				if(['enter', 'up', 'down'].contains(e.key))
				{
					e.stop();
					//this.store('typed', false);
					if(e.key == 'enter') submt.call(this);
					
					else if(e.key == 'up')
					{
						var input = apeConsole.recallInput('+');
						if(input) this.setProperty('value', input);
					}
					
					else if(e.key == 'down')
					{
						var input = apeConsole.recallInput('-');
						if(input) this.setProperty('value', input);
					}
				}
				
				else apeConsole.cmdHistory[0] = 0;
			});
			
			/* Console buttons (enable them too) */
			
			$('button_send').addEvent('click', function(e)
			{
				e.stop();
				submt.call($('text_cmd'));
			});
			
			$('button_clear').addEvent('click', function(e)
			{
				e.stop();
				apeConsole.clear();
			});
			
			$('button_toggle').addEvent('click', function(e)
			{
				e.stop();
				apeConsole.toggle();
				if(this.retrieve('toggle')) this.setProperty('value', 'Stop');
				else this.setProperty('value', 'Start');
				this.store('toggle', !this.retrieve('toggle'));
			});
			
			$('text_cmd').setProperty('disabled', false);
			$('button_send').setProperty('disabled', false);
			$('button_clear').setProperty('disabled', false);
			$('button_toggle').setProperty('disabled', false);
			
			$('text_cmd').addEvent('blur', function(){ if(!this.getProperty('value')) apeConsole.cmdHistory[0] = 0; });
			$('log_tail_empty').set('text', '[Empty Console]');
		};
		
		apeConsole.addEvent('enable', unlockConsole);
		apeConsole.addEvent('repairFailed', unlockConsole);
		
		// TODO: when we decouple apeConsole, make sure this is an event system and it works as expected
		// TODO: when 'STOP'/'START' is called, also stop/start this
		var createPeriod = function(){ return (function()
		{
			// Flush the stack before sending another one of these!
			apeConsole.ape.core.request.cycledStack.send();
			apeConsole.sendCMD('STATUS_LOAD'); }).periodical(5000);
		};
		
		// TODO: when decoupled, take this shit outside of the apeConsole object damnit.
		apeConsole.addEvent('disconnect', function()
		{
			clearInterval(this.period);
			this.period = -1;
		});
		
		// TODO: Fuck all of this stupid shit. Make it better.
		apeConsole.addEvent('reconnect', function()
		{
			if(this.period === -1) this.period = createPeriod();
		});
		
		// TODO: not only should this be an event, but create a "global object" within the console that can hold things!
		apeConsole.addEvent('online', function()
		{
			if(this.period === -1)
			{
				this.period = createPeriod();
				this.sendCMD('PHASE', { method: 'GET' });
			}
		});
		
		$('lol1').addEvent('click', function(e)
		{
			var oldObj = $$('.body.active')[0], newObj = $$('#dashboard.body')[0];
			if(oldObj) oldObj.removeClass('active');
			if(newObj) newObj.addClass('active');
		});
		
		$('lol2').addEvent('click', function(e)
		{
			var oldObj = $$('.body.active')[0], newObj = $$('#phase_manager.body')[0];
			if(oldObj) oldObj.removeClass('active');
			if(newObj) newObj.addClass('active');
		});
		
		// TODO: FIX THIS FUCKING SHIT
		hashNav.registerObserver('anchorwatcher', { page: true, params: {} }, function(e)
		{
			console.log('hi');
			var oldObj = $$('.body.active')[0], newObj = $$('.body.'+this.getCurrent())[0];
			if(oldObj) oldObj.removeClass('active');
			if(newObj) newObj.addClass('active');
		});
		
		hashNav.triggerEvent();
		
		$('button_preparation').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('PHASE', { method: '_UPDATE', newphase: 'preparation' });
		});
		
		$('button_polling').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('PHASE', { method: '_UPDATE', newphase: 'polling' });
		});
		
		$('button_judgement').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('PHASE', { method: '_UPDATE', newphase: 'judgement' });
		});
		
		$('button_waiting').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('PHASE', { method: '_UPDATE', newphase: 'waiting' });
		});
		
		$('button_away').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('PHASE', { method: '_UPDATE', newphase: 'away' });
		});
		
		$('button_standby').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('PHASE', { method: '_UPDATE', newphase: 'standby' });
		});
		
		/* Others... god I'm so tired */
		
		$('button_RL').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'RL' });
		});
		
		$('button_RM').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'RM' });
		});
		
		$('button_RR').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'RR' });
		});
		
		$('button_PL').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'PL' });
		});
		
		$('button_PM').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'PM' });
		});
		
		$('button_PR').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'PR' });
		});
		
		$('button_PU').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'PU' });
		});
		
		$('button_FG').addEvent('click', function(e)
		{
			e.stop();
			apeConsole.sendCMD('JUDGEMENT', { judgement: 'FG' });
		});
		
	});
})();