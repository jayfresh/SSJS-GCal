/* this component should:

given a list of two calendar ID's, pull events from both when considering free/busy time
given a template for an event description (which is also a confirmation email), insert that into a new event
given a location for configuration, use that for: event description template, list of calendars and session tokens, minimum length of slot

requires:
system.use("com.google.code.date");
system.use("com.joyent.Resource");

SweetSoft stores accounts as a "SweetSoftAccount" resource. An account has this structure:
{
	id: "person1"
	name: "Jeff Smith"
	email: "jeff.smith@example.org"
	phone: "07123 456789"
}

During config setup, SweetSoft gets the accounts from Gcal and merges the 'calendars' property. It matches by looking for accounts with an id equal to the id of the SweetSoft account. SweetSoft.config.accounts is set to an object of this structure:
{
	person1: {
		id: "person1",
		name: "Jeff Smith",
		email: "jeff.smith@example.org",
		phone: "07123 456789",
		calendars: {
			"Jeff's calendar": "jeffff@gmail.com"
		}
	}
}

TO-DO: write tests for account creation

TO-DO: write the mechanism for saving the admin info

TO-DO: protect the admin system with a password

TO-DO: get the input backgrounds pre-loading on the booking page - Josh to make sprites

*/

POST('/createAppointment', function() {
	var query = this.request.body,
		options = {
			superMumID: query.superMumID,
			property: query.property,
			start_time: query.start_time,
			student_name: query.student_name,
			student_email: query.student_email,
			student_phone: query.student_phone,
			attendees: query.attendees
		};
	
	// clean up data
	if(options.attendees) {
		options.attendees = options.attendees.split(",");
		for(var i=0,il=options.attendees.length; i<il; i++) {
			options.attendees[i] = options.attendees[i].replace(/^\s+|\s+$/g, ""); // from jQuery.trim
		}
	}
	
	// check CAPTCHA
	var captchaURL = "http://api-verify.recaptcha.net/verify";
	var privatekey = SweetSoft.captcha.private_key; // This comes from a settings JS file not committed to the repo
	var remoteip = "127.0.0.1"; // TO-DO: make this use the correct IP!
	var challenge = query.recaptcha_challenge_field;
	var response = query.recaptcha_response_field;
	var data = "privatekey="+privatekey+"&remoteip="+remoteip+"&challenge="+challenge+"&response="+response;
	var headers = [
		'Content-Type','application/x-www-form-urlencoded'
	];
	var captcha = system.http.request("POST", captchaURL, headers, data);
	var response_lines = captcha.content.split('\n');
	var captcha_status = response_lines[0];
	var captcha_error = response_lines[1];
	if(captcha_status === "false" && captcha_error) {
		return redirect('/booking?accountID='+options.superMumID+'&property='+options.property+'&error='+encodeURIComponent(captcha_error));
	}
	
	SweetSoft.init();
	var response = SweetSoft.createAppointment(options);
	this.options = options;
	return template('/thanks.html');
});

GET('/booking', function() {
	var query = this.request.query;
	var accountID = query.accountID,
		property = query.property,
		error = query.error;
	if(!accountID || !property) {
		return "<p>Please add these fields</p><form action='/booking' method='GET'><label for='accountID'>Account ID:</label><input type='text' name='accountID' id='accountID' size='40' /><label for='property'>Property address:</label><input type='text' name='property' id='property' size='40' /><input type='submit' /></form>";
	}
	SweetSoft.init();
	var dayList = SweetSoft.listFreeSlots({
		accountID: accountID
	});
	var days = [],
		earliestSlot,
		slots,
		d,
		count=0;
	for(var day in dayList) {
		d = new Date.today();
		slots = dayList[day];
		
		if(count===0) {
			var earliest = slots[0],
				earliestStart = d.clone();
			earliestStart.setISO8601(earliest.startTime);
			var dayDiff = Math.floor((earliestStart - d) / (24 * 60 * 60 * 1000));
			var dayLabel = dayDiff === 0 ? "Today" : (dayDiff === 1 ? "Tomorrow" : earliestStart.getDayName());
			count++;
			earliestSlot = {
				timeLabel: earliestStart.toString("HH:mm"),
				dayLabel: dayLabel
			};
			earliest.earliest = true;
		}
		
		d.setISO8601(day);
		for(var i=0, il=slots.length, slot, dd; i<il; i++) {
			slot = slots[i];
			dd = new Date.today();
			dd.setISO8601(slot.startTime);
			slot.timeLabel = dd.toString('HH:mm');
		}
		days.push({
			label: d.getDayName()[0],
			slots: slots
		});
	}
	this.accountID = accountID;
	this.property = property;
	this.earliestSlot = earliestSlot;
	this.days = days;
	this.error = error;
	return template('/booking.html');
});

