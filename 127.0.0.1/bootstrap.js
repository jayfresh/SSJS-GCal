/* this component should:

given a list of email addresses, add them as invitees to an event
trigger sending email notifications when creating a new event
given a list of two calendar ID's, pull events from both when considering free/busy time
given a set of contact details, insert these into the description for a new event
given a time and calendar's owner's ID/name, create a new event in that calendar
given a template for an event description (which is also a confirmation email), insert that into a new event
given a location for configuration, use that for: event description template, list of calendars and session tokens, minimum length of slot

*/
system.use("com.google.code.date"); // include datejs lib


(function() {

	if(!SweetSoft) {
		SweetSoft = {};
	}

	var config = getConfig();
	var DEFAULTS = {
		calendars: {  // map by SuperMum_name: { freebusy: {id, sessionToken}, viewings: {id, sessionToken} }
			supermum1: {
				freebusy: {
					id: "1234",
					sessionToken: "5678"
				},
				viewings: {
					id: "9012",
					sessionToken: "3456"
				}
			},
			supermum2: {
				freebusy: {
					id: "abcd",
					sessionToken: "efgh"
				},
				viewings: {
					id: "ijkl",
					sessionToken: "mnop"
				}
			}
		}
		eventDescriptionTemplate: "Hello {name}, \n\n" +
		"Your booking for {house_address} is at {date_time}. \n\n" + 
		"If you need to reschedule your booking, please contact your SuperMum ({supermum_name}) on: {supermum_phone}. \n\n" +
		"Your contact details: {phone}, {email}. \n\n" +
		"See you soon! \n\nSweetSpot",
		minSlotMinutes: 30
	};

	/* public API */
	SweetSoft.GCal = {
		newEvent: function(options) {
			var superMumID = options.superMumID;
			var startTime = options.startTime;
			var student = options.student;
			var attendees = options.attendees;

			/* TO-DO: we might have to do a lookup via the superMumID for their email address/name */
			var calendar = config.calendars[superMumID].viewings;
			/* TO-DO: create event strings from config e.g. description from descriptionTemplate */
			var event = {
				title: "",
				description: "",
				startTime: startTime,
				organiser: superMumID,
				attendees: attendees
			};
			var eventXML = createEventXML(event);
			return createEvent(calendar,eventXML);
		},
		listFreeSlots: function(superMumID) {
			var today = new Date.today(); // 00:00 today
			var tomorrow = today.add(2).day(); // to get to 24:00
			var superMumConfig = config.calendars[superMumID];
			var busyTime = getEventsByDay(superMumConfig.freebusy,today,tomorrow);
			var bookedSlots = getEventsByDay(superMumConfig.viewings, today, tomorrow);
			/* TO-DO: return object with all time slots that are not already booked up
				something like: {
					today: [slots],
					tomorrow: [slots]
				}
			*/
		}
	};
	
	function getConfig() {
		/* TO-DO: get all bits of the config from the datastore; if debug mode is on, use DEFAULTS if elements are missing; otherwise, throw exception */
		var calendarIDs = DEFAULTS.calendarIDs;
		var eventDescriptionTemplate = DEFAULTS.eventDescriptionTemplate;
		var minSlotMinutes = DEFAULTS.minSlotMinutes;
		
		return {
			calendarIDs: calendarIDs,
			eventDescriptionTemplate: eventDescriptionTemplate,
			minSlotMinutes: minSlotMinutes
		};
	}

	function getEventsByDay(calendar, startDate, endDate) {
		makeCalRequest('events', calendar, {
			start: startDate,
			end: endDate
		});
	}
	
	function createEventXML(event) {
		var title = event.title;
		var description = event.description;
		var startTime = event.startTime;
		var organiser = event.organiser;
		var attendees = event.attendees;

		var eventXML = <entry xmlns='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005'>
			<category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/g/2005#event'></category>
			<title type='text'>/* TO-DO add title here */</title>
			<content type='text'>/* TO-DO add description here */</content>
			<sendEventNotifications xmlns="http://schemas.google.com/gCal/2005" value="true" />
			<gd:transparency value='http://schemas.google.com/g/2005#event.opaque'>
			</gd:transparency>
			<gd:eventStatus value='http://schemas.google.com/g/2005#event.confirmed'>
			</gd:eventStatus>
			<gd:where valueString='/* TO-DO: add property address here */'></gd:where>
			<gd:when startTime='/* TO-DO: add ISO-format start time here */' endTime='/* TO-DO: add ISO-format end time here (equals start time plus slotLength)'></gd:when>
			/* TO-DO: figure out how to create gd:who's in a loop */
			<gd:who rel="http://schemas.google.com/g/2005#event.attendee" valueString="/*TO-DO: replace with attendee name here*/" email="/*TO-DO: replace with attendee email address here */">
				<gd:attendeeType value="http://schemas.google.com/g/2005#event.required"/>
			</gd:who>
		</entry>;
		
		return eventXML;
	}
	
	function createEvent(calendar, eventXML) {
		makeCalRequest({
			type: 'new',
			calendar: calendar,
			data: eventXML
		});
	}
	
	function makeCalRequest(options) {
		var type = options.type,
			calendar = options.calendar,
			data = options.data,
			url = "http://www.google.com/calendar/feeds",
			requestBody,
			query,
			method = "GET",
			headers = [];
		
		if(type === 'new') {
			method = "POST";
			url += "/default/private/full";
		}
		if (type === 'events') {
			calEmail = "";
			url += "/"+calEmail+"/private/basic"; // e.g. url = "http://www.google.com/calendar/feeds/vs92sk1epj8hs6o7l19b2n3flk@group.calendar.google.com/private/basic"
			var startDate = obj.start.toISOString(); // assumes Date object
			var endDate = obj.end.toISOString(); // assumes Date object
			query = "start-min="+startDate+"&"+"start-max"+endDate; // e.g. "start-min=2006-03-16T00:00:00&start-max=2006-03-24T23:59:59"
		}
		
		if(query) {
			url += "?" + query;
		}
		var sessionToken = calendar.sessionToken;
		headers.push(
			'Authorization', 'AuthSub token="'+sessionToken+'"',
			'GData-Version', '2'
		);
		var response = system.http.request(method, url, headers, data);
		return response;
	}
})();


/* TESTS */
SweetSpot.GCal.test_defaults = {
	superMumID: "supermum2",
	event: {
		start_time: "13:00",
		student_name: "Bob-a-job",
		student_email: "bob@job.com",
		attendees: [
			"jeff@koons.com",
			"philip@larkin.com"
		]
	}
};
SweetSpot.GCal.tests = {
	newEvent: function() {
		var superMumID = SweetSpot.GCal.test_defaults.superMumID;
		var test_event = SweetSpot.GCal.test_defaults.event;
		var startTime = test_event.start_time;
		var student = {
			name: test_event.student_name,
			email: test_event.student_email
		};
		var attendees = test_event.attendees;
		
		var createdEvent = SweetSpot.GCal.newEvent({
			superMumID: superMumID,
			startTime: startTime,
			student: student,
			attendees: attendees
		});
		/* TO-DO: verify that createdEvent contains what I expect it to contain */
	},
	listFreeSlots: function() {
		var freeSlots = SweetSpot.GCal.listFreeSlots(SweetSpot.GCal.test_defaults.superMumID);
		/* TO-DO: verify that freeSlots contains what I expect it to contain */
	}
};
