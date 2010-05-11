/* this component should:

given a list of email addresses, add them as invitees to an event
trigger sending email notifications when creating a new event
given a list of two calendar ID's, pull events from both when considering free/busy time
given a set of contact details, insert these into the description for a new event
given a time and calendar's owner's ID/name, create a new event in that calendar
given a template for an event description (which is also a confirmation email), insert that into a new event
given a location for configuration, use that for: event description template, list of calendars and session tokens, minimum length of slot

*/
system.use("com.joyent.Sammy");
system.use("com.joyent.Resource");
system.use("com.google.code.date"); // include datejs lib
//system.use("date"); // the latest version of datejs, updated 2008-05-13
system.use("GCal");
system.use("SweetSoft");
system.use("jsunity_0_6");
//system.use("tests.GCal_tests");
system.use("tests.SweetSoft_tests");

// fix the timezone up to BST-locale
var old_today = Date.today;
Date.today = function() {
	var d = new old_today();
	d.setTimezoneOffset("-0100");
	return d;
};

GET('/time', function() {
	var d = new Date.today();
	return d.toISOString() + "  " + d.toString("HH:mm");
});

function objToString(obj) {
	if (typeof obj === "string") {
		return obj;
	}
	var out = "";
	for(var i in obj) {
		if(obj.hasOwnProperty(i)) {
			out += i + ": " + obj[i] + "<br/>";
		}
	}
	return out;
}

var Log = {};

GET('/tests', function() {
	jsUnity.attachAssertions();
	var out = "";
	jsUnity.log = function (s) {
	    out += "<div>" + s + "</div>";
	};
	jsUnity.run(
		//GCal.tests.newEvent,
		//GCal.tests.getEventsByTime,
		SweetSoft.tests.createAppointment,
		SweetSoft.tests.init,
		SweetSoft.tests.listFreeSlots
	);
	out += "<p>"+objToString(Log)+"</p>";
	return out;
});

GET('/admin', function() {
	return redirect('/listSweetSoftAccounts');
});

GET('/', function() {
	return redirect('/index.html');
});