GET('/listFreeSlots', function() {
	var accountID = this.request.query.accountID;
	SweetSoft.init();
	var days = SweetSoft.listFreeSlots({
		accountID: accountID
	});
	var dayList = {};
	for(var day in days) {
		var slotList = days[day];
		for(var i=0, il=slotList.length, slots=[]; i<il; i++) {
			slots.push(objToString(slotList[i]));
			dayList[day] = slots.join(", ");
		}
	}
	return objToString(dayList);
});

GET('/newSweetSoftAccount', function() {
	var host = this.request.headers.Host;
	var query = this.request.query,
		accountName = query.accountName,
		url = query.redirect,
		token = query.token,
		name = query.name,
		phone = query.phone,
		url = query.redirect || '';
	if(!token) {
		var encodedQuery = "";
		for(var i in query) {
			encodedQuery += "&"+i+"="+encodeURIComponent(query[i]);
		}
		encodedQuery = encodedQuery.substring(1);
		var next = "http://"+host+"/newSweetSoftAccount?"+encodedQuery;
		var gAuthURL = "https://www.google.com/accounts/AuthSubRequest?scope=http%3A%2F%2Fwww.google.com%2fcalendar%2Ffeeds%2F&session=1&secure=0&next="+encodeURIComponent(next);
		return redirect(gAuthURL);
	} else {
		var sessionToken = GCal.convertTokenToSessionToken(token);
		var GCalAccount = GCal.getAccountForToken(sessionToken);
		var writeSuccess = GCal.storeNewAccount(accountName, GCalAccount);
		if(!writeSuccess) {
			return "there was an error creating a new GCal account for accountName "+accountName;
		} else {
			var SweetSoftAccount = {
				id: accountName,
				name: name,
				email: GCalAccount.accountID,
				phone: phone
			};
			writeSuccess = SweetSoft.storeNewAccount(accountName, SweetSoftAccount);
			if(!writeSuccess) {
				return "there was an error creating the SweetSoft account (although the GCal account was successfully created for accountName "+accountName;
			}
		}
	}
	return redirect('/'+url+'?writeSuccess='+writeSuccess);
});

GET('/deleteSweetSoftAccount', function() {
	var accountName = this.request.query.accountName;
	var url = this.request.headers['Referer'] || 'http://'+this.request.headers.Host+'/';
	var removeSuccess = SweetSoft.removeAccount(accountName);
	return redirect(url);
});

GET('/listSweetSoftAccounts', function() {
	var out = "";
	var accounts = SweetSoft.listAccounts();
	out += "<h1>SweetSoft Accounts</h1>";
	out += "<form action='/deleteSweetSoftAccount' method='GET'><ul>";
	out += "<ul>";
	for(var i=0, il=accounts.length, account; i<il; i++) {
		account = accounts[i];
		out += "<li>"+account.id+"<input type='radio' name='accountName' value='"+account.id+"' />";
		out += "<br />"+objToString(account)+"</li>";
	}
	out += "</ul>";
	out += "<input type='submit' value='remove account' /></form>";
	out += "<h2>Create a new account</h2>";
	out += "<form method='GET' action='/newSweetSoftAccount'>" +
		"<label for='accountName'>account name e.g. supermum1</label>" +
		"<input type='text' size='40' id='accountName' name='accountName' /><br />" +
		"<label for='name'>SuperMum name</label>" +
		"<input type='text' size='40' id='name' name='name' /><br />" +
		"<label for='phone'>SuperMum phone number</label>" +
		"<input type='text' size='40' id='phone' name='phone' /><br />" +
		"<input type='submit' /></form>";
	return out;
});

