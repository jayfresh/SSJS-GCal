function createEvent(options, callback) {
	FB.api('/me/events', 'post',
		options,
		function(response) {
			callback(response);
		});
}
function disableButton() {
	$('.panel').unbind('click');
}
window.facebook_options = {
	name: $('#options_name').text(),
	start_time: $('#options_start_time').text(),
	end_time: $('#options_end_time').text(),
	location: $('#options_location').text(),
	privacy_type: $('#options_privacy_type').text()
};
window.fbAsyncInit = function() {
	FB.init({
		appId: '193254260709251',
		status: true,
		cookie: true,
		xfbml: true
	});
	
	$('.panel').click(function(e) {
		e.preventDefault();
		createEvent(facebook_options, function(response) {
			if(response.id) {
				$('#results').html('Event created - <a href="http://www.facebook.com/event.php?eid='+response.id+'">click to visit</a>');
				disableButton();
			} else {
				FB.login(function(response) {
					if(response.session && response.perms.indexOf('create_event')!==-1) {
						createEvent(facebook_options, function(response) {
							if(response.id) {
								$('#results').html('Event created 2nd time round! <a href="http://www.facebook.com/event.php?eid='+response.id+'">Click to visit</a>');
								disableButton();
							} else {
								$('#results').text('There was a problem creating the event, even though you are logged in! sorry, please try again later.');
							}
						});
					} else {
						if(response.error && response.error.type === "OAuthException" || response.status === "notConnected") {
							$('#results').text('You have to let us into your account to create events!');
						} else {
							$('#results').text('There was a problem logging in');
						}
					}
				}, { perms: 'create_event' });
			}
		});
	
	});
	
	/*$('#logout').click(function() {
		FB.logout(function(response) {
			if(response.session) {
				$('#logout').after('error logging out! try again please.');
			} else {
				$('#logout').after('logged out!');
			}
		});
	});*/
	
};
function loadFacebookScript() {
	var e = document.createElement('script');
	e.async = true;
	e.src = 'http://connect.facebook.net/en_US/all.js';
	document.getElementById('fb-root').appendChild(e);
}
$(document).ready(function() {
	loadFacebookScript();
	
	/*var options = {
		name: 'This is one lovely event',
		start_time: '2011-03-17 14:43',
		end_time: '2011-03-17 15:43',
		location: 'My house!',
		privacy_type: 'SECRET'
	};*/
});
