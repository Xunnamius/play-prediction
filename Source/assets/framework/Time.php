<?php
	/*------------------------- START COMMENT BLOCK -------------------------

	Time, by Xunamius of Dark Gray (2010).
	http://darkgray.org/devs/Xunnamius

	You are free to use this code for personal/business use as
	long as this header (this whole comment block) remains
	intact and is presented as is with no modifications.

	--------------------------- END COMMENT BLOCK ---------------------------*/
	
	/*
	 * Time Class
	 * 
	 * Provides the developer with a vast array of time-related methods.
	 *
	 * Aliases:
	 *		(none)
	 *
	 * Properties:
	 *		- Independent Interface
	 *		- Instantiation Unnecessary
	 * 		- Extensible
	 *
	 * Pertinent Directives:
	 *		(none)
	 * 
	 * Class-specific Constants:
	 *		(none)
	 *
	 * Dependencies:
	 * 		(none)
	 *
	 * Plugins:
	 * 		(none)
	 *
	 * Audience: PHP 5.3.3
	 *
	 * Version: 1.0
	 */
	class Time
	{
		/* PHP Magic Method __construct() */
		private function __construct(){}
		
		/*
		 * public string relativeTime( $time )
		 *
		 * This function will calculate and return a friendly date
		   difference string based upon $time vs the current time.
		 *
		 * $time is a GM-based Unix timestamp, this makes for a timezone
		   neutral comparison =D
		 *
		 * Note: use  $timestamp = gmdate("Y-m-d H:i:s", time()); to insert
		   dates into SQL, not normal SQL timestamp server-time!
		 *
		 * @param String time unix timestamp
		 *
		 * @return String friendly date/time difference
		 */
		public static function rel_time($time)
		{   
			$delta = strtotime(gmdate('Y-m-d H:i:s', time())) - strtotime($time);
			
			if($delta < 0) return 'in the future';
			else if($delta == 0) return 'as we speak';
			else if($delta < 1 * 60) return $delta == 1 ? 'a second ago' : $delta . ' seconds ago';
			else if($delta < 2 * 60) return 'a minute ago';
			else if($delta < 45 * 60) return floor($delta / 60) . ' minutes ago';
			else if($delta < 90 * 60) return 'an hour ago';
			else if($delta < 24 * 3600) return floor($delta / 3600) . ' hours ago';
			else if($delta < 48 * 3600) return 'yesterday';
			else if($delta < 30 * 86400) return floor($delta / 86400) . ' days ago';
			else if($delta < 12 * 2592000)
			{
				$months = floor($delta / 86400 / 30);
				return $months <= 1 ? 'one month ago' : $months . ' months ago';
			}
			
			else
			{
				$years = floor($delta / 86400 / 365);
				return $years <= 1 ? 'one year ago' : $years . ' years ago';
			}
		}
		
		/*
		 * public string relativeTime( $dated )
		 *
		 * Formats a MySQL Timestamp into a nice little date.
		 *
		 * @param String dated MySQL (only) Timestamp
		 *
		 * @return String human-readable date
		 */
		public static function fmt_timestamp($dated)
		{
			return date("F j, Y @ g:ia",
				mktime(substr($dated, 11, 2),
					substr($dated, 14, 2),
					substr($dated, 17, 2),
					substr($dated, 5, 2),
					substr($dated, 8, 2),
					substr($dated, 0, 4)));
		}
	}
	
	/* Class-specific Constants */
	
	// Protect page from direct access
	if(count(get_included_files()) <= 1) die('<h1 style="color: red; font-weight: bold;">No.</h1>');
?>