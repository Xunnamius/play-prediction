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
        <title>Predict The Play - V.0.1</title>
        
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
        <link rel="stylesheet" type="text/css" href="/assets/css/medium-global.css?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/css/medium-global.css'); ?>" media="all" />
        <link rel="stylesheet" type="text/css" href="/assets/css/medium-mobile.css?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/css/medium-mobile.css'); ?>" media="handheld" />
        
        <link rel="alternate" type="application/rss+xml" title="(RSS Newsfeed - change the name!)" href="<?php echo DG_REAL_HOST; ?>rss/" />
        
        <!-- This script is for variables exposed by the server for AJAX's convenience -->
        <script type="text/javascript">
		/* <![CDATA[ */
			PHP_browser = '<?php echo $data->browser; ?>';
			PHP_currentDir = '<?php echo DG_CURRENT_DIR; ?>';
			PHP_realHost = '<?php echo DG_REAL_HOST; ?>';
			PHP_isDebugMode = <?php echo DG_DEBUG_MODE?1:0; ?>;
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
        
        <div id="outer_wrapper">
        	<div id="inner_wrapper">
            	<div id="display_screen" class="screen">
                	<p>PlayPrediction is loading...</p>
                </div>
            </div>
            <div id="screen_container">
            	<div id="display2_screen" class="screen">
                	<p>Grabbing data...</p>
                </div>
                
                <div id="display3_screen" class="screen">
                	<p>Move Along...</p>
                </div>
            	
                <div id="play_screen" class="screen" style="background-color: transparent">
                    <form>
                        <input class="button play_screen" type="button" id="run_left" value="Run Left" />
                        <input class="button play_screen" type="button" id="run_middle" value="Run Middle" />
                        <input class="button play_screen" type="button" id="run_right" value="Run Right" />
                        
                        <input class="button play_screen" type="button" id="pass_left" value="Pass Left" />
                        <input class="button play_screen" type="button" id="pass_middle" value="Pass Middle" />
                        <input class="button play_screen" type="button" id="pass_right" value="Pass Right" />
                        
                        <div id="foot">
                            <input class="button play_screen" type="button" id="punt" value="Punt" />
                            <input class="button play_screen" type="button" id="field_goal" value="Field Goal" />
                        </div>
                    </form>
                </div>
                
                <div id="help_screen" class="screen" style="background-color: yellow">
                    <p>[ Help Screen Here ]</p>
                </div>
                
                <div id="orientation_screen" class="screen" style="background-color: green">
                    <h1>Choose your side:</h1>
                     <form>
                        <input class="button" type="button" id="home" value="Home" />
                        <p>OR</p>
                        <input class="button" type="button" id="away" value="Away" />
                    </form>
                </div>
                
                <div id="waiting_screen" class="screen" style="background-color: blue">
                    <p>[ Leaderboard &amp; Other Stats Here ]</p>
                </div>
                
                <div id="auth_screen" class="screen" style="background-color: orange">
                    <p>[ User Login Here ]</p>
                </div>
                
                <div id="profile_screen" class="screen" style="background-color: red">
                    <p>[ Profile Screen Here ]</p>
                </div>
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
        <script type="text/javascript" src="/assets/js/mootools/extensions/APE/apeUser.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/APE/apeUser.js'); ?>"></script>
            
        <script type="text/javascript" src="/assets/js/mootools/extensions/HashNav/HashNav.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/HashNav/HashNav.js'); ?>"></script>
        <script type="text/javascript" src="/assets/js/mootools/extensions/HashNav/Object.compare.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/HashNav/Object.compare.js'); ?>"></script>
        <script type="text/javascript" src="/assets/js/mootools/extensions/HashNav/String.QueryStringImproved.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/HashNav/String.QueryStringImproved.js'); ?>"></script>
            
        <script type="text/javascript" src="/assets/js/mootools/extensions/ViewManager.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/mootools/extensions/ViewManager.js'); ?>"></script>
        <script type="text/javascript" src="/assets/js/global.js?<?php
            echo filemtime(DG_REAL_ROOT_DEFINED.'/assets/js/global.js'); ?>"></script>
    </body>
</html>
<?php
		}
	}
	
	new Abawss();
?>
