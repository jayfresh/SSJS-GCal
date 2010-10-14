/* this component should:

given a list of email addresses, add them as invitees to an event
trigger sending email notifications when creating a new event
given a set of contact details, insert these into the description for a new event
given a time and calendar's owner's ID/name, create a new event in that calendar
given a string for an event description (which is also a confirmation email), insert that into a new event

requires:
system.use("com.joyent.Sammy");
system.use("com.google.code.date");

GCal stores accounts as a "GCalAccount" Resource. Each account has this structure:
{
	id: "person1",
	accountID: "jeff.smith@example.org",
	sessionToken: "fg3hg94ugjvm___cFg",
	calendars: {
		"Jeff's calendar": "jeffff@gmail.com"
	}
}

TO-DO: write tests for account creation

*/

/* new routes to support AuthSub set up */
GET('/auth', function() {
	var host = this.request.headers.Host;
	var accountName = this.request.query.accountName;
	if(!accountName) {
		return "Please provide an accountName parameter";
	}
	var url = "https://www.google.com/accounts/AuthSubRequest?scope=http%3A%2F%2Fwww.google.com%2fcalendar%2Ffeeds%2F&session=1&secure=0&next=http%3A%2F%2F"+host+"%2Fsession?accountName="+encodeURIComponent(accountName);
	return redirect(url);
});

GET('/session', function() {
	var query = this.request.query,
		token = query.token,
		accountName = query.accountName;
	if(!token) {
		return "no token in query";
	} else {
		var sessionToken = GCal.convertTokenToSessionToken(token);
		return redirect('/newGCalAccount?sessionToken='+sessionToken+'&accountName='+accountName);
	}
});

GET('/newGCalAccount', function() {
	try {
		is_logged_in(this.session);
	} catch(ex) {
		return redirect('/login');
	}
	var query = this.request.query,
		accountName = query.accountName,
		sessionToken = query.sessionToken,
		path = query.redirect || 'listAccounts';
	var account = GCal.getAccountForToken(sessionToken);
	var writeSuccess = GCal.storeNewAccount(accountName, account);
	return redirect('/'+path+'?id='+id+'&sessionToken='+sessionToken+'&writeSuccess='+writeSuccess);
});

GET('/deleteGCalAccount', function() {
	var accountName = this.request.query.accountName;
	try {
		is_logged_in(this.session, accountName);
	} catch(ex) {
		if(ex.type==='login') {
			return redirect('/login');
		} else {
			return "you can't do that with this account: "+this.session.email;
		}
	}
	var url = this.request.headers['Referer'] || 'http://'+this.request.headers.Host+'/';
	var removeSuccess = GCal.removeAccount(accountName);
	return redirect(url);
});

