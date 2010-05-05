/* TESTS for GCal.js

requires:
jsunity_0_6.js;

*/
GCal.test_data = {
	newEvent: {
		options: {
			sessionToken: "CKDwn_KyHxCIpNP9AxjC-JGcBw",
			calendarID: "default",
			title: "title",
			description: "description",
			where: "my location",
			startTime: "2010-05-04T12:00:00.000Z",
			endTime: "2010-05-04T13:30:00.000Z",
			organiser_name: "Jonny",
			organiser_email: "jonny@example.com",
			attendees: [{
				name: "Boris",
				email: "mayor@example.com"
			}, {
				name: "Jerome",
				email: "washedup@example.com"
			}]
		},
		xmlToSend: <entry xmlns="http://www.w3.org/2005/Atom" xmlns:gd="http://schemas.google.com/g/2005">
			<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/g/2005#event"></category>
			<title type="text">title</title>
			<content type="text">description</content>
			<author>
				<name>Jonny</name>
				<email>jonny@example.com</email>
			</author>
			<sendEventNotifications xmlns="http://schemas.google.com/gCal/2005" value="true" >
			</sendEventNotifications>
			<gd:transparency value="http://schemas.google.com/g/2005#event.opaque">
			</gd:transparency>
			<gd:eventStatus value="http://schemas.google.com/g/2005#event.confirmed">
			</gd:eventStatus>
			<gd:where valueString="my location"></gd:where>
			<gd:when startTime="2010-05-04T12:00:00.000Z" endTime="2010-05-04T13:30:00.000Z"></gd:when>
			<who xmlns="http://schemas.google.com/g/2005" rel="http://schemas.google.com/g/2005#event.attendee" valueString="Boris" email="mayor@example.com">
				<attendeeType value="http://schemas.google.com/g/2005#event.required">
				</attendeeType>
			</who>
			<who xmlns="http://schemas.google.com/g/2005" rel="http://schemas.google.com/g/2005#event.attendee" valueString="Jerome" email="washedup@example.com">
				<attendeeType value="http://schemas.google.com/g/2005#event.required">
				</attendeeType>
			</who>
		</entry>
	},
	getEventsByTime: {
		options: {
			sessionToken: "mock",
			calendarID: "test",
			startMin: "00:00",
			startMax: "04:00"
		}
	}
};
GCal.tests = {
	newEvent: {
		'test - it should throw an error if there are no options supplied': function() {
			assertException(function() { GCal.newEvent(); });
		},
		'test - it should throw an error if there is no sessionToken supplied and one is not set': function() {	
			assertException(function() { GCal.newEvent({}); });
		},
		'test - it should create correct event XML given an options object': function() {
			var request_old = system.http.request;
			system.http.request = function(method, url, headers, data) {
				return data;
			};
			var options = GCal.test_data.newEvent.options;
			var eventXML = GCal.newEvent(options);
			assertEquality(eventXML,GCal.test_data.newEvent.xmlToSend);
			system.http.request = request_old;
		},
		'test - it should add a new event to a calendar': function() {
			var options = GCal.test_data.newEvent.options;
			var response = GCal.newEvent(options);
			var eventXMLString = response.content;
			var re = new RegExp('<title>'+options.title+'<\/title>');
			assertMatch(re,eventXMLString);
		}
	},
	getEventsByTime: {
		'it should throw an error if there is no sessionToken supplied': function() {
			assertException(GCal.getEventsByTime());
		},
		'it should decode an atom feed of events into an array of objects': function() {
			// TO-DO: mock the makeCalRequest function to return some test XML
			var options = GCal.test_data.getEventsByTime.options;
			//var events = GCal.getEventsByTime(options);
			// TO-DO: verify the events array is correct
		},
		'it should return an array of event objects given a startMin and a startMax': function() {
			// TO-DO: make sure the startMin and startMax are legitimate times
			// TO-DO: make sure the calendar has some events between the startMin and startMax
			//var events = GCal.getEventsByTime(options);
			// TO-DO: make sure the events array is correct
		}
	}
};