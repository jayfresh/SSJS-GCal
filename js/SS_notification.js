GET('/getNotifications', function() {
	var query = this.request.query;
	var accountID = query.accountID;
	SweetSoft.init();
	var response = SweetSoft.getNotifications(accountID);
	return JSON.stringify(response);
});

POST('/addNotification', function() {
	var query = this.request.body;
	var url = query.url,
		accountID = query.accountID;
	try {
		is_logged_in(this.session, accountID);
	} catch(ex) {
		if(ex.type==='login') {
			return redirect('/login');
		} else {
			return "you can't do that with this account: "+this.session.email;
		}
	}
	SweetSoft.init();
	var response = SweetSoft.addNotification(accountID, url);
	var redirect_url = this.request.headers['Referer'] || 'http://'+this.request.headers.Host+'/';
	return redirect(redirect_url);
});

POST('/deleteNotification', function() {
	var query = this.request.body;
	var url = query.url,
		accountID = query.accountID;
	try {
		is_logged_in(this.session, accountID);
	} catch(ex) {
		if(ex.type==='login') {
			return redirect('/login');
		} else {
			return "you can't do that with this account: "+this.session.email;
		}
	}
	SweetSoft.init();
	var response = SweetSoft.deleteNotification(accountID, url);
	var redirect_url = this.request.headers['Referer'] || 'http://'+this.request.headers.Host+'/';
	return redirect(redirect_url);
});

SweetSoft.getNotifications = function(accountID) {
	if(!accountID) {
		throw new Error("Error: SweetSoft.getNotifications: no accountID");
	}
	var config = SweetSoft.config;
	var account = config.accounts[accountID];
	if(!account) {
		throw new Error("Error: SweetSoft.getNotifications: problem getting account "+accountID);
	}
	return account.notifications;
};

SweetSoft.addNotification = function(accountID, url) {
	if(!accountID||!url) {
		throw new Error("Error: SweetSoft.addNotification: no accountID or url");
	}
	if(typeof url!=="string") {
		throw new Error("Error: SweetSoft.addNotification: url not a string");
	}
	var config = SweetSoft.config;
	var account = config.accounts[accountID];
	if(!account) {
		throw new Error("Error: SweetSoft.addNotification: problem getting account "+accountID);
	}
	if(!account.notifications) {
		account.notifications = []; // JRL: useful for migrating accounts from pre-notification version
	}
	var newNotificationCount = pushUnique(account.notifications,url);
	SweetSoft.updateAccount(accountID, account);
	return newNotificationCount;
};

SweetSoft.deleteNotification = function(accountID, url) {
	if(!accountID||!url) {
		throw new Error("Error: SweetSoft.deleteNotification: no accountID or url");
	}
	if(typeof url!=="string") {
		throw new Error("Error: SweetSoft.deleteNotification: url not a string");
	}
	var config = SweetSoft.config;
	var account = config.accounts[accountID];
	if(!account) {
		throw new Error("Error: SweetSoft.deleteNotification: problem getting account "+accountID);
	}
	var notifications = account.notifications;
	if(!notifications) {
		throw new Error("Error: SweetSoft.deleteNotification: trying to delete a notificaiton for an account that has no notifications: "+accountID);
	}
	var i = notifications.indexOf(url);
	if(i!==-1) {
		notifications.splice(i,1);
		SweetSoft.updateAccount(accountID, account);
		return notifications.length;
	} else {
		return false;
	}
};