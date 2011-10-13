<?php
	/*------------------------- START COMMENT BLOCK -------------------------

	CookieInterface, by Xunamius of Dark Gray (2010).
	http://darkgray.org/devs/Xunnamius

	You are free to use this code for personal/business use as
	long as this header (this whole comment block) remains
	intact and is presented as is with no modifications.

	--------------------------- END COMMENT BLOCK ---------------------------*/
	
	/*
	 * CookieInterface Class
	 * 
	 *
	 * WARNING: This class should be instantated BEFORE any cookies
	   are set in the browser if you want to be able to reliably
	   delete said cookies using CookieInterface's delete() method!
	   Once browsers finally become standards compliant
	   (RFC 2109/RFC 2965) this won't be an issue anymore.
	 *
	 *
	 * This class acts as a common interface for PHP developers
	   who rely heavily on cookies to store important (but not
	   sensitive I hope!) data for use by their web projects.
	 *
	 * This class provides functionality to quickly and easily
	   create/modify, read, and determine the existence of
	   cookies in a client's browser through the use of the
	   class's native read()/write_raw() methods. Once a cookie
	   is written, it is _immediately_ available for use in the
	   script via the $_COOKIE superglobal.
	 *
	 * Do note that write_raw means to write a cookie normally
	   (without encryption). It is not an alias of PHP's 
	   setrawcookie function!
	 *
	 * The class also has encryption capabilities built right in
	   through the use of the generate_key() and write() methods
	   (compliments of Andrew Johnson's Cryptastic PHP class).
	   The read() method will also attempt to automatically decrypt
	   incoming cookie data on the fly, and thus SHOULD NOT be used
	   to "read" normal cookie data (unless the 'store_raw' option is
	   set to TRUE). When reading raw cookie data, use the $_COOKIE
	   superglobal instead.
	 *
	 * Conversely, when attempting to read encrypted cookie data, the
	   $_COOKIE superglobal should not be used. Use the native read()
	   method instead.
	 *
	 * Also note that write/write_raw makes use of setcookie's httponly
	   parameter. If you'd like to manipulate your cookies with
	   JavaScript or some other client side technology, make sure to
	   set the httponly parameter to FALSE when writing!
	 * 
	 * Aliases:
	 *		(none)
	 *
	 * Properties:
	 *		- Independent Interface
	 * 		- Extensible
	 *
	 * Pertinent Directives:
	 * 		- DG_ENCRYPT_COOKIE_SECRET 	(STRING) constant used to determine the mcrypt secret
	 *		- DG_ENCRYPT_COOKIE_SALT 	(STRING) constant used to determine the mcrypt salt
	 * 
	 * Class-specific Constants:
	 *		(none)
	 *
	 * Customization using the set_option() method:
	 * 		- store_raw		  (BOOL [FALSE]) determines whether or not the cookie interface
	 										 will actively support data encryption/decryption.
											 
	 *      - encryption_secret	(STRING)	 determines the encryption secret to be used.
	 										 Overrides the correlating directive if provided.
											 
	 *		- encryption_salt	(STRING)	 determines the encryption salt to be used.
	 										 Overrides the correlating directive if provided.
											 
	 *  	- search_constants (BOOL [TRUE]) determines whether or not the cookie interface
	 										 class will look for directive settings.
											 
	 *		- key			   (OBJECT)	 	 a placeholder for a mcrypt key. Can be overriden
	 										 with a custom key if necessary.
	 * 
	 * Dependencies:
	 * 		(none)
	 *
	 * Plugins:
	 * 		- DEH Class
	 *		- McryptDriver.php
	 *
	 * Audience: PHP 5.3.3
	 *
	 * Version: 1.7
	 */
	class CookieInterface
	{
		private static $cookies = array();
		private static $crypto = NULL;
		private $options = array('store_raw' => FALSE, 'encryption_secret' => NULL, 'encryption_salt' => NULL, 'search_constants' => TRUE, 'key' => NULL);
		
		/*
		 * PHP Magic Method __construct ( [ string $secret [, string $salt ]] )
		 *
		 * A custom encryption secret and salt may be set using this custom
		   constructor as well.
		 *
		 * @param String[optional] secret custom mcrypt secret
		 * @param String[optional] salt custom mcrypt salt
		 *
		 * @return nothing
		 */
		public function __construct($secret=NULL, $salt=NULL)
		{
			// Waiting for that good ol RFC 2109/RFC 2965 specification... *sigh*
			foreach($_COOKIE as $name => $value)
				self::$cookies[$name] = array('value'=>$value, 'path'=>'/', 'domain'=>NULL);
			
			if(!$this->options['store_raw'])
			{
				if(isset($secret)) $this->set_option('encryption_secret', $secret);
				else if($this->options['search_constants'] && defined('DG_ENCRYPT_COOKIE_SECRET')) $this->set_option('encryption_secret', DG_ENCRYPT_COOKIE_SECRET);
				if(isset($salt)) $this->set_option('encryption_salt', $salt);
				else if($this->options['search_constants'] && defined('DG_ENCRYPT_COOKIE_SALT')) $this->set_option('encryption_salt', DG_ENCRYPT_COOKIE_SALT);
				
				if(!class_exists('McryptDriver'))
					if(@include_once 'McryptDriver.php')
						self::$crypto = new McryptDriver;
			}
		}
		
		/* Used to manage exceptions within the CookieInterface class. */
		protected function except($msg, $lvl, $deep)
		{
			if(class_exists('DEH', FALSE)) DEH::except($msg, $lvl, $deep);
			else
			{
				$pre = '<span style="color: red; font-weight: bold;">';
				$msg = $msg.'</span>';
				if($lvl == E_USER_ERROR) die($pre.'Error: '.$msg);
				else echo $pre.'Warning: '.$msg;
			}
			
			return NULL;
		}
		
		/*
		 * public bool set_option ( string $option , mixed $data )
		 *
		 * set_option() is used to customize the CookieInterface instance
		   internally.
		 *
		 * @param String option target setting
		 * @param Mixed data new value
		 *
		 * @return Bool true/false on success/failure
		 */
		public function set_option($option, $data)
		{
			if(array_key_exists($option, $this->options))
			{
				$this->options[$option] = $data;
				return TRUE;
			}
			
			return FALSE;
		}
		
		/*
		 * public bool generate_key ( void )
		 *
		 * Generates a key internally based on the supplied encryption settings.
		 *
		 * @return Bool true/false on success/failure
		 */
		public function generate_key()
		{
			if(isset($this->options['encryption_secret'], $this->options['encryption_salt'], self::$crypto))
			{
				$this->options['key'] = self::$crypto->pbkdf2($this->options['encryption_secret'], $this->options['encryption_salt'], 50000, 32)
									 	or $this->except('Encrypted cookie creation halted. Key generation process failed.', E_USER_ERROR, 2);
				return TRUE;
			}
			
			else return FALSE;
		}
		
		/*
		 * public bool write ( string $name , string $value [, int $expire = 0 [, string $path = '/' [, string $domain [, bool $secure = FALSE [, bool $httponly = TRUE ]]]]] )
		 *
		 * Defines an ENCRYPTED cookie to be sent along with the rest of the HTTP headers.
		   For a non-encrypted writing solution, check out the write_raw() method.
		 *
		 * @param String name cookie name
		 * @param String value cookie value
		 * @param Integer[optional] expire expire time, defaults to end of session
		 * @param String[optional] path domain paths where the cookie is valid, defaults to root
		 * @param String[optional] domain domains where the cookie is valid, defaults to current
		 * @param Bool[optional] secure https only
		 * @param Bool[optional] httponly if available to client-side programming languages or not
		 *
		 * @return Bool true/false on success/failure
		 */
		public function write($name, $value, $expire=0, $path='/', $domain=NULL, $secure=FALSE, $httponly=TRUE)
		{
			if(isset($this->options['key']) && $this->options['key'] != FALSE)
			{
				
				$val = self::$crypto->encrypt($value, $this->options['key']) or $this->except('Raw (unencrypted) data cookie generated. Encryption process failed.', E_USER_WARNING, 2);
				if(isset($val)) $value = $val;
			}
			
			else $this->except('Raw (unencrypted) data cookie generated. No valid encryption key data was found.', E_USER_WARNING, 2);
			return $this->write_raw($name, $value, $expire, $path, $domain, $secure, $httponly);
		}
		
		/*
		 * public bool write_raw ( string $name , string $value [, int $expire = 0 [, string $path = '/' [, string $domain [, bool $secure = FALSE [, bool $httponly = TRUE ]]]]] )
		 *
		 * Defines a NON-ENCRYPTED cookie to be sent along with the rest of the HTTP headers.
		   For an encrypted writing solution, check out the write() method.
		 *
		 * @param String name cookie name
		 * @param String value cookie value
		 * @param Integer[optional] expire expire time, defaults to end of session
		 * @param String[optional] path domain paths where the cookie is valid, defaults to root
		 * @param String[optional] domain domains where the cookie is valid, defaults to current
		 * @param Bool[optional] secure https only
		 * @param Bool[optional] httponly if available to client-side programming languages or not
		 *
		 * @return Bool true/false on success/failure
		 */
		public function write_raw($name, $value, $expire=0, $path='/', $domain=NULL, $secure=FALSE, $httponly=TRUE)
		{
			if(@setcookie($name, $value, $expire, $path, $domain, $secure, $httponly))
			{
				$_COOKIE[$name] = $value;
				self::$cookies[$name] = array('value'=>$value, 'path'=>$path, 'domain'=>$domain);
				return TRUE;
			}
			
			else
			{
				$this->except('Failed to generate cookie. (maybe headers already sent?)', E_USER_ERROR, 2);
				return FALSE;
			}
		}
		
		/*
		 * public string read ( string $name [, bool $exists = FALSE ] )
		 *
		 * Reads the data from an encrypted cookie and returns it.
		   If encryption is disabled, this function reads data normally.
		 *
		 * @param String name cookie name
		 * @param Bool[optional] exists internal switch
		 *
		 * @return String unencrypted cookie data
		 */
		public function read($name, $exists=FALSE)
		{
			$data = (in_array($name, array_keys(self::$cookies)) ? self::$cookies[$name]['value'] : (isset($_COOKIE[$name]) ? $_COOKIE[$name] : NULL));
			
			if(!$exists && !$this->options['store_raw'] && isset($data, $this->options['key']))
				$data = self::$crypto->decrypt($data, $this->options['key']) or $this->except('Decryption process failed.', E_USER_ERROR, 2);
			
			return ($exists ? (isset($data) ? TRUE : FALSE) : $data);
		}
		
		/*
		 * public bool exists ( string $name )
		 *
		 * Determines if a cookie exists or not.
		 *
		 * @param String name cookie name
		 *
		 * @return Bool true/false on exists/not exists
		 */
		public function exists($name)
		{ return $this->read($name, TRUE); }
		
		/*
		 * public bool delete ( string $name )
		 *
		 * Attempts to delete a cookie from the browser.
		 *
		 * @param String name cookie name
		 *
		 * @return Bool true/false on success/failure
		 */
		public function delete($name)
		{
			if(in_array($name, array_keys(self::$cookies)))
			{
				$this->write_raw($name, '', time()-(3600*24*30*400), self::$cookies[$name]['path'], self::$cookies[$name]['domain'], FALSE, FALSE);
				ini_set('display_errors', 'Off');
				unset(self::$cookies[$name], $_COOKIE[$name]);
				ini_set('display_errors', 'On');
				return TRUE;
			}
			
			return FALSE;
		}
	}
	
	// Protect page from direct access
	if(count(get_included_files()) <= 1) die('<h1 style="color: red; font-weight: bold;">No.</h1>');
?>