/* this component should:

given a list of email addresses, add them as invitees to an event
trigger sending email notifications when creating a new event
given a set of contact details, insert these into the description for a new event
given a time and calendar's owner's ID/name, create a new event in that calendar
given a string for an event description (which is also a confirmation email), insert that into a new event

requires:
system.use("com.google.code.date");

TO-DO: provide mechanism to authorise your Google account, get and save your session token against your email address (ID); provide mechanism to list saved ID's and session tokens

*/
var GCal = {};
(function() {
	
	var currentSessionToken;

	/* public API */
	GCal.newEvent = function(options) {
		/* TO-DO: handle the gsessionid, save for future use, as this apparently improves performance
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
		if(!options) {
			throw new Error('Error: GCal.getEventsByTime: no options provided');
		}
		if(options.sessionToken) {
			setCurrentSessionToken(options.sessionToken);
		}
		var calendarID = options.calendarID;
		var startMin = options.startMin,
			startMax = options.startMax;
		/* JRL: if startMin/Max are not already Date objects, they are assumed to be ISO strings e.g. 2010-05-04T12:00:00.000Z */
		if(typeof startMin === "string") {
			var d = new Date();
			d.setISO8601(startMin);
			startMin = d;
		}
		if(typeof startMax === "string") {
			d = new Date();
			d.setISO8601(startMax);
			startMax = d;
		}
		var response = makeCalRequest({
			type: 'events',
			calendarID: calendarID,
			startMin: startMin,
			startMax: startMax
		});
		var eventsXML = makeXML(response);
		var atom = Namespace('http://www.w3.org/2005/Atom');
		var gd = Namespace('http://schemas.google.com/g/2005');
		var entries = eventsXML.atom::entry;
		var when, startTime, endTime, events = [];
		for each (var entry in entries) {
			when = entry.gd::when;
			startTime = when.@startTime.toString();
			endTime = when.@endTime.toString();
			if(startTime && endTime) {
				events.push({
					startTime: when.@startTime,
					endTime: when.@endTime	
				});
			}
		}
		return events;
	};
	GCal.clearSessionToken = function() {
		setCurrentSessionToken();
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
			url += "/"+calendarID+"/private/full";
			var startMin = options.startMin.toISOString();
			var startMax = options.startMax.toISOString();
			query = "start-min="+startMin+"&"+"start-max="+startMax;
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
		if(response.code !== '302' && response.code !== '200') {
			throw new Error('Error: GCal makeCalRequest: bad response code '+response.code+': '+response.content);
		}
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
	
	/* thanks to http://delete.me.uk/2005/03/iso8601.html for this function */
	Date.prototype.setISO8601 = function (string) {
		var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
			"(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
			"(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
		var d = string.match(new RegExp(regexp));
		
		var offset = 0;
		var date = new Date(d[1], 0, 1);
		
		if (d[3]) { date.setMonth(d[3] - 1); }
		if (d[5]) { date.setDate(d[5]); }
		if (d[7]) { date.setHours(d[7]); }
		if (d[8]) { date.setMinutes(d[8]); }
		if (d[10]) { date.setSeconds(d[10]); }
		if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
		if (d[14]) {
			offset = (Number(d[16]) * 60) + Number(d[17]);
			offset *= ((d[15] == '-') ? 1 : -1);
		}
		
		offset -= date.getTimezoneOffset();
		time = (Number(date) + (offset * 60 * 1000));
		this.setTime(Number(time));
	}
		
})();

