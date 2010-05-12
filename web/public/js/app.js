/* TO-DO:

- the CATPCHA custom theme doesn't work with non-JS - "get new words" doesn't get new words

*/

$(document).ready(function() {
	$('.onlyjs').css('visibility', 'visible');
	
	/* interaction between big booking button, label and the radio buttons */
	var bookSlot_orig = $('#bookSlot').val();
	$('#bookSlot').val(bookSlot_orig+" "+earliestSlot.timeLabel+" "+earliestSlot.dayLabel);
	var $days = $('#week div.day');
	var $radios = $('input[type=radio]');
	$('input[type=radio]').click(function() {
	
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
		var timeLabel = this.id.substring(1);
		var dayLabel = "";
		if(i===0) {
			dayLabel = "Today";
		} else if(i===1) {
			dayLabel = "Tomorrow";
		} else {
			dayLabel = start_time.substring(8,10)+"/"+start_time.substring(5,7);
		}
		$('#bookSlot').val(bookSlot_orig+" "+timeLabel+" "+dayLabel);
		if(i!==0 || timeLabel!==earliestSlot.timeLabel) {
			$('#nextSlot').css('visibility','hidden');
		} else {
			$('#nextSlot').css('visibility', 'visible');
		}
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
});