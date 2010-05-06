SweetSoft.test_data = {
	accounts: {
		"supermum1@sweetspot.com": {
			account: {
				name: "Lady Gaga",
				phone: "07890 123456",
				sessionToken: "abcd"
			},
			calendars: {
				freetime: "1234",
				viewings: "5678"
			}
		},
		"supermum2@sweetspot.com": {
			account: {
				name: "Dame Edna",
				phone: "07123 456789",
				sessionToken: "efgh"
			},
			calendars: {
				freetime: "9012",
				viewings: "3456"
			}
		}
	},
	createAppointment: {
		form_data: {
			superMumID: "supermum2", /* TO-DO: set this to something that will have an account available */
			property: "53 Kenilworth Avenue",
			date: "2010-05-31",
			start_time: "13:00",
			student_name: "Bob-a-job",
			student_email: "bob@job.com",
			student_phone: "0789",
			attendees: [
				"jeff@koons.com",
				"philip@larkin.com"
			]
		},
		options_to_use: { /* TO-DO: make the date_time, supermum_name and supermum_phone correct (the last two are probably dependent on how I decide to set up the accounts for testing */
			title: "Viewing for 53 Kenilworth Avenue"
			description: "Hello <%=student_name%>, \n\n" +
			"Your booking for 53 Kenilworth Avenue is at <%=date_time%>. \n\n" + 
			"If you need to reschedule your booking, please contact your SuperMum (<%=supermum_name%>) on: <%=supermum_phone%>. \n\n" +
			"Your contact details: 0789, bob@job.com. \n\n" +
			"See you soon! \n\nSweetSpot",
			where: "53 Kenilworth Avenue",
			startMin: data.startMin, /* TO-DO: set this */
			startMax: data.endTime, /* TO-DO: set this */
			organiser_name: account.name, /* TO-DO: set this */
			organiser_email: "supermum2", /* TO-DO: set this when the supermumID is set correctly above */
			attendees: [
				"jeff@koons.com",
				"philip@larkin.com"
			],
			calendarID: account.calendars.viewings /* TO-DO: set this when I know how it is going to work */
		}
	},
	listFreeSlots: {
		invalidAccountID: "does.not@exist.com",
		validAccountID: "jnthnlstr@googlemail.com"
	}
};

/* for setting up test data -

SweetSoft has two datastores - the admininfo, and the accounts. I could seed the accounts with some test data, and deal with the authentication the first time they're run - the GCal lib should store the sessionTokens for the accountID's after the first time

*/

SweetSoft.tests = {
	createAppointment: {
		suiteName: 'createAppointment',
		'test - it should throw an error if no arguments are supplied': function() {
			assertException(function() { SweetSoft.createAppointment(); });
		},
		'test - it should throw an error if no accountID is supplied': function() {
			assertException(function() { SweetSoft.createAppointment({}); });
		},
		'test - it should take data coming from the SweetSpot property pages and call GCal.newEvent with the options set correctly to create a new event': function(data) {
			var form_data = SweetSoft.test_data.createAppointment.form_data;
			var options_to_use = SweetSoft.test_data.createAppointment.options_to_use; /* TO-DO: set these all correctly - see above */
			var old_newEvent = GCal.newEvent;
			var match;
			GCal.newEvent = function(options) {
				match = compare(options,options_to_use); // TO-DO: make compare match the objects (use hash?)
			};
			SweetSoft.createAppointment(form_data);
			GCal.newEvent = old_newEvent;
			assertTrue(match);
		}
	},
	listFreeSlots: {
		suiteName: 'listFreeSlots',
		'test - it should throw an error if no arguments are supplied': function() {
			assertException(function() { SweetSoft.listFreeSlots(); });
		},
		'test - it should throw an error if no accountID is supplied': function() {
			assertException(function() { SweetSoft.listFreeSlots({}); });
		},
		'test - it should throw an error if no "freebusy" and "viewings" properties exist for the account specified by accountID': function() {
			/* TO-DO: make sure the correct account details are set up in the datastore */
			var accountID = SweetSoft.test_data.listFreeSlots.invalidAccountID;
			assertException(function() { SweetSoft.listFreeSlots({
				accountID: accountID
			}) });
		},
		'test - it should return only the parts of a calendar today and tomorrow that do not have events scheduled for': function() {
			/* TO-DO: make sure the correct account details are set up in the datastore */
			var accountID = SweetSoft.test_data.listFreeSlots.validAccountID;
			var slots = SweetSoft.getEventsByTime({
				accountID: accountID
			});
			/* TO-DO: verify that returned slots are correct */
		}
	}
};