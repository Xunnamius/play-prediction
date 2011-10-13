<?php
	/*------------------------- START COMMENT BLOCK -------------------------

	Browser, by Xunamius of Dark Gray (2010).
	http://darkgray.org/devs/Xunnamius

	You are free to use this code for personal/business use as
	long as this header (this whole comment block) remains
	intact and is presented as is with no modifications.

	--------------------------- END COMMENT BLOCK ---------------------------*/
	
	/*
	 * Browser Class
	 * 
	 * This class tries its best to detect what type of browser your user is using to access
	   your website.
	 *
	 * Returns an object with the following properties:
	 		-> browser: browser identification string (often the browser name)
			-> platform: OS (string)
			-> version: browser version number (float)
			-> subversion: browser subversion data (mixed array)
			-> UA: UA that was parsed (string)
			-> pattern: regexp pattern used (string)
			
			Do note that some entries within the 'subversion' array may contain non-numbers
			or illegal characters. Don't expect all integers (or if you are, make sure to
			filter() [hint hint] or typecast what is returned).
	 *
	 * This object does not require instantiation, although if it is, the object will attempt
	   to apply browser-specific patches to fix various browser shortcomings (we're looking at
	   you, IE). This can also be done by calling the static function patch().
	 *
	 * Also note that, if instantiated, one does not need to call Browser::detect() again. To
	   speed up performance, the results have already been cached, and can be retrieved using
	   typical objective syntax (i.e. $instance->version).
	 *
	 * Moreover, results are cached for all detection targets; however, only the most recent
	   result is available using direct objective syntax.
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
	 * 		- DG_BROWSER_OSLIST			(ARRAY) list of string values representing unknown OSes
	 *		- DG_BROWSER_BROWSERLIST	(ARRAY) list of string values representing unknown browsers
	 * 
	 * Class-specific Constants:
	 *		- PLATFORM_UNKNOWN
	 *		- PLATFORM_LINUX
	 *		- PLATFORM_MACINTOSH
	 *		- PLATFORM_MAC
	 *		- PLATFORM_WINDOWS
	 *		- BROWSER_UNKNOWN
	 *		- BROWSER_UNKNOWN_BOT
	 *		- BROWSER_CHROME
	 *		- BROWSER_OPERA
	 *		- BROWSER_FIREFOX
	 *		- BROWSER_FF
	 *		- BROWSER_EXPLORER
	 *		- BROWSER_IE
	 *		- BROWSER_SAFARI
	 *		- BROWSER_SEAMONKEY
	 *		- BROWSER_KONQUEROR
	 *		- BROWSER_NETSCAPE
	 *		- BROWSER_GECKO
	 *		- BROWSER_NAVIGATOR
	 *		- BROWSER_MOSAIC
	 *		- BROWSER_LYNX
	 *		- BROWSER_AMAYA
	 *		- BROWSER_OMNIWEB
	 *		- BROWSER_AVANT
	 *		- BROWSER_CAMINO
	 *		- BROWSER_FLOCK
	 *		- BROWSER_AOL
	 *
	 * Dependencies:
	 * 		(none)
	 *
	 * Plugins:
	 * 		(none)
	 *
	 * Audience: PHP 5.3.3
	 *
	 * Version: 1.3
	 */
	class Browser
	{
		// Result Object Cache
		private static $_cache = array();
		private static $prop_UA = NULL;
		
		/*
		 * PHP Magic Method __construct()
		 *
		 * Only create an instance of this object if you want this script to automatically
		   attempt to fight against various browser bugs (mainly IE browser bugs).
		 *
		 * Therefore, if this is the goal, this class should be initialized at the very
		   beginning of your script AFTER your HTML <head> element has been output (if
		   you're using a controller, it must be initialized within the controller's scope
		   of course).
		 */
		public function __construct()
		{ $this->patch(); }
		
		/* PHP Magic Method __get() */
		public function __get($property)
		{ return (self::$_cache[self::$prop_UA]->$property); }
		
		/*
		 * public static void patch()
		 *
		 * Automatically attempts to fight against various browser bugs
		   (mainly IE browser bugs) by injecting patch code between
		   includes.
		 */
		public static function patch()
		{
			$data = self::detect();
			
			/* Disallows the horizontal spanning of textarea elements (which screws up layout) */
			if(in_array($data->browser,
			   array(BROWSER_CHROME, BROWSER_SAFARI)))
			{
				echo '<style type="text/css"> textarea{ resize: vertical; } </style>';
			}
			
			/* Fixes: Various IE5-8 layout and positioning bugs */
			if($data->browser == BROWSER_IE)
			{
				echo '<style type="text/css">* { zoom: 1; }</style>';
			}
			
			// More fixes to be added in subsequent versions!
		}
		
		/*
		 * public static object detect ( [ string $target ] )
		 *
		 * Parses $target (or $_SERVER['HTTP_USER_AGENT'] if $target is NULL) and
		   returns an object containing the information that has been retrieved.
		 *
		 * @param String[optional] target a valid USER AGENT string
		 *
		 * @return Object user/browser information
		 */
		public static function detect($target=NULL)
		{	
			$target = is_string($target) ? $target : $_SERVER['HTTP_USER_AGENT'];
			self::$prop_UA = $target;
			if(array_key_exists($target, self::$_cache)) return self::$_cache[$target];
			$return = (object) array('browser'=>BROWSER_UNKNOWN, 'platform'=>PLATFORM_UNKNOWN, 'version'=>NULL, 'subversion'=>NULL, 'UA'=>$target, 'pattern'=>'');
			$other_OSes = defined('DG_BROWSER_OSLIST') && is_array(DG_BROWSER_OSLIST) ? DG_BROWSER_OSLIST : NULL;
			$other_BROWSERs = defined('DG_BROWSER_BROWSERLIST') && is_array(DG_BROWSER_BROWSERLIST) ? DG_BROWSER_BROWSERLIST : NULL;
			
			// Platform (order is kinda important here)
			if(preg_match('/linux/i', $target)) $return->platform = PLATFORM_LINUX;
			elseif(preg_match('/macintosh|mac os x/i', $target)) $return->platform = PLATFORM_MACINTOSH;
			elseif(preg_match('/windows|win32/i', $target)) $return->platform = PLATFORM_WINDOWS;
			
			else if($other_OSes)
			{
				foreach($other_OSes as $os)
				{
					if(preg_match('/'.$os.'/i', $target))
					{
						$return->platform = (string) $os;
						break;
					}
				}
			}
			
			// Browser (procedure order here is VERY VERY important)
			if(preg_match('/'.BROWSER_EXPLORER.'/i', $target) && !preg_match('/'.BROWSER_OPERA.'/i', $target))
				$return->browser = BROWSER_EXPLORER;
			elseif(preg_match('/'.BROWSER_FIREFOX.'/i', $target)) $return->browser = BROWSER_FIREFOX;
			elseif(preg_match('/'.BROWSER_CHROME.'/i', $target)) $return->browser = BROWSER_CHROME;
			elseif(preg_match('/'.BROWSER_SAFARI.'/i', $target)) $return->browser = BROWSER_SAFARI;
			elseif(preg_match('/'.BROWSER_OPERA.'/i', $target)) $return->browser = BROWSER_OPERA;
			elseif(preg_match('/'.BROWSER_SEAMONKEY.'/i', $target)) $return->browser = BROWSER_SEAMONKEY;
			elseif(preg_match('/'.BROWSER_KONQUEROR.'/i', $target)) $return->browser = BROWSER_KONQUEROR;
			elseif(preg_match('/'.BROWSER_NETSCAPE.'/i', $target)) $return->browser = BROWSER_NETSCAPE;
			elseif(preg_match('/'.BROWSER_GECKO.'/i', $target)) $return->browser = BROWSER_GECKO;
			elseif(preg_match('/'.BROWSER_NAVIGATOR.'/i', $target)) $return->browser = BROWSER_NAVIGATOR;
			elseif(preg_match('/'.BROWSER_MOSAIC.'/i', $target)) $return->browser = BROWSER_MOSAIC;
			elseif(preg_match('/'.BROWSER_LYNX.'/i', $target)) $return->browser = BROWSER_LYNX;
			elseif(preg_match('/'.BROWSER_AMAYA.'/i', $target)) $return->browser = BROWSER_AMAYA;
			elseif(preg_match('/'.BROWSER_OMNIWEB.'/i', $target)) $return->browser = BROWSER_OMNIWEB;
			elseif(preg_match('/'.BROWSER_AVANT.'/i', $target)) $return->browser = BROWSER_AVANT;
			elseif(preg_match('/'.BROWSER_CAMINO.'/i', $target)) $return->browser = BROWSER_CAMINO;
			elseif(preg_match('/'.BROWSER_FLOCK.'/i', $target)) $return->browser = BROWSER_FLOCK;
			elseif(preg_match('/'.BROWSER_AOL.'/i', $target)) $return->browser = BROWSER_AOL;
			
			else if($other_BROWSERs)
			{
				foreach($other_BROWSERs as $browser)
				{
					if(preg_match('/'.$browser.'/i', $target))
					{
						$return->browser = (string) $browser;
						break;
					}
				}
			}
			
			if(!$return->browser)
				if(preg_match('/bot/i', $target))
					$return->browser = BROWSER_UNKNOWN_BOT;
			
			// Version #
			if($return->browser == BROWSER_UNKNOWN_BOT) $pattern = '#(?<browser>\b[^/ ]*bot[^/ ]*\b)[/ ]+(?<version>[0-9.|a-zA-Z.]*)#i';
			else $pattern = '#(?<browser>'.join('|', array('Version', $return->browser, 'other')).')[/ -]+(?<version>[0-9.|a-zA-Z.]*)#i';
			
			$return->pattern = $pattern;
			if(preg_match_all($pattern, $target, $matches))
			{
				$i = count($matches['browser']);
				
				// We have two probable version numbers.
				// We'll take the one that's most likely our target version number!
				if($i == 1) $return->version = $matches['version'][0];
				else
				{
					if(strripos($target, 'Version') < strripos($target, $return->browser)) $return->version = $matches['version'][0];
					else $return->version = $matches['version'][1];
				}
			}
			
			$return->subversion = explode('.', $return->version);
			$return->version = (float) $return->version;
			self::$_cache[$target] = $return;
			return $return;
		}
	}
	
	/* Class-specific Constants */
	define('BROWSER_UNKNOWN', NULL); // Unknown Browser
	define('PLATFORM_UNKNOWN', NULL); // Unknown OS
	
	// S-Rank Browsers
	define('BROWSER_CHROME', 'Chrome'); // Chrome
	define('BROWSER_OPERA', 'Opera'); // Opera
	
	// A-Rank Browsers
	define('BROWSER_FIREFOX', 'Firefox'); // FF
	define('BROWSER_FF', 'Firefox'); // FF
	define('BROWSER_EXPLORER', 'MSIE'); // IE
	define('BROWSER_IE', 'MSIE'); // Alias of Explorer
	define('BROWSER_SAFARI', 'Safari'); // Safari
	
	// B-Rank Browsers
	define('BROWSER_SEAMONKEY', 'Seamonkey'); // Seamonkey
	define('BROWSER_KONQUEROR', 'Konqueror'); // Konqueror
	
	// C-Rank Browsers
	define('BROWSER_NETSCAPE', 'Netscape'); // Netscape
	
	// D-Rank Browsers
	define('BROWSER_GECKO', 'Gecko');
	define('BROWSER_NAVIGATOR', 'Navigator');
	
	// E-Rank Browsers
	define('BROWSER_MOSAIC', 'Mosaic');
	define('BROWSER_LYNX', 'Lynx');
	define('BROWSER_AMAYA', 'Amaya');
	
	// F-Rank Browsers
	define('BROWSER_OMNIWEB', 'Omniweb');
	define('BROWSER_AVANT', 'Avant');
	define('BROWSER_CAMINO', 'Camino');
	define('BROWSER_FLOCK', 'Flock');
	define('BROWSER_AOL', 'Aol');
	
	// Bots
	define('BROWSER_UNKNOWN_BOT', 'Unknown Robot/Crawler');
	
	// Platforms
	define('PLATFORM_LINUX', 'Linux'); // Linux
	define('PLATFORM_MACINTOSH', 'Macintosh'); // Macintosh
	define('PLATFORM_MAC', 'Macintosh'); // Alias of Macintosh
	define('PLATFORM_WINDOWS', 'Windows'); // Windows
	
	// Protect page from direct access
	if(count(get_included_files()) <= 1) die('<h1 style="color: red; font-weight: bold;">No.</h1>');
?>