/* TO-DO:

- the CATPCHA custom theme doesn't work with non-JS - "get new words" doesn't get new words

*/

jQuery.validator.addMethod("phoneUK", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, "");
    return this.optional(element) || /^\d+$/.test(phone_number);
}, "Please specify a valid phone number");

jQuery.validator.addMethod("emailList", function(list, element) {
	list = list.split(",");
	var valid = true;
	var emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;
	$.each(list, function(i, email) {
		email = $.trim(email);
		if(email && !emailRegex.test(email)) {
			valid = false;
			return false;
		}
	});
	return valid;
}, "Valid emails only please");

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

$(document).ready(function() {
	$("#bookingSystem").validate();
});

$(document).ready(function() {
	$('.onlyjs').css('visibility', 'visible');
	
	/* interaction between big booking button, label and the radio buttons */
	var bookSlot_orig = $('#bookSlot').val();
	$('#bookSlot').val(bookSlot_orig+" "+earliestSlot.timeLabel+" "+earliestSlot.dayLabel);
	var $days = $('#week div.day');
	var $radios = $('input[type=radio]');
	$radios.click(function() {
		var iClicked = $radios.index(this);
		if(iClicked===0) {
			$('#earlierSlot').addClass('unclickable');
		} else if(iClicked===$radios.length-1) {
			$('#laterSlot').addClass('unclickable');
		} else {
			$('#earlierSlot, #laterSlot').removeClass('unclickable');
		}
	
		var $day = $(this).closest('div.day');
		var start_time = $(this).val(); // e.g. "2010-05-12T15:00:00.000Z"
		var i = $days.index($day);
		var timeLabel = this.id.substring(this.id.length-5);
		var d = new Date();
		d.setISO8601(start_time);
		var now = new Date();
		var dayDiff = d.getDate() - now.getDate();
		var monthDiff = d.getMonth() - now.getMonth();
		var yearDiff = d.getYear() - now.getYear();
		var dayLabel = "";
		if(monthDiff===0 && yearDiff===0) {
			if(dayDiff===0) {
				dayLabel = "Today";
			} else if(dayDiff===1) {
				dayLabel = "Tomorrow";
			} else {
				if(i===0) {
					dayLabel = earliestSlot.dayLabel;
				} else {
					dayLabel = start_time.substring(8,10)+"/"+start_time.substring(5,7);
				}
			}
		} else {
			dayLabel = start_time.substring(8,10)+"/"+start_time.substring(5,7);
		}
		$('#bookSlot').val(bookSlot_orig+" "+timeLabel+" "+dayLabel);
		if(i!==0 || timeLabel!==earliestSlot.timeLabel) {
			$('#slotLabel').text("Chosen slot: "+timeLabel+" "+dayLabel);
			//$('#nextSlot').css('visibility','hidden');
		} else {
			$('#slotLabel').text("The next available slot is "+timeLabel+" "+dayLabel);
			//$('#nextSlot').css('visibility', 'visible');
		}
	});
	$('span.radio').live("click", function() {
		$(this).next().click();
	});
	
	/* earlier/later buttons */
	$('#earlierSlot, #laterSlot').click(function(e) {
		e.preventDefault();
		if($(this).hasClass('unclickable')) {
			return false;
		}
		var direction = this.id === 'earlierSlot' ? -1 : 1;
		var i = $radios.index($radios.filter(':checked'));
		i += direction;
		$radios.eq(i).click();
	});
	
	$radios.filter(':checked').eq(0).click();
});