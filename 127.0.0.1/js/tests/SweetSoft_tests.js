SweetSoft.test_data = {
	accounts: {
		"supermum1": {
			name: "Lady Gaga",
			email: "jnthnlstr@googlemail.com",
			phone: "07890 123456"
		},
		"supermum2": { /* JRL: not real data */
			name: "Dame Edna",
			email: "supermum2@sweetspot.com",
			phone: "07123 456789"
		}
	},
	createAppointment: {
		form_data: {
			superMumID: "supermum1",
			property: "53 Kenilworth Avenue",
			date: "2010-05-05",
			start_time: "12:00",
			student_name: "Bob-a-job",
			student_email: "bob@job.com",
			student_phone: "0789",
			attendees: [
				"jeff@koons.com",
				"philip@larkin.com"
			]
		},
		options_to_use: {
			title: "Viewing for 53 Kenilworth Avenue",
			description: "Hello Bob-a-job, \n\nYour booking for 53 Kenilworth Avenue is on 2010-05-05 at 12:00. \n\nIf you need to reschedule your booking, please contact your SuperMum (Lady Gaga) on: 07890 123456. \n\nYour contact details: 0789, bob@job.com. \n\nSee you soon! \n\nSweetSpot",
			where: "53 Kenilworth Avenue",
			startTime: new Date("Wed May 05 2010 12:00:00 GMT+0100 (BST)"),
			endTime: (function() { /* JRL: based on default slot length being 30 minutes */
				var d = new Date("Wed May 05 2010 12:00:00 GMT+0100 (BST)");
				return d.add(30).minutes();
			})(),
			organiser_name: "Lady Gaga",
			organiser_email: "jnthnlstr@googlemail.com",
			attendees: [{
				name: "Bob-a-job",
				email: "bob@job.com"
			},
			{
				name: "jeff@koons.com",
				email: "jeff@koons.com"
			},
			{
				name: "philip@larkin.com",
				email: "philip@larkin.com"
			}],
			accountID: "jnthnlstr@googlemail.com",
			calendarName: "viewings"
		}
	},
	listFreeSlots: {
		invalidAccountID: "supermum2",
		validAccountID: "supermum1"
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
		'test - it should throw an error if the following are not supplied as properties of an object - superMumID, property, date, start_time, student_name, student_email, student_phone, attendees': function() {
			assertException(function() { SweetSoft.createAppointment({}); });
		},
		'test - it should take data coming from the SweetSpot property pages and call GCal.newEvent with the options set correctly to create a new event': function(data) {
			var form_data = SweetSoft.test_data.createAppointment.form_data;
			var options_to_use = SweetSoft.test_data.createAppointment.options_to_use;

			var error;
			var old_newEvent = GCal.newEvent;
			GCal.newEvent = function(options) {
				try {
					assertEqual(options,options_to_use);
				} catch(e) {
					error = e;
				}
			};
			var old_accounts = SweetSoft.config.accounts;
			SweetSoft.config.accounts = SweetSoft.test_data.accounts;
			SweetSoft.createAppointment(form_data);
			GCal.newEvent = old_newEvent;
			SweetSoft.config.accounts = old_accounts;
			assertUndefined(error);
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
			var accountID = SweetSoft.test_data.listFreeSlots.invalidAccountID;
			var old_accounts = SweetSoft.config.accounts;
			SweetSoft.config.accounts = SweetSoft.test_data.accounts;
			assertException(function() { SweetSoft.listFreeSlots({
				accountID: accountID
			}) });
			SweetSoft.config.accounts = old_accounts;
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