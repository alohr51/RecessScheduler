//Author: Andrew Lohr
//Made for an elementary school

//global helpers to keep track of teacher table
window.w1=1;
window.s1=1;
window.h2=1;
window.r2=1;
window.c3=1;
window.m3=1;
window.c4=1;
window.m4=1;
window.c5=1;
window.g5=1;
window.helper = 1;

function validateAdd(){
	var fname=document.forms["myFormAdd"]["fname"].value;
	var lname=document.forms["myFormAdd"]["lname"].value;
	var inputLog = document.getElementById('inputLog');
	var kidTeachText = document.forms["myFormAdd"]["kidTeachText"].value
	var grade=getRadio();

	var checkbox = document.getElementsByName('choices');
	var ln = 0;
	for(var i=0; i< checkbox.length; i++) {
		if(checkbox[i].checked)
			ln++
	}
	if(ln <= 1){
		inputLog.innerHTML = " WARNING: Did not add student. each student must have 2 or more choices for the Activity checklist."
		inputLog.style.color = 'red';
		inputLog.style.backgroundColor = 'black';
		return false;
	}

	if (fname == null || fname == "" || fname == undefined || lname == null || lname == "" || lname == undefined || 
		grade == null || grade == "" || grade == undefined || !grade){
		inputLog.innerHTML="Please Fill All Required Fields";
		inputLog.style.color = 'red';
		inputLog.style.backgroundColor = 'black';
		return false;
	}
	if (document.getElementById('KidsTeachingKids').checked && kidTeachText == "" ) {
		inputLog.innerHTML= "You have Kids teaching kids Checked, please enter a topic the student will teach";
		inputLog.style.color = 'red';
		inputLog.style.backgroundColor = 'black';
		return false;
	}
}

function validateDelete(){
	var fname=document.forms["myFormDelete"]["fname"].value;
	var lname=document.forms["myFormDelete"]["lname"].value;
	var deleteLog = document.getElementById('deleteLog');
	if (fname == null || fname == "" || fname == undefined || lname == null || lname == "" || lname == undefined){
		deleteLog.innerHTML="Please Fill All Required Fields";
		return false;
	}
}

function getRadio(){
	var val;
	var radios = document.forms["myFormAdd"]["grade"];
	for (var i=0, len=radios.length; i<len; i++) {
		if ( radios[i].checked ) {
			val = radios[i].value;
			break;
		}
	}
	return val;
}

function getStudents(){
	$.ajax({
		type: "GET",
		url: '/students',
		success: function(data) {
			tableStudents(data,true);
		},
		error: function(jqXHR, textstatus, errorThrown) {
			alert('text status ' + textstatus + ', err ' + errorThrown);
		}
	});
}

function tableStudents(data){
	var totalRows = data.total_rows;
	var table = document.getElementById("studentTable");
	var totalDiv = document.getElementById('totalStudents');
	var header = table.insertRow(-1);
	var head1 = header.insertCell();
	var head2 = header.insertCell();
	head1.innerHTML = "First Name";
	head2.innerHTML = "Last Name";

	for(var i = 0; i < totalRows; i++){
		var row = table.insertRow(-1);
		var cell1 = row.insertCell();
		var cell2 = row.insertCell();
		cell1.innerHTML = data.rows[i].doc.fname;
		cell2.innerHTML = data.rows[i].doc.lname;
	}
	totalDiv.innerHTML = 'Total Students in Database: ' + totalRows;
}

function createSchedule(){
	$.ajax({
		type: "GET",
		url: '/createSchedule',
		success: function(data) {
			var youngSchd = sortActivities(data, true);
			presentSchd(youngSchd,true);
			var oldSchd = sortActivities(data, false);
			presentSchd(oldSchd,false);
		},
		error: function(jqXHR, textstatus, errorThrown) {
			alert('text status ' + textstatus + ', err ' + errorThrown);
		}
	});

}

