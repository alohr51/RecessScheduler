var config={};
if (process.env.VCAP_SERVICES) {
	// Running on Bluemix. Parse the port and host that we've been assigned.
	var env = JSON.parse(process.env.VCAP_SERVICES);
	var host = process.env.VCAP_APP_HOST;
	var port = process.env.VCAP_APP_PORT;
	// Also parse Cloudant settings.
	var config = env["cloudantNoSQLDB"][0]["credentials"];
	config.database = "students";
}

var url = config.url + "/" + config.database;
var db = require("nano")(url);

exports.findById = function(req, res) {
	var id = req.params.id;
	db.get(id, { revs_info: false }, function(err, body) {
		if (err){
			console.log("error finding ID: " + id + " " + err);
			res.status(500).send(err);
			return;
		}
		res.send(body);
	});

};

exports.findAll = function(req, res) {
	db.list({include_docs: true, ascending: true}, function (err, body, headers) {
		if (err) {
			console.log("Error in Find All: " + err);
			res.status(500).send(err);
			return;
		}
		res.send(body);
	});
};
 
exports.search = function(req, res) {
	var data = req.params.query;
	db.search("students", "student", { q: data}, function(err, body) {
		if (err) {
			res.status(500).send(err);
			return;
		}
		res.send(body);
	});

}

exports.addStudent = function(req, res) {
	var Student = req.body;
	var fname = req.body.fname;
	var lname = req.body.lname;
	var id = fname + lname;
	console.log("Adding Student: " + JSON.stringify(Student));
	db.insert( Student, id, function (err, body, headers) {
		if (err) {
			res.status(500).send(err);
			return;
		}
		res.render("index");
	});
}

exports.updateStudent = function(req, res) {
	var id = req.params.id;
	var studentBody = req.body;
	console.log("updating student with data: " + JSON.stringify(studentBody));
	db.get(id, function (error, existing) { 
		if(!error){ 
			studentBody._rev = existing._rev;
			db.insert(studentBody, id, function(err, body, headers){
				if (err) {
					console.log("Error updating student id " + id + " " + err);
					res.status(500).send(err);
					return;
				}
				console.log(body);
				res.send(body);
			});
		}

	});
}

exports.deleteStudent = function(req, res) {
	var fname = req.body.fname;
	var lname = req.body.lname;
	var id = fname + lname;
	console.log("Deleting student: " + fname + " " + lname);
	db.get(id, { revs_info: true }, function(err, body) {
		if (!err){
			db.destroy(id,body._rev , function(err, body) {
				if (err){
					console.log("Error deleting student id: " + id + " " + err);
					res.status(500).send(err);
					return;
				}

				res.render("delete");
			});
		}
		else{
			res.send("Cannot delete. Did not find student id: " + id);
		}
	});
}

exports.createSchedule = function(req, res) {
	db.list({include_docs: true, descending: true}, function (err, body, headers) {
		if (err) {
			console.log("error creating schedule: " + err);
			res.status(500).send(err);
			return;
		}
		res.send(body);
	});
}