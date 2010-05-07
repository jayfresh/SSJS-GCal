/* this component should:

given a list of email addresses, add them as invitees to an event
trigger sending email notifications when creating a new event
given a set of contact details, insert these into the description for a new event
given a time and calendar's owner's ID/name, create a new event in that calendar
given a string for an event description (which is also a confirmation email), insert that into a new event

requires:
system.use("com.joyent.Sammy");
system.use("com.google.code.date");

TO-DO: provide mechanism to list saved ID's and session tokens

GCal stores accounts as a "GCalAccount" Resource. Each account has this structure:
{
	id: "person1",
	accountID: "jeff.smith@example.org",
	sessionToken: "fg3hg94ugjvm___cFg",
	calendars: [{
		name: "Jeff's calendar",
		id: "jeffff@gmail.com"
	}]
}

*/

/* new routes to support AuthSub set up */
GET('/auth', function() {
	var host = this.request.headers.Host;
	var url = "https://www.google.com/accounts/AuthSubRequest?scope=http%3A%2F%2Fwww.google.com%2fcalendar%2Ffeeds%2F&session=1&secure=0&next=http%3A%2F%2F"+host+"%2Fsession";
	return redirect(url);
});

GET('/session', function() {
	var token = this.request.query.token;
	var redirect = this.request.query.redirect || '';
	if(!token) {
		return "no token in query";
	} else {
		var sessionToken = GCal.convertTokenToSessionToken(token);
		redirect('/newAccount?sessionToken='+sessionToken);
	}
});

GET('/newAccount', function() {
	var sessionToken = this.request.query.sessionToken;
	var accountName = this.request.query.accountName;
	var account = GCal.getAccountForToken(sessionToken);
	var writeSuccess = GCal.storeNewAccount(accountName, account);
	return objToString(account); // JRL: debug - remove this line and uncomment one below
	//redirect('/'+redirect+'?id='+id+'&sessionToken='+sessionToken+'&writeSuccess='+writeSuccess);
});

/* this is an example use, not fundamental to API */
GET('/listAccounts', function() {
	var accounts = GCal.listAccounts();
	/* TO-DO: convert accounts into an array, so can test length with accounts.length */
	accounts = objToString(accounts);
	return "<h1>Accounts</h1>\n" + accounts;
});

var GCal = {};
(function() {
	
	var currentSessionToken;

	/* public API */
	GCal.resourceName = "GCalAccount";
	GCal.convertTokenToSessionToken = function(token) {
		var url = "https://www.google.com/accounts/AuthSubSessionToken";
		var headers = [
			'Authorization', 'AuthSub token="'+token+'"'
		];
		var response = system.http.request("GET", url, headers);
		var sessionToken = response.content.split('=')[1];
		sessionToken = sessionToken.replace(/\s/g,"");
		return sessionToken;
	};
	GCal.getAccountForToken = function(sessionToken) {
		setCurrentSessionToken({
			sessionToken: sessionToken
		});
		var response = makeCalRequest({
			type: 'listCalendars'
		});
		var xml = makeXML(response);
		var atom = Namespace('http://www.w3.org/2005/Atom');
		var author = xml.atom::author;
		var accountID = author.atom::email; /* JRL: this assumes a person's id is the same as their gmail address */
		var entries = xml.atom::entry;
		var calendars = [], id, title;
		for each (var entry in entries) {
			id = entry.atom::id.toString();
			id = id.substring(id.lastIndexOf('/')+1);
			title = entry.atom::title.toString();
			calendars.push({
				id: id
				title: title
			});
		}
		return {
			accountID: accountID,
			sessionToken: sessionToken,
			calendars: calendars
		}
	};
	GCal.storeNewAccount = function(accountName, account) {
		if(!accountName) {
			throw new Error("Error: GCal.storeNewAccount: no account name provided");
		}
		if(account.accountID && account.sessionToken) {
			obj.id = accountName;
			return system.datastore.write(GCal.resourceName, obj);
		} else {
			throw new Error("Error: GCal.storeNewAccount: no accountID or sessionToken provided in account");
		}
	};
	GCal.listAccounts = function() {
		var accounts = system.datastore.search(GCal.resourceName, {});
		return accounts;
	};
	GCal.newEvent = function(options) {
		if(!options) {
			throw new Error('Error: GCal.newEvent: no options provided');
		}
		setCurrentSessionToken(options);
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
		setCurrentSessionToken(options);
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
	GCal.listCale
	/* JRL: not including this until have a use case
	GCal.clearSessionToken = function() {
		setCurrentSessionToken();
	};*/
	
	function getCurrentSessionToken() {
		if(!currentSessionToken) {
			throw new Error('no session token set');
		}
		return currentSessionToken;
	}
	
	function setCurrentSessionToken(options) {
		var token, account, accountID;
		if(!options) {
			currentSessionToken = null;
		} else if(options.sessionToken) {
			token = options.sessionToken;
		} else if(options.accountID) {
			accountID = options.accountID;
			account = GCal.getAccounts()[accountID];
			if(account && account.sessionToken) {
				token = account.sessionToken;
			} else {
				throw new Error('Error: GCal setCurrentSessionToken: no token for accountID '+accountID);
			}
		} else {
			throw new Error('Error: GCal setCurrentSessionToken: bad token: '+token);
		}
		currentSessionToken = token;
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
			data = options.data,
			url = "http://www.google.com/calendar/feeds",
			query,
			method = "GET",
			headers = options.headers || [];
		
		/* JRL: /settings is experimental, so not using it now
		if(type === 'settings') {
			url += '/default/settings';
		}*/
		if(type === 'listCalendars') {
			url += '/default';
		}
		if(type === 'new') {
			method = "POST";
			url += "/default/private/full";
		}
		if (type === 'events') {
			var calendarID = options.calendarID;
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
			'GData-Version', '2',
			'Cookie', ''
		);
		var response = system.http.request(method, url, headers, data);
		if(response.code !== '302' && response.code !== '200' && response.code !== '201') {
			throw new Error('Error: GCal makeCalRequest for '+url+': bad response code '+response.code+': '+response.content+' ... '+headers[0]+' '+headers[1]+' '+headers[2]+' '+headers[3]);
		}
		/* is this even necessary? I don't know if system.http.request follows 302's */
		if(response.code === '302') {
			location = response.headers.location;
			/* TO-DO: handle the gsessionid, save for future use, as this apparently improves performance; although the "S" cookie has a similar effect and is also important */
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