function sortActivities(data,isYoung){
	if(isYoung)log("******** Starting Scheduling for Grades 1, 2, and 3. ********");
	else log("******** Starting Scheduling for Grades 4 and 5 ********");
	var students = renderData(data);
	var sortedActivities = getLeastPopularOrder(data);
	var totalStudents = data.total_rows;
	window.maxStuPerActivity = Math.ceil(totalStudents / sortedActivities.length);
	var schedule = {
		"free":[],
		"outdoor":[],
		"talent":[],
		"group":[],
		"crafts":[],
		"hallway":[],
		"kidTeach":[]
	};
	var a = 0;
	var giveUp = false;
	var totalActivities = 8;
	var activityCounter = 0;
	var slotToFill = sortedActivities[a][0];
	var fallbackActivities = ["free","outdoor","talent","group","crafts","hallway","kidTeach"];
	while(getChoiceSize(students) > 0){
		log("Students left: " + getChoiceSize(students));
		activityCounter = 0;
		if(slotToFill === findMinLength(schedule)){
			slotToFill = fallbackActivities.pop();
			if(schedule[slotToFill] === undefined)giveUp = true;
			else{
				activityCounter = schedule[slotToFill].length;
				log("Using fallback: " + slotToFill + " with activity count: " + activityCounter);
			}
		}
		else{
			slotToFill = findMinLength(schedule);
			log("Currently using smallest Activity: " + slotToFill);
			activityCounter = schedule[slotToFill].length;

		}
		newActivity:
	//each students name looks like: name, kidTeachTopic if significant, and grade. eg. will spichiger, Topic: texas food lesson2 
	for(var key in students){
		if(giveUp){
			log("Algorithm giving up with " + key + "-> " + students[key]);
			var studentName =key.slice(0,-2);
		//random number to just place the student anywhere he chose.
		var rand = Math.floor(Math.random() * students[key].length);
		schedule[students[key][rand]].push(studentName);
		log("Added " + studentName + " to " + students[key][rand]);
		delete students[key];
	}
		//take off the grade from the end of each name and parse it to an int for comparisons
		var grade1 = key.slice(-2);
		var grade = parseInt(grade1);
		var logName = key.split(',');
		if(isYoung && grade >= 4){
			log("Currently Working with Grades 1,2,3. Deleting older student: " + logName[0] + ", Grade: " + grade);
			delete students[key];
		}
		else if(!isYoung  && grade <= 3){
			log("Currently Working with Grades 4 and 5 . Deleting younger student: " + logName[0] + ", Grade: " + grade);
			delete students[key];
		}
		else{
		//get the size/length of each students choices they have in their choices array
		var choiceSize = getChoiceSize(students[key]);
		newStudent:
		for(var c = 0; c < choiceSize; c++){
			if(activityCounter >= window.maxStuPerActivity){
				log("Activity: " + slotToFill + " is filled!");
				break newActivity;          
			}
			if(students[key][c] === slotToFill){
				if(schedule[slotToFill] != undefined){
				//take off the grade from the end of the name
				var studentName =key.slice(0,-2);
				//add the student to the schedule with their respective activity they matched with
				schedule[slotToFill].push(studentName);
				var logName = studentName.split(',');
				log("Added " + logName[0] + " to " + slotToFill);
				//add the student to the teachers list
				teacherSchd(logName[0], slotToFill, key.slice(-2),window.helper);
				window.helper++;
				delete students[key];
				slotToFill = findMinLength(schedule);
				log("Currently using smallest Activity: " + slotToFill);
				activityCounter = schedule[slotToFill].length;
				break newStudent;
			}
		}
	}
}
}

}
log("******** Finished Scheduling **********")
return schedule;
}

function findMinLength(schedule){
	var minAct = "";
	var min = 10000000;
	for(key in schedule){
		if(schedule[key].length < min){
			min = schedule[key].length;
			minAct = key;
		}
	}
	return minAct;

}

function getChoiceSize(obj){
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;

}

function pickRandomProperty(obj) {
	var result;
	var count = 0;
	for (var prop in obj)
		if (Math.random() < 1/++count)
			result = prop;
		return result;
	}

	function sizeHelp(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};


	function renderData(data){
		var stuChoice = {};
		var randStuChoice = {};
		for(var i = 0; i < data.total_rows; i++){
			var grade = data.rows[i].doc.grade;
			var teachText = data.rows[i].doc.kidTeachText;
			var names = "";
			if(teachText != ""){
				names = (data.rows[i].doc.fname + " " + data.rows[i].doc.lname)+ ", Topic: " + teachText + grade;
			}
			else{
				names = (data.rows[i].doc.fname + " " + data.rows[i].doc.lname)+grade;
			}
			var ch = data.rows[i].doc.choices;
			stuChoice[names] = ch,grade;
		}

		var stuSize = sizeHelp(stuChoice);
	//randomize the javascirpt objects order
	var rand = "";
	for(var x = 0; x < stuSize ; x++){
		rand = pickRandomProperty(stuChoice);
		randStuChoice[rand] = stuChoice[rand];
		delete stuChoice[rand];
	}
	return randStuChoice;
}

function getLeastPopularOrder(data){
	var totalStudents = data.total_rows;
	var activityCounts = { };
	for(var i = 0; i < totalStudents; i++){
		for(z = 0; z < data.rows[i].doc.choices.length; z++){
			activityCounts[data.rows[i].doc.choices[z]] = (activityCounts[data.rows[i].doc.choices[z]] || 0) + 1;
		}
	}
	var array=[],activityCounts;
	for(activity in activityCounts){
		array.push([activity,activityCounts[activity]])
	}
	array.sort(function(activity,b){return activity[1] - b[1]});
	//array.reverse();
	return array;


}