GET('/listEventsThisWeek', function() {
	var query = this.request.query,
		accountID = query.accountID,
		calendar = query.calendar,
		today = new Date.today(), // 00:00 today
		nextWeek = today.clone().add(7).day();
	var events = GCal.getEventsByTime({
		accountName: accountID,
		calendarID: calendar,
		startMin: today,
		startMax: nextWeek
	});
	var out = "";
	for(var i=0,il=events.length;i<il;i++) {
		out += objToString(events[i]);
	}
	return out;
});

SweetSoft = {};
(function() {
	
	var DEFAULTS = {
		accounts: {},
		eventTitleTemplate: "Viewing for <%=property%>",
		eventDescriptionTemplate: "Hello <%=student_name%>, \n\n" +
		"Your booking for <%=property%> is on <%=date%> at <%=start_time%>. \n\n" + 
		"If you need to reschedule your booking, please contact your SuperMum (<%=supermum_name%>) on: <%=supermum_phone%>. \n\n" +
		"Your contact details: <%=student_phone%>, <%=student_email%>. \n\n" +
		"See you soon! \n\nSweetSpot",
		slotLengthMinutes: 30,
		viewingsCalendarName: "viewings",
		freetimeCalendarName: "freetime"
	};
	
	SweetSoft.resourceName = "SweetSoftAccount";
	
	SweetSoft.init = function(force) {
		try {
			SweetSoft.config = getConfig();
		} catch(e) {
			throw new Error('Error: SweetSoft.init: '+e.message);
		}
	};
	SweetSoft.createAppointment = function(data) {
		try {
			verifyOptions(data, [
				'superMumID',
				'property',
				'start_time',
				'student_name',
				'student_email',
				'student_phone'
			]);
		} catch(e) {
			throw new Error("Error: SweetSoft.createAppointment: "+e.message);
		}
		var config = SweetSoft.config;
		var account = config.accounts[data.superMumID];
		if(!account) {
			throw new Error("Error: SweetSoft.createAppointment: problem getting account "+data.superMumID);
		}
		var attendeeList = data.attendees,
			attendees = [{
				name: data.student_name,
				email: data.student_email
			}];
		for(var i=0, il=attendeeList.length, email; i<il; i++) {
			email = attendeeList[i];
			attendees.push({
				name: email,
				email: email
			});
		}
		// enhance data object before templating
		data.supermum_name = account.name;
		data.supermum_phone = account.phone;
		var startTime = new Date.today();
		startTime.setISO8601(data.start_time);
		var format = "d/M/yyyy";
		data.date = startTime.toString(format);
		data.start_time = startTime.toString('HH:mm');
		var endTime = startTime.clone().add(config.slotLengthMinutes).minutes();
		startTime = startTime.toISOString();
		endTime = endTime.toISOString();
		var options = {
			title: string_template(config.eventTitleTemplate, data),
			description: string_template(config.eventDescriptionTemplate, data),
			where: data.property,
			startTime: startTime,
			endTime: endTime,
			organiser_name: account.name,
			organiser_email: account.email,
			attendees: attendees,
			accountName: data.superMumID,
			calendarID: config.viewingsCalendarName
		};
		return GCal.newEvent(options);
	};
	
	SweetSoft.listFreeSlots = function(options) {
		try {
			verifyOptions(options, [
				'accountID'
			]);
		} catch(e) {
			throw new Error("Error: SweetSoft.listFreeSlots: "+e.message);
		}

		var today = new Date.today(), // 00:00 today
			nextWeek = today.clone().add(7).day(),
			config = SweetSoft.config,
			superMumID = options.accountID,
			viewingsCalendarName = SweetSoft.config.viewingsCalendarName,
			freetimeCalendarName = SweetSoft.config.freetimeCalendarName;
		if(!config.accounts[superMumID]) {
			throw new Error("Error: SweetSoft.listFreeSlots: can't find account for "+superMumID);
		}
		var superMumCalendars = config.accounts[superMumID].calendars;
		verifyOptions(superMumCalendars, [
			viewingsCalendarName,
			freetimeCalendarName
		]);
		var bookedSlots = GCal.getEventsByTime({
			accountName: superMumID,
			calendarID: viewingsCalendarName,
			startMin: today,
			startMax: nextWeek
		});
		var freetimeSlots = GCal.getEventsByTime({
			accountName: superMumID,
			calendarID: freetimeCalendarName,
			startMin: today,
			startMax: nextWeek
		});
		
		/* pseudo:
			loop while there are freetime slots:
				move to start of next freetime slot
				loop:
					create a slot (check it fits; if not, break)
					move to end of slot
		*/
		var findStartTime = function(slotArray, time) {
			var slot,
				slotStart,
				slotEnd;
			for(var i=0, il=slotArray.length; i<il; i++) {
				slot = slotArray[i];
				slotStart = new Date.today();
				slotStart.setISO8601(slot.startTime);
				slotEnd = new Date.today();
				slotEnd.setISO8601(slot.endTime);
				if(slotStart.compareTo(time) >= 0) {
					return {
						index: i,
						time: slotStart
					}
				} else if(slotEnd.compareTo(time) >= 0) {
					return {
						index: i,
						time: time
					};
				} else {
					continue;
				}
			}
			return start;
		}
		var startTracker = new Date.now(),
			freeSlotEndTracker,
			endTracker,
			dayTracker,
			duration = SweetSoft.config.slotLengthMinutes,
			slots = {},
			slot,
			duration,
			nextViewingsSlot = {
				viewings: bookedSlots,
				index: 0,
				startTime: "",
				endTime: "",
				movePast: function(time) {
					var viewing,
						viewingStart,
						viewingEnd;
					if(nextViewingsSlot.startTime && nextViewingsSlot.startTime.compareTo(time) > 0) {
						return;
					}
					do {
						viewing = nextViewingsSlot.viewings[nextViewingsSlot.index];
						if(viewing) {
							viewingStart = new Date.today();
							viewingStart.setISO8601(viewing.startTime);
							nextViewingsSlot.startTime = viewingStart;
							viewingEnd = viewingStart.clone();
							viewingEnd.setISO8601(viewing.endTime);
							nextViewingsSlot.endTime = viewingEnd;
							nextViewingsSlot.index++;
						} else {
							nextViewingsSlot.startTime = null;
							nextViewingsSlot.endTime = null;
							return;
						}
					} while(viewingStart.compareTo(time) < 0);
				}
			};
		var start = findStartTime(freetimeSlots, startTracker);
		if(!start) {
			throw new Error("Error: SweetSoft.listFreeSlots: can't find any freetime slots in the future");
		}
		for(var i=start.index, il=freetimeSlots.length, freetimeSlot; i<il; i++) {
			freetimeSlot = freetimeSlots[i];
			if(i!==start.index) {
				startTracker.setISO8601(freetimeSlot.startTime);
			} else {
				startTracker = start.time;
			}
			freeSlotEndTracker = startTracker.clone();
			freeSlotEndTracker.setISO8601(freetimeSlot.endTime);
			dayTracker = startTracker.clone().clearTime().toISOString();
			nextViewingsSlot.movePast(startTracker);
			while(1) {
				endTracker = startTracker.clone().add(duration).minutes();
				if(endTracker.compareTo(freeSlotEndTracker) > 0) {
					break; // i.e. move onto next freetimeSlot
				} else if(nextViewingsSlot.startTime && endTracker.compareTo(nextViewingsSlot.startTime) > 0) {
					startTracker = nextViewingsSlot.endTime; // i.e. skip past the nextViewingsSlot
					nextViewingsSlot.movePast(startTracker);
				} else {
					duration = (endTracker - startTracker) / (60 * 1000);
					if(SweetSoft.config.slotLengthMinutes >= duration) {
						if(!slots[dayTracker]) {
							slots[dayTracker] = [];
						}
						slots[dayTracker].push({
							startTime: startTracker.toISOString(),
							endTime: endTracker.toISOString()
						});
					}
					startTracker = endTracker;
				}
			}
		}
		return slots;
	};
	
	SweetSoft.storeNewAccount = function(accountName, account) {
		account.id = accountName;
		try {
			verifyOptions(account, [
				'id',
				'name',
				'email',
				'phone'
			]);
		} catch(e) {
			throw new Error('Error SweetSoft.storeNewAccount: '+e.message);
		}
		return system.datastore.write(SweetSoft.resourceName, account);
	};
	SweetSoft.removeAccount = function(accountName) {
		if(!accountName) {
			throw new Error("Error: SweetSoft.deleteAccount: no account name provided");
		}
		return system.datastore.remove(SweetSoft.resourceName, accountName);
	};
	SweetSoft.listAccounts = function() {
		var accounts = system.datastore.search(SweetSoft.resourceName, {});
		return accounts;
	};
	
	function getConfig() {
		var AdminInfo = new Resource('SweetSoftAdminInfo');
		function getAdminOption(id) {
			var option = AdminInfo.search(id)[0];
			if(option) {
				return option.value;
			}
		}
		var gCalAccounts = GCal.listAccounts();
		if(!gCalAccounts.length) {
			throw new Error('no accounts returned by GCal.listAccounts');
		}
		var SweetSoftAccounts = SweetSoft.listAccounts();
		if(!SweetSoftAccounts.length) {
			throw new Error('no accounts returned by SweetSoft.listAccounts');
		}
		if(SweetSoftAccounts.length !== gCalAccounts.length) {
			throw new Error('There are a different number of SweetSoft accounts ('+SweetSoftAccounts.length+') to gCal accounts ('+gCalAccounts.length+')');
		}
		for(var i=0, il=SweetSoftAccounts.length, tmpObj={}, tmpAccount; i<il; i++) {
			tmpAccount = SweetSoftAccounts[i];
			tmpObj[tmpAccount.id] = tmpAccount;
		}
		SweetSoftAccounts = tmpObj;
		/* match SweetSoftAccounts to gCalAccounts and merge calendars property */
		var SweetSoftAccount, accountNames = [], accountName;
		for(var i=0, il=gCalAccounts.length, gCalAccount; i<il; i++) {
			gCalAccount = gCalAccounts[i];
			accountName = gCalAccount.id;
			accountNames.push(accountName);
			SweetSoftAccount = SweetSoftAccounts[accountName];
			if(SweetSoftAccount) {
				SweetSoftAccount.calendars = gCalAccount.calendars;
			}
		}
		verifyOptions(SweetSoftAccounts, accountNames); // this checks that there are SweetSoft accounts for all GCalAccounts
		var config = {
			accounts: SweetSoftAccounts,
			eventTitleTemplate: getAdminOption('eventTitleTemplate') || DEFAULTS.eventTitleTemplate,
			eventDescriptionTemplate: getAdminOption('eventDescriptionTemplate') || DEFAULTS.eventDescriptionTemplate,
			slotLengthMinutes: getAdminOption('slotLengthMinutes') || DEFAULTS.slotLengthMinutes,
			viewingsCalendarName: getAdminOption('viewingsCalendarName') || DEFAULTS.viewingsCalendarName,
			freetimeCalendarName: getAdminOption('freetimeCalendarName') || DEFAULTS.freetimeCalendarName
		};
		verifyOptions(config, [
			'accounts',
			'eventTitleTemplate',
			'eventDescriptionTemplate',
			'slotLengthMinutes',
			'viewingsCalendarName',
			'freetimeCalendarName'
		]);
		return config;
	}
	
	/* utils */
	
	function verifyOptions(obj, optionsList) {
		var e, missingOptions = [];
		if(!obj) {
			e = new Error();
			e.message = 'no arguments supplied';
			throw e;
		}
		for(var i=0, il=optionsList.length, option; i<il; i++) {
			option = optionsList[i];
			if(!obj[option]) {
				missingOptions.push(option);
			}
		}
		if(missingOptions.length) {
			e = new Error();
			e.message = 'missing options - '+missingOptions.join(", ")+'; object: '+objToString(obj);
			throw e;
		}
		return true;
	}
	
	// templating using "<% ... %>" (expressions) and "<%= ... %>" (values)
	// adapted from John Resig and Jeremy Ashkenas (MIT License)
	// http://ejohn.org/blog/javascript-micro-templating/
	// http://github.com/documentcloud/underscore
	function string_template(str, data) {
		/* JRL: changed to support '\n' characters in templates
			modified first replace function - it was:
			.replace(/[\r\t\n]/g, " ")
			and added
			.replace(/\n/g,"\\n")
		*/
		var fn = new Function("obj",
			"var p=[];" +
			"with(obj){p.push(\'" +
			str
				.replace(/[\r\t]/g, " ")
				.replace(/\n/g, "\\n")
				.split("<%").join("\t")
				.replace(/((^|%>)[^\t]*)'/g, "$1\r")
				.replace(/\t=(.*?)%>/g, "',$1,'")
				.split("\t").join("');")
				.split("%>").join("p.push('")
				.split("\r").join("\\'") +
			"');}return p.join('');");
		return data ? fn(data) : fn;
	}

})();
