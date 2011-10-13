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
	
	class Xunnamius extends Controller
	{
		protected function run_AJAX()
		{
			if($this->validate('req', TYPE_ALPHA, 'post'))
			{
				if($_POST['req'] == 'connect') $response = array('status' => 'ready', 'userdata' => NULL); 		// Is the server currently accepting connections?
				else
				{
					header('Content-Type: application/json');
					$dbc = SQL::load_driver('MySQL');
					
					if($dbc->new_connection('main'))
					{
						if($_POST['req'] == 'init')								// Return fun fact data & current server phase
						{
							$funfacts = NULL;
							
							/* grabs fun facts *\
							$result = $dbc->query('SELECT data FROM fun_facts');
							$funfacts = $result->rows;
							/***/
							
							// Prepared statements are teh kewl
							/*$result = $dbc->query('SELECT value FROM runtime_data WHERE `key` = \'current_phase\' LIMIT 1', array(array(S, 'current_phase')));*/
							$response = array('fun_facts' => $funfacts/*$result->rows[0]['value']*/);
						}
					}
					
					else die('MySQL Connection Failure.');
				}
				
				echo json_encode($response);
			}
			
			else $this->run();
		}
		
		protected function run(){ header('Location: '.DG_REAL_HOST); }
	}
	
	new Xunnamius();
?>