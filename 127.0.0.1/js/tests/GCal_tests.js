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
			startTime: "2010-05-05T12:00:00.000Z",
			endTime: "2010-05-05T13:30:00.000Z",
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
			sessionToken: "CKDwn_KyHxCIpNP9AxjC-JGcBw",
			calendarID: "default",
			startMin: "2010-05-05T11:00:00.000Z",
			startMax: "2010-05-05T14:30:00.000Z"
		},
		responseXML: <feed xmlns='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005' gd:etag='W/"DU4ERH47eCp7ImA9WxRVEkQ."'>
			<id>http://www.google.com/calendar/feeds/jo@gmail.com/private-magicCookie/full</id>
			<updated>2006-03-29T07:35:59.000Z</updated>
			<title type='text'>Jo March</title>
			<subtitle type='text'>This is my main calendar.</subtitle>
			<link rel='http://schemas.google.com/g/2005#feed' type='application/atom+xml' href='http://www.google.com/calendar/feeds/jo@gmail.com/private-magicCookie/full'></link>
			<link rel='self' type='application/atom+xml' href='http://www.google.com/calendar/feeds/jo@gmail.com/private-magicCookie/full'></link>
			<author>
				<name>Jo March</name>
				<email>jo@gmail.com</email>
			</author>
			<generator version='1.0' uri='http://www.google.com/calendar/'>CL2</generator>
			<gd:where valueString='California'></gd:where>
			<entry gd:etag='"EE4NTgBGfCp7ImA6WhVV"'>
				<id>http://www.google.com/calendar/feeds/jo@gmail.com/private-magicCookie/full/entryID</id>
				<published>2006-03-30T22:00:00.000Z</published>
				<updated>2006-03-28T05:47:31.000Z</updated>
				<category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/g/2005#event'></category>
				<title type='text'>Lunch with Darcy</title>
				<content type='text'>Lunch to discuss future plans.</content>
				<link rel='alternate' type='text/html' href='http://www.google.com/calendar/event?eid=aTJxcnNqbW9tcTJnaTE5cnMybmEwaW04bXMgbWFyY2guam9AZ21haWwuY29t' title='alternate'></link>
				<link rel='self' type='application/atom+xml' href='http://www.google.com/calendar/feeds/jo@gmail.com/private-magicCookie/full/entryID'></link>
				<author>
					<name>Jo March</name>
					<email>jo@gmail.com</email>
				</author>
				<gd:transparency value='http://schemas.google.com/g/2005#event.opaque'></gd:transparency>
				<gd:eventStatus value='http://schemas.google.com/g/2005#event.confirmed'></gd:eventStatus>
				<gd:comments>
				<gd:feedLink
				href='http://www.google.com/calendar/feeds/jo@gmail.com/private-magicCookie/full/entryID/comments/'></gd:feedLink>
				</gd:comments>
				<gd:when startTime='2006-03-30T22:00:00.000Z' endTime='2006-03-30T23:00:00.000Z'></gd:when>
				<gd:where></gd:where>
			</entry>
		</feed>
	}
};

/* at the moment, the tests will result in one new event being created in your default calendar; you will have to remove it if you want the getEventsByTime tests to pass the next time you run the tests */

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
		'test - it should throw an error if there are no options supplied': function() {
			assertException(function() { GCal.getEventsByTime(); });
		},
		'test - it should throw an error if there is no sessionToken supplied': function() {
			GCal.clearSessionToken();
			assertException(function() { GCal.getEventsByTime({}); });
		},
		'test - it should decode an atom feed of events into an array of objects': function() {
			var options = GCal.test_data.getEventsByTime.options;
			var request_old = system.http.request;
			system.http.request = function(method, url, headers, data) {
				return {
					code: '200',
					content: GCal.test_data.getEventsByTime.responseXML
				}
			};
			var events = GCal.getEventsByTime(options);
			assertEqual(events.length, 1);
			system.http.request = request_old;
		},
		'test - it should return an array of event objects given a startMin and a startMax': function() {
			var options = GCal.test_data.getEventsByTime.options;
			var events = GCal.getEventsByTime(options);
			assertEqual(events.length, 1);
		}
	}
};