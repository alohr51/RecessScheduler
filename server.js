/**
*  Application entry point. Sets up endpoint listeners for REST calls
*  Author: Andrew Lohr
*/
var express = require('express');
var student = require('./routes/cloudantDB');
var basicAuth = require('basic-auth-connect');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

// Body-parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

 // The host & port of the running Cloud Foundry container
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);

var engines = require('consolidate');
app.engine('html', engines.mustache);
app.set('views', path.join(__dirname, '/views'));
app.engine('html', engines.mustache);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));


app.use(basicAuth(function(user, pass){
	return 'us3r' == user && 'myp@$$' == pass;
}))

app.get('/', function(req, res){  
	res.render('index');
});

app.get('/delete', function(req, res){  
	res.render('delete');
});

app.get('/schedule', function(req, res){  
	res.render('schedule');
});

app.get('/students', student.findAll);
app.get('/students/:id', student.findById);
app.post('/students', student.addStudent);
app.post('/students/:query', student.search);
app.put('/students/:id', student.updateStudent);
app.post('/studentsd', student.deleteStudent);
app.get('/createSchedule', student.createSchedule);

app.listen(port, host);