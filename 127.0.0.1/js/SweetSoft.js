/* this component should:

given a list of two calendar ID's, pull events from both when considering free/busy time
given a template for an event description (which is also a confirmation email), insert that into a new event
given a location for configuration, use that for: event description template, list of calendars and session tokens, minimum length of slot

requires:
system.use("com.google.code.date");
system.use("com.joyent.Resource");

SweetSoft stores accounts as a "SweetSoftAccount" resource. An account has this structure:
{
	id: "person1"
	name: "Jeff Smith"
	email: "jeff.smith@example.org"
	phone: "07123 456789"
}

During config setup, SweetSoft gets the accounts from Gcal and merges the calendar and sessionToken data. It matches by looking for accounts with an id equal to the id of the SweetSoft account. SweetSoft.config.accounts is set to an object of this structure:
{
	person1: {
		id: "person1",
		name: "Jeff Smith",
		email: "jeff.smith@example.org",
		phone: "07123 456789",
		sessionToken: "fg3hg94ugjvm___cFg",
		calendars: [{
			name: "Jeff's Calendar",
			id: "jeffff@gmail.com"
		}]
	}
}

TO-DO: I've made quite a few changes that I haven't tested, to do with the way accounts are handled - I think I need to make sure that what I've written above is true; and that internally, SweetSoft and GCal look after accounts ok. Plus, I need to make sure there are appropriate ways to create and list accounts.

TO-DO: write the algorithm that calculates free slots

*/
SweetSoft = {};
(function() {
	
	var DEFAULTS = {
		accounts: {},
		eventTitleTemplate: "Viewing for <%=property%>",
		eventDescriptionTemplate: "Hello <%=student_name%>, \n\n" +
		"Your booking for <%=property%> is on <%=date%> at <%=start_time%>. \n\n" + 
		"If you need to reschedule your booking, please contact your SuperMum (<%=supermum_name%>) on: <%=supermum_phone%>. \n\n" +
		"Your contact details: <%=student_phone%>, <%=student_email%>. \n\n" +
		"See you soon! \n\nSweetSpot",
		slotLengthMinutes: 30,
		viewingsCalendarName: "viewings"
	};
	try {
		SweetSoft.config = getConfig();
	} catch(e) {
		throw new Error('Error: SweetSoft initiation: '+e.message);
	}

	SweetSoft.createAppointment = function(data) {
		try {
			verifyOptions(data, [
				'superMumID',
				'property',
				'date',
				'start_time',
				'student_name',
				'student_email',
				'student_phone',
				'attendees'
			]);
		} catch(e) {
			throw new Error("Error: SweetSoft.createAppointment: "+e.message);
		}
		var config = SweetSoft.config;
		var account = config.accounts[data.superMumID];
		var attendeeList = data.attendees,
			attendees = [{
				name: data.student_name,
				email: data.student_email
			}];
		for(var i=0, il=attendeeList.length, email; i<il; i++) {
			email = attendeeList[i];
			attendees.push({
				name: email,
				email: email
			});
		}
		// enhance data object before templating
		data.supermum_name = account.name;
		data.supermum_phone = account.phone;
		var startTime = new Date.parse(data.date+' '+data.start_time);
		var endTime = startTime.clone().add(config.slotLengthMinutes).minutes();
		var options = {
			title: string_template(config.eventTitleTemplate, data),
			description: string_template(config.eventDescriptionTemplate, data),
			where: data.property,
			startTime: startTime,
			endTime: endTime,
			organiser_name: account.name,
			organiser_email: account.email,
			attendees: attendees,
			accountID: account.email,
			calendarName: config.viewingsCalendarName
		};

		GCal.newEvent(options);
	};
	
	SweetSoft.listFreeSlots = function(options) {
		try {
			verifyOptions(options, [
				'accountID'
			]);
		} catch(e) {
			throw new Error("Error: SweetSoft.listFreeSlots: "+e.message);
		}

		var today = new Date.today(); // 00:00 today
		var tomorrow = today.add(2).day(); // to get to 24:00
		var config = SweetSpot.config;
		//var calendars = // TO-DO: get this information out of config - can do once config merges GCal and SweetSoft accounts properly
		var superMumCalendars = config.accounts[superMumID].calendars;

		var freeTime = GCal.getEventsByTime(superMumCalendars.freetime, today, tomorrow);
		var bookedSlots = GCal.getEventsByTime(superMumCalendars.viewings, today, tomorrow);
		/* pseudo:
			set current freeTime slot to first freeTime slot
			set next booked slot to first booked slot
			
			start at beginning of current freeTime slot
			move to start of next booked slot - that defines start of next free slot
			
			calculate end of next free slot (check at least slotLengthMinutes)
				check am before end of current freeTime slot
					if not, move to start of next freeTime slot
					if so, mark start of next freeTime slot
		
		*/
		/* TO-DO: return object with all time slots that are not already booked up
			something like: {
				today: [slots],
				tomorrow: [slots]
			}
		*/
	};
	
	function getConfig() {
		var AdminInfo = new Resource('SweetSoftAdminInfo');
		function getAdminOption(id) {
			return AdminInfo.search(id).value; /* TO-DO: check this is correct use of search */
		}
		var Account = new Resource('SweetSoftAccount');
		function getSweetSoftAccount(id) {
			Account.search({
				id: id
			});
		}
		var gCalAccounts = GCal.listAccounts();
		var accounts = {}, account;
		for(var gCalAccount in gCalAccounts) {
			account = getSweetSoftAccount()
			accounts[gCalAccount.accountName] = account;
		}
		var config = {
			accounts: accounts,
			eventTitleTemplate: getAdminOption('eventTitleTemplate') || DEFAULTS.eventTitleTemplate,
			eventDescriptionTemplate: getAdminOption('eventDescriptionTemplate') || DEFAULTS.eventDescriptionTemplate,
			slotLengthMinutes: getAdminOption('slotLengthMinutes') || DEFAULTS.slotLengthMinutes,
			viewingsCalendarName: getAdminOption('viewingsCalendarName') || DEFAULTS.viewingsCalendarName
		};
		verifyOptions(config, [
			'accounts',
			'eventTitleTemplate',
			'eventDescriptionTemplate',
			'slotLengthMinutes'
		]);
		return config;
	}
	
	/* utils */
	
	function verifyOptions(obj, optionsList) {
		var e, missingOptions = [];
		if(!obj) {
			e = new Error();
			e.message = 'no arguments supplied';
			throw e;
		}
		for(var i=0, il=optionsList.length, option; i<il; i++) {
			option = optionsList[i];
			if(!obj[option]) {
				missingOptions.push(option);
			}
		}
		if(missingOptions.length) {
			e = new Error();
			e.message = 'missing options - '+missingOptions.join(", ");
			throw e;
		}
		return true;
	}
	
	// templating using "<% ... %>" (expressions) and "<%= ... %>" (values)
	// adapted from John Resig and Jeremy Ashkenas (MIT License)
	// http://ejohn.org/blog/javascript-micro-templating/
	// http://github.com/documentcloud/underscore
	function string_template(str, data) {
		/* JRL: changed to support '\n' characters in templates
			modified first replace function - it was:
			.replace(/[\r\t\n]/g, " ")
			and added
			.replace(/\n/g,"\\n")
		*/
		var fn = new Function("obj",
			"var p=[];" +
			"with(obj){p.push(\'" +
			str
				.replace(/[\r\t]/g, " ")
				.replace(/\n/g, "\\n")
				.split("<%").join("\t")
				.replace(/((^|%>)[^\t]*)'/g, "$1\r")
				.replace(/\t=(.*?)%>/g, "',$1,'")
				.split("\t").join("');")
				.split("%>").join("p.push('")
				.split("\r").join("\\'") +
			"');}return p.join('');");
		return data ? fn(data) : fn;
	}

})();
