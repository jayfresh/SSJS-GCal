/*
I want to test:

* admin view
** an endpoint for a form to POST to, to add a new URL for notification when events are booked
** a similar endpoint for deleting a URL
** a listing of endpoints

* notification
** that all the URL's in an account's list are called when an event is booked

*/


SS_notification_tests = {
	admin: {
		suiteName: 'admin',
		'test - when I POST a URL to /addNotification, the URL is available when /getNotifications is called': function() {
			var accountID = "supermum2";
			var url = "http://example.com";
			SweetSoft.init();
			SweetSoft.config.accounts = SS_notification_test_data.admin.SweetSoftAccounts;
			var old_get = system.datastore.get;
			system.datastore.get = function() {
				system.datastore.get = old_get;
				return {};
			};
			var old_write = system.datastore.write;
			system.datastore.write = function() {
				system.datastore.write = old_write;
				return true;
			};
			SweetSoft.addNotification(accountID, url);
			var list = SweetSoft.getNotifications(accountID);
			assertTrue(list.indexOf(url)!==-1);
		},
		'test - if I POST anything other than a string as the second argument to /addNotification, it throws an error': function() {
			var accountID = "supermum1";
			assertException(function() { SweetSoft.addNotification(accountID, {}) });
		},
		'test - if I call addNotification without supplying an accountID as the first argument, it throws an error': function() {
			assertException(function() { SweetSoft.addNotification(); });
			assertException(function() { SweetSoft.addNotification("notavalidID"); });			
		},
		'test - when I POST a URL to /deleteNotification, the URL is no longer available when /getNotifications is called': function() {
			var accountID = "supermum1";
			var url = "http://example.com";
			SweetSoft.init();
			SweetSoft.config.accounts = SS_notification_test_data.admin.SweetSoftAccounts;
			var list = SweetSoft.getNotifications(accountID);
			assertTrue(list.indexOf(url)!==-1);
			var old_get = system.datastore.get;
			system.datastore.get = function() {
				system.datastore.get = old_get;
				return {};
			};
			var old_write = system.datastore.write;
			system.datastore.write = function() {
				system.datastore.write = old_write;
				return true;
			};
			SweetSoft.deleteNotification(accountID, url);
			list = SweetSoft.getNotifications(accountID);
			assertTrue(list.indexOf(url)===-1);
		},
		'test - if I POST anything other than string as the second argument to /deleteNotification, it throws an error': function() {
			var accountID = "supermum1";
			assertException(function() { SweetSoft.deleteNotification(accountID, {}) });
		},
		'test - if I call deleteNotification without supplying an accountID as the first argument, it throws an error': function() {
			assertException(function() { SweetSoft.deleteNotification(); });
			assertException(function() { SweetSoft.deleteNotification("notavalidID"); });			
		},
		'test - when I call /getNotifications, I get an array of all the notifications URLs attached to an account': function() {
			var accountID = "supermum1";
			SweetSoft.init();
			SweetSoft.config.accounts = SS_notification_test_data.admin.SweetSoftAccounts;
			var list = SweetSoft.getNotifications(accountID);
			assertEqual(list,SS_notification_test_data.admin.SweetSoftAccounts[accountID].notifications);
		},
		'test - if I call /getNotifications without an accountID it throws an error': function() {
			assertException(function() { SweetSoft.getNotifications() });
		}
	},
	notification: {
		suiteName: 'notification',
		'test - when I book a viewing, all the notification URLs attached to the account are called': function() {
			var old_newEvent = GCal.newEvent;
			GCal.newEvent = function(options) {
				return <event>test!</event>;
			};
			var old_http = system.http.request;
			var called_count = 0;
			var expected_called = SS_notification_test_data.admin.SweetSoftAccounts["supermum1"].notifications;
			system.http.request = function(method, url) {
				if(expected_called.indexOf(url)!==-1) {
					called_count++;
				}
				return true;
			}
			SweetSoft.init();
			SweetSoft.config.accounts = SS_notification_test_data.admin.SweetSoftAccounts;
			var form_data = SS_notification_test_data.notification.form_data;
			SweetSoft.createAppointment(form_data);
			assertEqual(called_count, expected_called.length);
			system.http.request = old_http;
		}
	}
};

SS_notification_test_data = {
	admin: {
		SweetSoftAccounts: {
			"supermum1": {
				id: "supermum1",
				name: "Lady Gaga",
				email: "jnthnlstr@googlemail.com",
				phone: "07890 123456",
				notifications: ["http://example.com", "http://sweetspot.com"]
			},
			"supermum2": {
				id: "supermum2",
				name: "Dame Edna",
				email: "supermum2@sweetspot.com",
				phone: "07123 456789",
				notifications: []
			}
		}
	},
	notification: {
		form_data: {
			superMumID: "supermum1",
			property: "53 Kenilworth Avenue",
			date: "2010-05-05",
			start_time: "2010-05-05T12:00:00.000Z",
			student_name: "Bob-a-job",
			student_email: "bob@job.com",
			student_phone: "0789",
			attendees: [
				"jeff@koons.com",
				"philip@larkin.com"
			]
		}
	}
};