function presentSchd(schd,isYoung){
	var headers=['Free Time', 'Outdoor Activity', 'Talent Show', 'Group Activity', 'Arts & Crafts', 'Hallway Activity', 'Kids Teaching Kids'];
	if(isYoung){
		log("Rendering table for grades 1, 2, and 3");
		var table = document.getElementById("youngSchedule");
	}
	else{
		log("Rendering table for grades 4 and 5");
		var table = document.getElementById("oldSchedule");
	} 
	//get total amount of students in each array
	var max = 0;
	for(var key in schd){
		if(schd[key].length > max)max = schd[key].length;
	}
	//setup the headers
	var header = table.insertRow(-1);
	for(head in headers){
		var head1 = header.insertCell();
		head1.innerHTML = headers[head];
	}

	//setup the table
	for(var r = 0; r < max; r++){
		var row = table.insertRow();
		for(key in schd){
			var cell2= row.insertCell();
			cell2.innerHTML ="";
		}
	}

	//add students to table
	var cell = 0;
	var q = 1;
	for(key in schd){
		for(var w = 0; w < schd[key].length; w++){
			if(key != 'kidTeach'){
				var noTeachText = schd[key][w].split(',');
				var onlyName = noTeachText[0];
				table.rows[q].cells[cell].innerHTML = onlyName;
			}
			else{
				table.rows[q].cells[cell].innerHTML = schd[key][w];
			}
			q++;
		}
		q = 1;
		cell++;
	}
}


//teachers table so they know where their kids are
function teacherSchd(name, activity, grade,helper){
	var table = document.getElementById("teachSchedule");
	var teachers=['Jennifer Winkler','Leane Sikes','Jackie Holowinski','Jean Rorro',
	'Carolyn Cooney','Kim McCloskey','Robert Crescitelli', 'Audrey Mutch',
	'Laura Cibbattoni', 'Rebecca Gloede'];
	var formattedActivity="";
	switch(activity) {
		case 'free':
		formattedActivity = 'Free Time';
		break;
		case 'outdoor':
		formattedActivity = ' Outdoor Activity';
		break;
		case 'talent':
		formattedActivity = 'Talent Show';
		break;
		case 'crafts':
		formattedActivity = 'Arts & Crafts';
		break;
		case 'group':
		formattedActivity = 'Group Activity';
		break;
		case 'hallway':
		formattedActivity = 'Hallway Activity';
		break;
		case 'kidTeach':
		formattedActivity = 'Kids Teaching Kids';
		break;
		default:
		formattedActivity = activity;
		break;
	}

	if(helper === 1){
		//setup the headers
		var header = table.insertRow(-1);
		for(teacher in teachers){
			var head1 = header.insertCell();
			head1.innerHTML = teachers[teacher];
		}

		//setup table - assume each teacher has no more than 60 students.
		for(var r = 0; r < 60; r++){
			var row = table.insertRow();
			for(var t =0; t<10; t++){
				var cell= row.insertCell();
				cell.innerHTML ="";
			}
		}
	}
	//add students to teachers table
	switch(grade) {
		case '1w':
		table.rows[window.w1].cells[0].innerHTML = name + ": " + formattedActivity;
		window.w1++;
		break;
		case '1s':
		window.s1++;
		if(table.rows[window.s1].cells[1].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.s1].cells[1].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.s1].cells[1].innerHTML = name + ": " + formattedActivity;
		break;
		case '2h':
		window.h2++;
		if(table.rows[window.h2].cells[2].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.h2].cells[2].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.h2].cells[2].innerHTML = name + ": " + formattedActivity;

		break;
		case '2r':
		window.r2++;
		if(table.rows[window.r2].cells[3].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.r2].cells[3].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.r2].cells[3].innerHTML = name + ": " + formattedActivity;
		break;
		case '3c':
		window.c3++;
		if(table.rows[window.c3].cells[4].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.c3].cells[4].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.c3].cells[4].innerHTML = name + ": " + formattedActivity;
		break;
		case '3m':
		window.m3++;
		if(table.rows[window.m3].cells[5].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.m3].cells[5].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.m3].cells[5].innerHTML = name + ": " + formattedActivity;
		break;
		case '4c':
		window.c4++;
		if(table.rows[window.c4].cells[6].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.c4].cells[6].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.c4].cells[6].innerHTML = name + ": " + formattedActivity;
		break;
		case '4m':
		window.m4++;
		if(table.rows[window.m4].cells[7].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.m4].cells[7].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.m4].cells[7].innerHTML = name + ": " + formattedActivity;
		break;
		case '5c':
		window.c5++;
		if(table.rows[window.c5].cells[8].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.c5].cells[8].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.c5].cells[8].innerHTML = name + ": " + formattedActivity;
		break;
		case '5g':
		window.g5++;
		if(table.rows[window.g5].cells[9].innerHTML == undefined){
			var row = table.insertRow();
			for(var i = 0; i < 10; i++){
				var cell = row.insertCell();
			}
			table.rows[window.g5].cells[9].innerHTML = name + ": " + formattedActivity;
		}
		else table.rows[window.g5].cells[9].innerHTML = name + ": " + formattedActivity;
		break;

		default:
		alert("Error: grade not found: " + grade);
	}
}

function log(output){
	var out = document.getElementById("output");
	out.value += '- ' + output + "\n";
}