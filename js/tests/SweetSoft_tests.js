// TO-DO: tests for the isAjax changes

SweetSoft.test_data = {
	init: {
		SweetSoftAccounts: [
			{
				id: "supermum1",
				name: "Lady Gaga",
				email: "jnthnlstr@googlemail.com",
				phone: "07890 123456"
			},
			{
				id: "supermum2",
				name: "Dame Edna",
				email: "supermum2@sweetspot.com",
				phone: "07123 456789"
			}
		],
		gCalAccounts: [
			{
				id: "supermum1",
				accountID: "jnthnlstr@googlemail.com",
				sessionToken: "fg3hg94ugjvm___cFg",
				calendars: {
					"Jeff's calendar": "jnthnlstr@googlemail.com"
				}
			},
			{
				id: "supermum2",
				accountID: "supermum2@sweetspot.com",
				sessionToken: "ghthu___hr___ghfjfj",
				calendars: {
					"freetime": "supermum2@calendar.google.com",
					"viewings": "supermum2@sweetspot.com"
				}
			}
		],
		mergedAccounts: {
			"supermum1": {
				id: "supermum1",
				name: "Lady Gaga",
				email: "jnthnlstr@googlemail.com",
				phone: "07890 123456",
				calendars: {
					"Jeff's calendar": "jnthnlstr@googlemail.com"
				}
			},
			"supermum2": {
				id: "supermum2",
				name: "Dame Edna",
				email: "supermum2@sweetspot.com",
				phone: "07123 456789",
				calendars: {
					"freetime": "supermum2@calendar.google.com",
					"viewings": "supermum2@sweetspot.com"
				}
			}
		}
	},
	createAppointment: {
		form_data: {
			superMumID: "supermum1",
			property: "53 Kenilworth Avenue",
			date: "2010-05-05",
			start_time: "2010-05-05T12:00:00.000Z",
			first_name: "Bob-a-job",
			last_name: "Jones",
			student_email: "bob@job.com",
			student_phone: "0789",
			attendees: [
				"jeff@koons.com",
				"philip@larkin.com"
			]
		},
		options_to_use: {
			title: "Viewing for 53 Kenilworth Avenue",
			description: "Hello Bob-a-job Jones, \n\nYour booking for 53 Kenilworth Avenue is on 5/5/2010 at 13:00. \n\nIf you need to reschedule your booking, please contact your SuperMum (Lady Gaga) on: 07890 123456. \n\nYour contact details: 0789, bob@job.com. \n\nSee you soon! \n\nSweetSpot",
			where: "53 Kenilworth Avenue",
			startTime: (function() {
				var d = new Date("Wed May 05 2010 13:00:00 GMT+0100 (BST)");
				return d.toISOString();
			})(),
			endTime: (function() {
				var d = new Date("Wed May 05 2010 13:00:00 GMT+0100 (BST)");
				d.add(30).minutes(); /* JRL: based on default slot length being 30 minutes */
				return d.toISOString();
			})(), /* function being used here to that _orient is set on endTime object */
			organiser_name: "Lady Gaga",
			organiser_email: "jnthnlstr@googlemail.com",
			attendees: [{
				name: "Bob-a-job Jones",
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
			accountName: "supermum1",
			calendarID: "viewings"
		}
	},
	listFreeSlots: {
		invalidAccountID: "supermum1",
		validAccountID: "supermum2",
		viewingsEvents: [{
			startTime: "2010-05-08T09:30:00.000Z",
			endTime: "2010-05-08T10:00:00.000Z"
		}, {
			startTime: "2010-05-08T15:15:00.000Z",
			endTime: "2010-05-08T15:45:00.000Z"
		}],
		freetimeEvents: [{
			startTime: "2010-05-08T09:00:00.000Z",
			endTime: "2010-05-08T13:00:00.000Z"
		}, {
			startTime: "2010-05-08T14:30:00.000Z",
			endTime: "2010-05-08T18:00:00.000Z"
		}],
		availableSlots: {
			"2010-05-07T23:00:00.000Z": [{ // it's BST at this point
				startTime: "2010-05-08T09:00:00.000Z",
				endTime: "2010-05-08T09:30:00.000Z"
			}, {
				startTime: "2010-05-08T10:00:00.000Z",
				endTime: "2010-05-08T10:30:00.000Z"
			}, {
				startTime: "2010-05-08T10:30:00.000Z",
				endTime: "2010-05-08T11:00:00.000Z"
			}, {
				startTime: "2010-05-08T11:00:00.000Z",
				endTime: "2010-05-08T11:30:00.000Z"
			}, {
				startTime: "2010-05-08T11:30:00.000Z",
				endTime: "2010-05-08T12:00:00.000Z"
			}, {
				startTime: "2010-05-08T12:00:00.000Z",
				endTime: "2010-05-08T12:30:00.000Z"
			}, {
				startTime: "2010-05-08T12:30:00.000Z",
				endTime: "2010-05-08T13:00:00.000Z"
			}, {
				startTime: "2010-05-08T14:30:00.000Z",
				endTime: "2010-05-08T15:00:00.000Z"
			}, {
				startTime: "2010-05-08T15:45:00.000Z",
				endTime: "2010-05-08T16:15:00.000Z"
			}, {
				startTime: "2010-05-08T16:15:00.000Z",
				endTime: "2010-05-08T16:45:00.000Z"
			}, {
				startTime: "2010-05-08T16:45:00.000Z",
				endTime: "2010-05-08T17:15:00.000Z"
			}, {
				startTime: "2010-05-08T17:15:00.000Z",
				endTime: "2010-05-08T17:45:00.000Z"
			}]
		}
	}
};

/* for setting up test data -

SweetSoft has two datastores - the admininfo, and the accounts. I could seed the accounts with some test data, and deal with the authentication the first time they're run - the GCal lib should store the sessionTokens for the accountID's after the first time

*/

SweetSoft.tests = {
	init: {
		suiteName: 'init',
		'test - it should throw an error if there are no gCal accounts in the datastore': function() {
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return [];
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				return SweetSoft.test_data.init.SweetSoftAccounts;
			};
			assertException(SweetSoft.init);
		},
		'test - it should throw an error if there are no SweetSoft accounts in the datastore': function() {
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return SweetSoft.test_data.init.gCalAccounts;
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				return [];
			};
			assertException(SweetSoft.init);
		},
		'test - it should throw an error if there are different numbers of SweetSoft accounts to gCal accounts in the datastore': function() {
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return SweetSoft.test_data.init.gCalAccounts;
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				return [
					SweetSoft.test_data.init.SweetSoftAccounts[0]
				];
			};
			assertException(SweetSoft.init);
		},
		'test - it should throw an error if not all gCal accounts match up to SweetSoft accounts using the id property to match them': function() {
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return SweetSoft.test_data.init.gCalAccounts;
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				var tmpAccounts = [], accounts = SweetSoft.test_data.init.SweetSoftAccounts;
				var clone = function(toClone) {
					var obj = {};
					for(var i in toClone) {
						if(toClone.hasOwnProperty(i)) {
							obj[i] = toClone[i];
						}
					}
					return obj;
				};
				for(var i=0, il=accounts.length, tmpAccount; i<il; i++) {
					tmpAccount = clone(accounts[i]);
					tmpAccount.id = 'fail'+i;
					tmpAccounts.push(tmpAccount);
				}
				return tmpAccounts;
			};
			assertException(SweetSoft.init);
		},
		'test - it should set SweetSoft.config.accounts to the result of merging the SweetSoft accounts with the gCal accounts': function() {
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return SweetSoft.test_data.init.gCalAccounts;
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				return SweetSoft.test_data.init.SweetSoftAccounts;
			};
			SweetSoft.init();
			assertEqual(SweetSoft.test_data.init.mergedAccounts,SweetSoft.config.accounts);
		}
	},
	createAppointment: {
		suiteName: 'createAppointment',
		'test - it should throw an error if no arguments are supplied': function() {
			assertException(function() { SweetSoft.createAppointment(); });
		},
		'test - it should throw an error if the following are not supplied as properties of an object - superMumID, property, date, start_time, first_name, last_name, student_email, student_phone, attendees': function() {
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
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return SweetSoft.test_data.init.gCalAccounts;
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				return SweetSoft.test_data.init.SweetSoftAccounts;
			};
			SweetSoft.init();
			SweetSoft.config.accounts = SweetSoft.test_data.init.mergedAccounts;
			SweetSoft.createAppointment(form_data);
			GCal.newEvent = old_newEvent;
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
		'test - it should throw an error if no "freetime" and "viewings" properties exist for the account specified by accountID': function() {
			var accountID = SweetSoft.test_data.listFreeSlots.invalidAccountID;
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return SweetSoft.test_data.init.gCalAccounts;
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				return SweetSoft.test_data.init.SweetSoftAccounts;
			};
			SweetSoft.init();
			// TO-DO: restore the mocked functions here!
			assertException(function() { SweetSoft.listFreeSlots({
				accountID: accountID
			}) });
		},
		'test - it should a list of slots over the next week that are indicated as free on the freetime calendar and do not have bookings made for them in the viewings calendar': function() {
			var old_gCalListAccounts = GCal.listAccounts;
			GCal.listAccounts = function() {
				GCal.listAccounts = old_gCalListAccounts;
				return SweetSoft.test_data.init.gCalAccounts;
			};
			var old_SweetSoftListAccounts = SweetSoft.listAccounts;
			SweetSoft.listAccounts = function() {
				SweetSoft.listAccounts = old_SweetSoftListAccounts;
				return SweetSoft.test_data.init.SweetSoftAccounts;
			};
			var old_getEventsByTime = GCal.getEventsByTime;
			GCal.getEventsByTime = function(options) {
				var calendarID = options.calendarID;
				var events;
				if(calendarID===SweetSoft.config.viewingsCalendarName) {
					events = SweetSoft.test_data.listFreeSlots.viewingsEvents;
				} else if(calendarID===SweetSoft.config.freetimeCalendarName) {
					events = SweetSoft.test_data.listFreeSlots.freetimeEvents;
				}
				return events;
			};
			SweetSoft.init();
			var accountID = SweetSoft.test_data.listFreeSlots.validAccountID;
			var slots = SweetSoft.listFreeSlots({
				accountID: accountID
			});
			GCal.getEventsByTime = old_getEventsByTime;
			assertEqual(SweetSoft.test_data.listFreeSlots.availableSlots, slots);
		}
	}
};