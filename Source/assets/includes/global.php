<?php
	// Begin a session on each page.
	session_start();
	
	// Protect from direct access
	if(isset($not_included) || count(get_included_files()) <= 1)
	{
		if(!isset($not_included))
		{
			$selective = true;
			include_once (!empty($_SERVER['REAL_ROOT'])?$_SERVER['REAL_ROOT']:$_SERVER['DOCUMENT_ROOT']).'/~devkey.php';
		}
		
		header('Location: ' . DG_REAL_HOST);
		exit;
	}
	
	// Includes
	require_once $root.'/assets/framework/DeveloperErrorHandler.php';
	require_once $root.'/assets/framework/Controller.php';
	require_once $root.'/assets/framework/SQLFactory.php';
	require_once $root.'/assets/framework/Browser.php';
	require_once $root.'/assets/framework/CookieInterface.php';
	require_once $root.'/assets/framework/STR.php';
	require_once $root.'/assets/framework/Time.php';
	
	define('DG_REAL_ROOT_DEFINED', $root);
	
	// Set the content type
	$data = Browser::detect();
	if($data->browser != BROWSER_IE) header('Content-Type: application/xhtml+xml');
?>