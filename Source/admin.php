<?php
	$root = (!empty($_SERVER['REAL_ROOT'])?$_SERVER['REAL_ROOT']:$_SERVER['DOCUMENT_ROOT']);
	require_once $root.'/~devkey.php';
?>
<?php
	/*
	
	PHP + xHTML 1.1  Document
	
	Programming on the internet the way it was meant to be done.
	
	By (your name here nic)
	
	Do not remove this header when stealing this code, thanks.
	
	*/
	
	class Abawss extends Controller
	{
		protected function run_AJAX(){}
		protected function run()
		{
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">

<!--
eXtensible Hypertext Markup Language Document

Programming on the internet the way it was meant to be done.

By (your name here nic)

Do not remove this header.
-->

<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
        <title>Predict The Play - Admin Interface - V.0.7</title>
        
        <meta name="Robots" content="index, follow, archive" />
		<meta name="Language" content="en-us" />
        
        <?php
			Browser::patch();
			$data = Browser::detect();
			
			if($data->browser == BROWSER_CHROME)
				echo '<style type="text/css">.pop, .notice { width: 99.8%; }</style>';
		?>
        
        <link rel="stylesheet" type="text/css" href="/assets/css/reset_v1.2.3.css?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/css/reset_v1.2.3.css'); ?>" />
        <link rel="stylesheet" type="text/css" href="/assets/css/popnotice.css?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/css/popnotice.css'); ?>" />
        <link rel="stylesheet" type="text/css" href="/assets/css/admin.css?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/css/admin.css'); ?>" media="all" />
        
        <!-- This script is for variables exposed by the server for AJAX's convenience -->
        <script type="text/javascript">
		/* <![CDATA[ */
			PHP_browser = '<?php echo $data->browser; ?>';
			PHP_currentDir = '<?php echo DG_CURRENT_DIR; ?>';
			PHP_realHost = '<?php echo DG_REAL_HOST; ?>';
			PHP_isDebugMode = <?php echo DG_DEBUG_MODE?1:0; ?>;
			PHP_username = 'Xunnamius'; // TODO: grab the username from the server instead! This method is just stupid.
		/* ]]> */
		</script>
    </head>
    
    <body>
    	<?php
        	//if(DG_DEBUG_MODE) echo '<p class="pop failure">DG_DEBUG_MODE=1</p>';
        	//if(DG_MAINTENANCE_MODE) echo '<p class="pop warning">We\'re undergoing routine maintenance, so some features may not be working properly!</p>';
		?>
    	<!--[if lt IE 9]>
        	<p class="pop failure" id="BADIE">You're using a dead version of Internet Explorer! It is recommended that you <a href="http://www.microsoft.com/windows/internet-explorer/default.aspx" title="FWD: Internet Explorer homepage" rel="external">update your browser</a> as soon as possible.</p>
        <![endif]-->
        <?php if($data->browser == BROWSER_FF && $data->version < 4) echo '<p class="pop failure">You\'re using an old version of Firefox! It is recommended that you <a href="http://firefox.com" title="FWD: Firefox homepage" rel="external">update</a> as soon as possible.</p>'; ?>
        <noscript><p class="pop failure">It is recommended that you <a href="https://www.google.com/support/adsense/bin/answer.py?hl=en&amp;answer=12654" title="FWD: Google JSA Instructions" rel="external">enable JavaScript</a>!</p></noscript>
        
        <div id="header">
            <h1>Admin Interface</h1>
            <ol id="nav">
                <li><a id="lol1" href="#!/dashboard" class="active">Dashboard</a></li>
                <li>|</li>
                <li><a id="lol2" href="#!/phase_manager">Phase Manager</a></li>
                <li>|</li>
                <li><a href="#!/access_restrictions">Access Restrictions</a></li>
                <li>|</li>
                <li><a href="#!/administration">Administration</a></li>
                <li>|</li>
                <li><a href="#!/status">Status</a></li>
            </ol>
            <p>Welcome [ <a href="#!/administration"><?php echo session_id(); ?></a> ] [ <a href="#!/logout">Logout</a> ]</p>
        </div>
        <div id="wrapper">
			<div id="dashboard" class="body active">
            	<div class="left">
            		<div id="log_tail">
                    	<div id="log_content" tabindex="0">
	                    	<p id="log_tail_empty">Connecting...</p>
                        </div>
                        
                        <form id="log_controls_container" method="post" action="#">
							<div id="log_controls">
                            	<input type="text"   id="text_cmd" disabled="disabled" />
                                <input type="submit" id="button_send"   class="button" disabled="disabled" title="Send command to the server" value="Send" />
                                <input type="reset"  id="button_clear"  class="button" disabled="disabled" title="Dismiss all text within the console viewport" value="Clear Console" />
                                <input type="button" id="button_toggle" class="button" disabled="disabled" title="Toggle the log entry data flow" value="Stop" />
                           	</div>
                        </form>
                	</div>
                </div>
                <div class="right">
                	<p class="vr" id="vr1"></p>
                    <p class="vr" id="vr2"></p>
                    <p class="vr" id="vr3"></p>
                    <p class="vr" id="vr4"></p>
                	<div id="phase_chain">
                        <p class="phase_box" id="phase_preparation">Preparation</p>
                        <p class="phase_box" id="phase_polling">Polling</p>
                        <p class="phase_box" id="phase_judgment">Judgment</p>
                        <p class="phase_box" id="phase_waiting">Waiting</p>
                        <p class="phase_box" id="phase_away">Away</p>
                        <p class="phase_box" id="phase_standby">Standby</p>
                        <br class="clear" />
                    </div>
                    
                    <p id="phase_status">Loading...</p>
                </div>
                <br class="clear" />
            </div>
            
            <div id="phase_manager" class="body">
                <form id="phase_control" method="post" action="#">
                    <div class="left">
                        <input type="button"  id="button_preparation" 	class="button" title="Switch to this phase" value="Preparation" />
                        <input type="button"  id="button_polling"   	class="button" title="Switch to this phase"  value="Polling" />
                        <input type="button"  id="button_judgement"  	class="button" title="Switch to this phase"  value="Judgement" />
                        <input type="button"  id="button_waiting" 		class="button" title="Switch to this phase"  value="Waiting" />
                        <input type="button"  id="button_away" 	 		class="button" title="Switch to this phase"  value="Away" />
                        <input type="button"  id="button_standby"   	class="button" title="Switch to this phase"  value="Standby" />
                        <input type="button"  id="text_info" 	 		value="..." />
                    </div>
                    <div class="right">
                    	<input type="button"  id="button_RL" 	class="button" title="Pass judgement"  value="Run Left" />
                        <input type="button"  id="button_RM"   	class="button" title="Pass judgement"  value="Run Middle" />
                        <input type="button"  id="button_RR"  	class="button" title="Pass judgement"  value="Run Right" />
                        <input type="button"  id="button_PL" 	class="button" title="Pass judgement"  value="Pass Left" />
                        <input type="button"  id="button_PM" 	class="button" title="Pass judgement"  value="Pass Middle" />
                        <input type="button"  id="button_PR"   	class="button" title="Pass judgement"  value="Pass Right" />
                        <input type="button"  id="button_PU" 	class="button" title="Pass judgement"  value="Punt" />
                        <input type="button"  id="button_FG"   	class="button" title="Pass judgement"  value="Field Goal" />
                        <input type="button"  id="button_force" class="button" title="Force the program into the next phase"  value="Force into next phase" />
                    </div>
                    <br class="clear" />
                </form>
            </div>
            
            <div id="alerts">
            	<p class="msg">Hello Admin!</p>
                <span>[ <a href="#!/status&amp;&amp;focus=server_load">Server Load: <span id="server_load">...</span>%</a> ]</span>
                <span>[ <a href="#!/&amp;&amp;redirect=ZendServerURIHere">Zend Server UI</a> ]</span>
            </div>
        </div>
        
        <!-- This div is used to preload images. Do not touch. -->
        <div class="hidden">
        	
        </div>
        
        <!-- Will replace with cache-busting lazy-loader class one day! -->
        <script type="text/javascript" src="/assets/js/mootools/mootools-core-1.4.0-pat-nopress.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/mootools-core-1.4.0-pat-nopress.js'); ?>"></script>
        <script type="text/javascript" src="/assets/js/mootools/mootools-more-1.4.0.1-pat-nopress.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/mootools-more-1.4.0.1-pat-nopress.js'); ?>"></script>
            
    	<script type="text/javascript" src="/assets/js/mootools/extensions/APE/apeClientMoo.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/APE/apeClientMoo.js'); ?>"></script>
        <script type="text/javascript" src="/assets/js/mootools/extensions/APE/apeConsole.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/APE/apeConsole.js'); ?>"></script>
            
        <script type="text/javascript" src="/assets/js/mootools/extensions/HashNav/HashNav.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/HashNav/HashNav.js'); ?>"></script>
        <script type="text/javascript" src="/assets/js/mootools/extensions/HashNav/Object.compare.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/HashNav/Object.compare.js'); ?>"></script>
        <script type="text/javascript" src="/assets/js/mootools/extensions/HashNav/String.QueryStringImproved.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/HashNav/String.QueryStringImproved.js'); ?>"></script>
            
        <script type="text/javascript" src="/assets/js/admin.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/admin.js'); ?>"></script>
    </body>
</html>
<?php
		}
	}
	
	new Abawss();
?>
