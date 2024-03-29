/*
---
description: A class to represent a range of values, inspired by Ruby's Range class.
license: LGPL
authors:
- Michael Ficarra
requires:
- core/1.2.4:Core
- core/1.2.4:Array
- core/1.2.4:Class
- core/1.2.4:Class.Extras
- range/0.1:Number.Comparable
- range/0.1:String.Comparable
provides: [Range]
...
*/

var Range = new Class({
	Implements: Options,
	options: {
		inclusive: true,
		nextMethod: null
	},
	initialize: function(begin,end,options) {
		this.begin = begin;
		this.end = end || end === 0 ? end : begin;
		this.options.nextMethod = this.begin.next || Function.from(end || end === 0 ? end : begin);
		this.setOptions(options||{});
		return this;
	},
	first: function(){ return this.begin; },
	last: function(){ return this.end; },
	toArray: function(){
		var currentValue=this.begin;
		this.internalArray=[];
		do {
			this.internalArray.push(currentValue);
			currentValue=this.options.nextMethod.call(currentValue);
		} while(this.end.compare(currentValue) >= (this.options.inclusive ? 0 : 1));
		this.toArray = Function.from(this.internalArray);
		return this.toArray();
	},
	each: function(fn,bind){
		if(typeof(this.internalArray) != 'undefined') return this.internalArray.each(fn,bind);
		var index=0, currentValue=this.begin;
		do {
			fn.call(bind,currentValue,index++,this);
			currentValue=this.options.nextMethod.call(currentValue);
		} while(this.end.compare(currentValue) >= (this.options.inclusive ? 0 : 1));
		return this;
	},
	step: function(step,fn,bind){
		if(step < 1) return;
		this.each(function(currentValue,index,range){
			if((index % step)==0) fn.call(bind,currentValue,index/step,range)
		},bind);
	},
	contains: function(val){
		return this.begin.compare(val) < 1 && this.end.compare(val) >= (this.options.inclusive ? 0 : 1);
	},
	valueAt: function(index){
		if(typeof(this.internalArray) != 'undefined' || index<0) {
			var arr = this.toArray();
			if(index.abs()>arr.length) return null;
			return this.toArray().slice(index)[0];
		}
		var i=0, currentValue=this.begin;
		for(var i=0; i<index; i++){
			currentValue = this.options.nextMethod.call(currentValue);
			if(this.end.compare(currentValue)<(this.options.inclusive ? 0 : 1)) return null;
		};
		return currentValue;
	},
	equals: function(range){
		return (
			range.end == this.end
			&& range.begin == this.begin
			&& range.options.inclusive == this.options.inclusive
			&& range.options.nextMethod.toString() == this.options.nextMethod.toString()
		);
	},
	toString: function(){ return '('+this.begin.toString()+(this.options.inclusive ? '..' : '...')+this.end.toString()+')'; }
});

/* Copyright 2010 Michael Ficarra
This program is distributed under the (very open)
terms of the GNU Lesser General Public License */
