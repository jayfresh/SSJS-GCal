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

/* fix for the system being in UTC and it being run in the UK, in BST - this time fix ONLY works for this case where we are 1 hour out

2010	Sunday, 28 March, 01:00	->	Sunday, 31 October, 02:00
2011	Sunday, 27 March, 01:00	->	Sunday, 30 October, 02:00
2012	Sunday, 25 March, 01:00	->	Sunday, 28 October, 02:00
*/
Date.prototype.old_getHours = Date.prototype.getHours;
Date.prototype.getHours = function() {
	var offset = 0,
		timezoneOffset = this.getTimezoneOffset();
	if(timezoneOffset===0) {
		var now = this.getTime(),
			year = this.getFullYear(),
			startDST,
			endDST;
		if(year===2010) {
			startDST = new Date("March 28, 2010 01:00:00").getTime();
			endDST = new Date("October 31, 2010 01:00:00").getTime();
			if(now>=startDST && now<endDST) {
				offset = 1;
			}
		} else if(year===2011) {
			startDST = new Date("March 27, 2011 01:00:00").getTime();
			endDST = new Date("October 30, 2011 01:00:00").getTime();
			if(now>=startDST && now<endDST) {
				offset = 1;
			}
		} else if(year===2012) {
			startDST = new Date("March 25, 2012 01:00:00").getTime();
			endDST = new Date("October 28, 2012 01:00:00").getTime();
			if(now>=startDST && now<endDST) {
				offset = 1;
			}
		} else {
			// panic! I mean, upgrade
			throw new Error("upgrade the booking system to support daylight saving time for years past 2012");
		}
	} else {
		throw new Error("the booking system seems to have moved out of a GMT timezone, please upgrade to support the new timezone (offset "+timezoneOffset+")");
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
	system.use("jsunity_0_6");
	system.use("tests.GCal_tests");
	//system.use("tests.SweetSoft_tests");
	//system.use("tests.SS_notification_tests");

	jsUnity.attachAssertions();
	var out = "";
	jsUnity.log = function (s) {
	    out += "<div>" + s + "</div>";
	};
	jsUnity.run(
		GCal.tests.newEvent,
		GCal.tests.getEventsByTime
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
		return 'admin says is not logged in: '+objToString(this.session)+'<p>go to <a href="/login">login</a></p>';
	}
	return redirect('/listSweetSoftAccounts');
});

GET('/', function() {
	return redirect('/index.html');
});