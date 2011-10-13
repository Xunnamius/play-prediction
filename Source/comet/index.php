<html>
	<head>
    	<title>Test</title>
    </head>
    
    <body>
		<h1>APE Test</h1>
        
        <script type="text/javascript">
			console.log('-- APE Test --');
			
			var client = new APE.Client();
			
			client.addEvent('load', function()
			{
				client.core.start({ 'name': prompt('What\'s your name?') });
			});
			
			client.addEvent('ready', function()
			{
				console.log('Connected!');
				console.log('Joining channel "testChannel"...');
				client.core.join('testChannel');
				
				client.addEvent('multiPipeCreate', function(pipe, options)
				{
					pipe.send('Hello world!');
					console.log('Sending "Hello World!"...');
					console.info('(options: ', options, ')');
				});
				
				client.onRaw('data', function(raw, pipe)
				{
					console.error('Receiving RAW: ' + unescape(raw.data.msg));
				});
			});
			
			client.load();
		</script>
    </body>
</html>