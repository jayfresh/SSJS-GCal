/* this component should:

given a list of two calendar ID's, pull events from both when considering free/busy time
given a template for an event description (which is also a confirmation email), insert that into a new event
given a location for configuration, use that for: event description template, list of calendars and session tokens, minimum length of slot

requires:
system.use("com.google.code.date");
system.use("com.joyent.Resource");

*/
SweetSoft = {};
(function() {
	
	SweetSoft.config = getConfig(),
		DEFAULTS = {
			accounts = [],
			eventTitleTemplate: "Viewing for <%=property%>",
			eventDescriptionTemplate: "Hello <%=student_name%>, \n\n" +
			"Your booking for <%=property%> is at <%=date_time%>. \n\n" + 
			"If you need to reschedule your booking, please contact your SuperMum (<%=supermum_name%>) on: <%=supermum_phone%>. \n\n" +
			"Your contact details: <%=student_phone%>, <%=student_email%>. \n\n" +
			"See you soon! \n\nSweetSpot",
			minSlotMinutes: 30
		};
	
	SweetSoft.createAppointment = function(data) {
		var account = config.accounts[data.superMumID];
		var attendeeList = data.guest_emails, attendees = [];
		for(var i=0, il=attendeeList.length, email; i<il; i++) {
			email = attendeeList[i];
			attendees.push({
				name: email,
				email: email
			});
		}
		var options = {
			title: string_template(config.titleTemplate, data),
			description: string_template(config.descriptionTemplate, data),
			where: data.property,
			startMin: data.startTime,
			startMax: data.endTime,
			organiser_name: account.name,
			organiser_email: data.superMumID,
			attendees: attendees,
			sessionToken: account.sessionToken,
			calendarID: account.calendars.viewings
		};

		GCal.newEvent(options);
	};
	
	SweetSoft.listFreeSlots = function(superMumID) {
		var today = new Date.today(); // 00:00 today
		var tomorrow = today.add(2).day(); // to get to 24:00
		var superMumCalendars = config.accounts[superMumID].calendars;

		var freeTime = GCal.getEventsByTime(superMumCalendars.freetime, today, tomorrow);
		var bookedSlots = GCal.getEventsByTime(superMumCalendars.viewings, today, tomorrow);
		/* pseudo:
			set current freeTime slot to first freeTime slot
			set next booked slot to first booked slot
			
			start at beginning of current freeTime slot
			move to start of next booked slot - that defines start of next free slot
			
			calculate end of next free slot (check at least minSlotLength)
				check am before end of current freeTime slot
					if not, move to start of next freeTime slot
					if so, mark start of next freeTime slot
		
		*/
		/* TO-DO: return object with all time slots that are not already booked up
			something like: {
				today: [slots],
				tomorrow: [slots]
			}
		*/
	};
	
	function getConfig() {
		var accounts,
			eventTitleTemplate,
			eventDescriptionTemplate,
			minSlotMinutes;
		
		var missingOptions = [];
		
		accounts = GCal.listAccounts();
		if(!accounts.length) {
			missingOptions.push('accounts');
		}

		var AdminInfo = new Resource('adminInfo');
		function getAdminOption(id) {
			try {
				return AdminInfo.search(id).value;
			} catch(ex) {
				missingOptions.push(id);
			}
		}
		eventTitleTemplate = getAdminOption('eventTitleTemplate') || DEFAULTS.eventTitleTemplate;
		eventDescriptionTemplate = getAdminOption('eventDescriptionTemplate') || DEFAULTS.eventDescriptionTemplate;
		minSlotMinutes = getAdminOption('minSlotsMinutes') || DEFAULTS.minSlotsMinutes;
		
		if(missingOptions.length) {
			var e = new Error();
			e.message = "SweetSoft.GCal error: getConfig: missing or blank setup options: "+missingOptions.join(", ");
			throw e;
		}
		
		return {
			accounts: accounts,
			eventTitleTemplate: eventTitleTemplate,
			eventDescriptionTemplate: eventDescriptionTemplate,
			minSlotMinutes: minSlotMinutes
		};
	}
	
	// templating using "<% ... %>" (expressions) and "<%= ... %>" (values)
	// adapted from John Resig and Jeremy Ashkenas (MIT License)
	// http://ejohn.org/blog/javascript-micro-templating/
	// http://github.com/documentcloud/underscore
	function string_template(str, data) {
		var fn = new Function("obj",
			"var p=[];" +
			"with(obj){p.push(\'" +
			str
				.replace(/[\r\t\n]/g, " ")
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
