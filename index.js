var express = require('express'),
app = express(),
port = process.env.PORT || 8000;

app.use(express.static(__dirname + '/public'));
app.listen(port);
console.log('listening -> localhost:%d', port)
