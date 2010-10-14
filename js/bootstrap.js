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
system.use("GCal");
system.use("GID");
system.use("SweetSoft");
system.use("SS_notification");
system.use("recaptcha");

enable('Sessions');
/* TESTS */
//system.use("jsunity_0_6");
//system.use("tests.GCal_tests");
//system.use("tests.SweetSoft_tests");
//system.use("tests.SS_notification_tests");

/* fix for the system being in UTC and it being run in the UK, in BST - must change this back when we hit October 31st and go back to GMT - this time fix ONLY works for this case where we are 1 hour out */
Date.prototype.old_getHours = Date.prototype.getHours;
Date.prototype.getHours = function() {
	var offset = 0;
	if(this.getTimezoneOffset()===0) {
		offset = 1;
	}
	return this.old_getHours.apply(this,arguments) + offset;
};

GET('/headers', function() {
	return objToString(this.request.headers) + "\n\n" + objToString(this.request);
});

GET('/time', function() {
	var d = new Date.today();
	var out = "new Date.today().toString();<br />"+d.toString()+"<br />";
	out += "d.getTimezoneOffset();<br />"+d.getTimezoneOffset()+"<br />";
	out += "toISOString();<br />"+d.toISOString()+"<br />";
	d.setISO8601('2010-05-11T09:00:00.000Z');
	out += "d.setISO8601('2010-05-11T09:00:00.000Z'); d.toString();<br />"+d.toString()+"<br />";
	out += "d.toISOString();<br />"+d.toISOString()+"<br />";
	out += "d.toString('HH:mm');<br />"+d.toString("HH:mm")+"<br />";
	out += "d.toString.toString();<br />"+d.toString.toString()+"<br />";
	return out;
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

/*GET('/tests', function() {
	jsUnity.attachAssertions();
	var out = "";
	jsUnity.log = function (s) {
	    out += "<div>" + s + "</div>";
	};
	jsUnity.run(
		//GCal.tests.newEvent,
		//GCal.tests.getEventsByTime,
		//SweetSoft.tests.createAppointment,
		//SweetSoft.tests.init,
		//SweetSoft.tests.listFreeSlots,
		//SS_notification_tests.admin,
		//SS_notification_tests.notification
	);
	out += "<p>"+objToString(Log)+"</p>";
	return out;
});*/

GET('/admin', function() {
	try {
		is_logged_in(this.session);
	} catch(ex) {
		return 'admin says is not logged in: '+objToString(this.session);
	}
	return redirect('/listSweetSoftAccounts');
});

GET('/', function() {
	return redirect('/index.html');
});