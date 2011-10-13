/*
---
description: A nifty little "viewport shifter" class made in JavaScript using MooTools 1.3.

license: MIT-style license

authors:
- Xunnamius

requires:
- core/1.3.2

provides: [ViewManager]
...
*/

/* documentation and updates @ http://github.com/Xunnamius/ViewManager */
(function() // Private
{
	var Version = 1.2;
	
	this.ViewManager = new Class(
	{
		Implements: Chain,
		
		initialize: function(innerWrapper, screenContainer)
		{
			this.iw = innerWrapper || $('inner_wrapper');
			this.container = $('screen_container') || screenContainer;
			this.iw.setStyles({ top: 0, left: 0 });
			
			// Only one element should be a child of the inner element. That is our active element!
			this.active = this.iw.getChildren()[0];
			this.iw.set('tween', { duration: 375, transition: 'sine:out', link: 'cancel' });
		},
		
		/* TODO: optimize these methods -- remove redundancy! */
		
		// Shifts the viewport right
		// target_id can be an ID or an element (reference)
		shiftRight: function(target_id)
		{
			var original = this.iw.getSize();
			target_id = $(target_id) || $(target_id[0]) || target_id[0] || target_id;
			console.warn(target_id, target_id.getParent(), this.container, this.container.match(target_id.getParent()));
			if(this.container.match(target_id.getParent()))
			{
				// Expand iw to be twice its current width
				this.iw.setStyle('width', original.x*2);
				
				// add new content from the container
				target_id.dispose().inject(this.iw);
				
				// morph iw: top -> original width, then reset
				this.iw.get('tween').
				start('left', -original.x).
				chain(function()
				{
					if(this.active) this.active.dispose().inject(this.container);
					this.active = target_id;
					this.iw.setStyles({ width: original.x, left: 0 });
					
					while(this.callChain());
					return this;
				}.bind(this));
			}
			
			else throw 'ViewManager received an invalid target_id "'+target_id+'" (not a direct descendant of the container?)';
		},
		
		// Shifts the viewport left
		shiftLeft: function(target_id)
		{
			var original = this.iw.getSize();
			target_id = $(target_id) || $(target_id[0]) || target_id[0] || target_id;
			
			if(this.container.match(target_id.getParent()))
			{
				// Expand iw to be twice its current width
				this.iw.setStyle('width', original.x*2);
				
				// add new content from the container
				target_id.dispose().inject(this.iw, 'top');
				this.iw.setStyle('left', -original.x);
			
				this.iw.get('tween').
				start('left', 0).
				chain(function()
				{
					if(this.active) this.active.dispose().inject(this.container);
					this.active = target_id;
					this.iw.setStyle('width', original.x);
					
					while(this.callChain());
					return this;
				}.bind(this));
			}
				
			else throw 'ViewManager received an invalid target_id "'+target_id+'" (not a direct descendant of the container?)';
		},
		
		// Shifts the viewport downwards
		shiftDown: function(target_id)
		{
			var original = this.iw.getSize();
			target_id = $(target_id) || $(target_id[0]) || target_id[0] || target_id;
			
			if(this.container.match(target_id.getParent()))
			{
				// Expand iw to be twice its current height
				this.iw.setStyle('height', original.y*2);
				
				// add new content from the container
				target_id.dispose().inject(this.iw);
				
				// morph iw: top -> original height, then reset
				this.iw.get('tween').
				start('top', -original.y).
				chain(function()
				{
					if(this.active) this.active.dispose().inject(this.container);
					this.active = target_id;
					this.iw.setStyles({ height: original.y, top: 0 });
					
					while(this.callChain());
					return this;
				}.bind(this));
			}
			
			else throw 'ViewManager received an invalid target_id "'+target_id+'" (not a direct descendant of the container?)';
		},
		
		// Shifts the viewport upwards
		shiftUp: function(target_id)
		{
			var original = this.iw.getSize();
			target_id = $(target_id) || $(target_id[0]) || target_id[0] || target_id;
			
			if(this.container.match(target_id.getParent()))
			{
				// Expand iw to be twice its current height
				this.iw.setStyle('height', original.y*2);
				
				// add new content from the container
				target_id.dispose().inject(this.iw, 'top');
				this.iw.setStyle('top', -original.y);
			
				this.iw.get('tween').
				start('top', 0).
				chain(function()
				{
					if(this.active) this.active.dispose().inject(this.container);
					this.active = target_id;
					this.iw.setStyle('height', original.y);
					
					while(this.callChain());
					return this;
				}.bind(this));
			}
				
			else throw 'ViewManager received an invalid target_id "'+target_id+'" (not a direct descendant of the container?)';
		},
		
		// Shifts the viewport randomly
		shift: function(target_id)
		{
			var rand = Number.random(0, 100);
			
			if(rand >= 75) rand = this.shiftUp(target_id);
			else if(rand >= 50) rand = this.shiftRight(target_id);
			else if(rand >= 25) rand = this.shiftDown(target_id);
			else rand = this.shiftLeft(target_id);
			
			return rand;
		},
		
		// Cancels the current animation and any chained functions
		//* Added in 1.2
		cancel: function()
		{
			this.iw.get('tween').cancel();
			this.clearChain();
		}
	});
})();