GET('/listGCalAccounts', function() {
	try {
		is_logged_in(this.session);
	} catch(ex) {
		return redirect('/login');
	}
	var accounts = GCal.listAccounts();
	var out = "";
	out += "<h1>GCal Accounts</h1>";
	out += "<form action='/deleteGCalAccount' method='GET'><ul>";
	for(var i=0, il=accounts.length, account, calendars, calendarNames; i<il; i++) {
		account = accounts[i];
		calendars = account.calendars;
		calendarNames = [];
		for(var calendar in calendars) {
			calendarNames.push(calendar);
			calendarNames.push(calendars[calendar]);
		}
		calendarNames = calendarNames.join(", ");
		out += "<li>"+account.id+"<input type='radio' name='accountName' value='"+account.id+"' />";
		out += "<br />calendarNames: "+calendarNames;
		out += "<br />"+objToString(account)+"</li>";
	}
	out += "</ul>";
	out += "<input type='submit' value='remove account' /></form>";
	return out;
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
		var accountID = author.atom::email.text(); /* JRL: this assumes a person's id is the same as their gmail address */
		var entries = xml.atom::entry;
		var calendars = {}, id, title;
		for each (var entry in entries) {
			id = entry.atom::id.toString();
			id = id.substring(id.lastIndexOf('/')+1);
			title = entry.atom::title.toString();
			calendars[title] = id;
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
			account.id = accountName;
			return system.datastore.write(GCal.resourceName, account);
		} else {
			throw new Error("Error: GCal.storeNewAccount: no accountID or sessionToken provided in account");
		}
	};
	GCal.getAccount = function(accountName) {
		if(!accountName) {
			throw new Error("Error: GCal.getAccount: no account name provided");
		}
		return system.datastore.get(GCal.resourceName, accountName);
	};
	GCal.removeAccount = function(accountName) {
		if(!accountName) {
			throw new Error("Error: GCal.deleteAccount: no account name provided");
		}
		return system.datastore.remove(GCal.resourceName, accountName);
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
		var account = GCal.getAccount(options.accountName);
		var calendar = account.calendars[calendarID];
		if(!calendar) {
			throw new Error("Error: GCal.newEvent: account "+options.accountName+" does not contain calendar "+calendarID);
		}
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
		return createEvent(calendar,eventXML);
	};
	GCal.getEventsByTime = function(options) {
		if(!options) {
			throw new Error('Error: GCal.getEventsByTime: no options provided');
		}
		setCurrentSessionToken(options);
		var calendarID = options.calendarID;
		var account = GCal.getAccount(options.accountName);
		var calendar = account.calendars[calendarID];
		if(!calendar) {
			throw new Error("Error: GCal.newEvent: account "+accountName+" does not contain calendar "+calendarID);
		}
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
			calendarID: calendar,
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
	//GCal.listCale
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
		} else if(options.accountName) {
			accountName = options.accountName;
			account = GCal.getAccount(accountName);
			if(!account) {
				throw new Error("Error: GCal setCurrentSessionToken: no account for accountName "+accountName+"... "+GCal.getAccount(accountName).length);
			} else if(account.sessionToken) {
				token = account.sessionToken;
			} else {
				throw new Error('Error: GCal setCurrentSessionToken: no token for accountName '+accountName);
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
			headers = options.headers || [],
			calendarID = options.calendarID;
		
		/* JRL: '/settings' is experimental, so not using it now
		if(type === 'settings') {
			url += '/default/settings';
		}*/
		if(type === 'listCalendars') {
			url += '/default';
		}
		if(type === 'new') {
			method = "POST";
			url += "/"+calendarID+"/private/full";
		}
		if (type === 'events') {
			url += "/"+calendarID+"/private/full";
			var startMin = options.startMin.toISOString();
			var startMax = options.startMax.toISOString();
			query = "start-min="+startMin+"&start-max="+startMax;
			query += "&singleevents=true&recurrence-expansion-start="+startMin+"&recurrence-expansion-end="+startMax;
			query += "&orderby=starttime&sortorder=ascending";
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
		function checkResponse(response) {
			if(response.code !== '302' && response.code !== '200' && response.code !== '201') {
				throw new Error('Error: GCal makeCalRequest for '+url+': bad response code '+response.code+': '+response.content+' ... '+headers[0]+' '+headers[1]+' '+headers[2]+' '+headers[3]);
			}
		}
		var response = system.http.request(method, url, headers, data);
		checkResponse(response);
		if(response.code === '302') {
			location = response.headers.location;
			/* TO-DO: handle the gsessionid, save for future use, as this apparently improves performance; although the "S" cookie has a similar effect and is also important */
			//var gsessionid = location.substring(location.indexOf('?')+1).split('=')[1];
			/* TO-DO: that gsessionid setting is not correct, as it should take into account when parameters already exist */
			response = system.http.request(method, location, headers, data);
			checkResponse(response);
		}
		return response;
	}
	
	/* utilities */
	
	function makeXML(response) {
		var feedXML = response.content.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, ""); // E4X bug 336551
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

