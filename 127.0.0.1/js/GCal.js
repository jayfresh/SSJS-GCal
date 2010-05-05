/* this component should:

given a list of email addresses, add them as invitees to an event
trigger sending email notifications when creating a new event
given a set of contact details, insert these into the description for a new event
given a time and calendar's owner's ID/name, create a new event in that calendar
given a string for an event description (which is also a confirmation email), insert that into a new event

requires:
system.use("com.google.code.date");

*/
var GCal = {};
(function() {
	
	var currentSessionToken;

	/* public API */
	GCal.newEvent = function(options) {
		/* TO-DO: handle the gsessionid, as it is not present and that is causing 400 errors, I guess
			url example: http://www.google.com/calendar/feeds/default/private/full?gsessionid=pHYtJI3L2ZGy09AQycVaEA
		 */
		if(!options) {
			throw new Error('Error: GCal.newEvent: no options provided');
		}
		if(options.sessionToken) {
			setCurrentSessionToken(options.sessionToken);
		}
		var calendarID = options.calendarID;
		
		var event = {
			title: options.title,
			description: options.description,
			where: options.where,
			startTime: options.startTime,
			endTime: options.endTime,
			organiser_name: options.organiser_name,
			organiser_email: options.organiser_email,
			attendees: options.attendees
		};
		
		var eventXML = createEventXML(event);
		return createEvent(calendarID,eventXML);
	};
	GCal.getEventsByTime = function(options) {
		if(options.sessionToken) {
			setCurrentSessionToken(options.sessionToken);
		}
		var calendarID = options.calendarID;
		var response = makeCalRequest('events', calendarID, {
			startMin: options.startMin,
			startMax: options.startMax
		});
		var eventsXML = makeXML(response);
		var atom = Namespace('http://www.w3.org/2005/Atom');
		var gd = Namespace('http://schemas.google.com/g/2005');
		var entries = eventsXML.atom::entry;
		var when, startTime, endTime, events = [];
		for each (var entry in entries) {
			when = entry.gd::when;
			events.push({
				startTime: when.@startTime,
				endTime: when.@endTime	
			});
		}
		return events;
	};
	
	function getCurrentSessionToken() {
		if(!currentSessionToken) {
			throw new Error('no session token set');
		}
		return currentSessionToken;
	}
	
	function setCurrentSessionToken(sessionToken) {
		currentSessionToken = sessionToken;
	}
		
	function createEventXML(event) {
		var eventXML = <entry xmlns="http://www.w3.org/2005/Atom" xmlns:gd="http://schemas.google.com/g/2005">
			<category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/g/2005#event"></category>
			<title type="text">{event.title}</title>
			<content type="text">{event.description}</content>
			<author>
				<name>{event.organiser_name}</name>
				<email>{event.organiser_email}</email>
			</author>
			<sendEventNotifications xmlns="http://schemas.google.com/gCal/2005" value="true" >
			</sendEventNotifications>
			<gd:transparency value="http://schemas.google.com/g/2005#event.opaque">
			</gd:transparency>
			<gd:eventStatus value="http://schemas.google.com/g/2005#event.confirmed">
			</gd:eventStatus>
			<gd:where valueString={event.where}></gd:where>
			<gd:when startTime={event.startTime} endTime={event.endTime}></gd:when>
		</entry>;	
		
		var attendees = event.attendees;
		// TO-DO: test this XML form out - does it create the correct attendees on an event? - as I've made the gd namespace a part of the who node, rather than using gd.who and gd.attendeeType
		for(var i=0, il=attendees.length, attendee; i<il; i++) {
			attendee = attendees[i];
			eventXML.who += <who xmlns="http://schemas.google.com/g/2005" rel="http://schemas.google.com/g/2005#event.attendee" valueString={attendee.name} email={attendee.email}>
				<attendeeType value="http://schemas.google.com/g/2005#event.required">
				</attendeeType>
			</who>;
		}
			
		
		return eventXML;
	}
	
	function createEvent(calendarID, eventXML) {
		return makeCalRequest({
			type: 'new',
			calendarID: calendarID,
			data: eventXML,
			headers: ['Content-Type','application/atom+xml']
		});
	}
	
	function makeCalRequest(options) {
		var type = options.type,
			calendarID = options.calendarID,
			data = options.data,
			url = "http://www.google.com/calendar/feeds",
			requestBody,
			query,
			method = "GET",
			headers = options.headers || [];
		
		if(type === 'new') {
			method = "POST";
			url += "/default/private/full";
		}
		if (type === 'events') {
			url += "/"+calendarID+"/private/basic"; // e.g. url = "http://www.google.com/calendar/feeds/vs92sk1epj8hs6o7l19b2n3flk@group.calendar.google.com/private/basic"
			var startMin = obj.startMin.toISOString();
			var startMax = obj.startMax.toISOString();
			query = "start-min="+startMin+"&"+"start-max"+startMax; // e.g. "start-min=2006-03-16T00:00:00&start-max=2006-03-24T23:59:59"
		}
		
		if(query) {
			url += "?" + query;
		}
		var sessionToken = getCurrentSessionToken();
		headers.push(
			'Authorization', 'AuthSub token="'+sessionToken+'"',
			'GData-Version', '2'
		);
		var response = system.http.request(method, url, headers, data);
		if(response.code === '302') {
			location = response.headers.location;
			/* JRL: could save the gsessionid for faster performance */
			var gsessionid = location.substring(location.indexOf('?')+1).split('=')[1];
			response = system.http.request(method, location, headers, data);
		}
		return response;
	}
	
	/* utilities */
	
	function makeXML(response) {
		var feedXML = response.content.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, ""); // bug 336551
		var xml = new XML(feedXML);
		return xml;
	}
	
})();

