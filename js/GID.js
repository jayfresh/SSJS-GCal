/* this component should:

- provide /login to start login process with Google OpenID
- provide /checkauth to handle response and set session variables if logged-in

Make sure enable('Sessions'); has been called somewhere e.g. bootstrap.js.

TO-DO: write tests for /login and /checkauth

*/

/* example XRDS file:
<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)"> 
  <XRD> 
    <Service priority="0"> 
      <Type>http://specs.openid.net/auth/2.0/server</Type> 
      <Type>http://openid.net/srv/ax/1.0</Type> 
      <Type>http://specs.openid.net/extensions/ui/1.0/mode/popup</Type> 
      <Type>http://specs.openid.net/extensions/ui/1.0/icon</Type> 
      <Type>http://specs.openid.net/extensions/pape/1.0</Type> 
      <URI>https://www.google.com/accounts/o8/ud</URI> 
    </Service> 
  </XRD> 
</xrds:XRDS>
*/
GET('/login', function() {
	var host = this.request.headers.Host;
	// first, get OpenID endpoint
	var url = "https://www.google.com/accounts/o8/id",
		headers = ['Accept','application/xrds+xml'];
	var response = system.http.request("GET", url, headers);
	var xml = makeXML(response);
	var ns = Namespace('xri://$xrd*($v*2.0)');
	//var author = xml.atom::author;
	var uri = xml.ns::XRD.ns::Service.ns::URI.toString();
	// now, redirect to login page
	var params = {
		"openid.ns": "http://specs.openid.net/auth/2.0",
		"openid.return_to": "http://"+host+"/checkauth",
		"openid.mode": "checkid_setup",
		"openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
		"openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
		"openid.ns.ax": "http://openid.net/srv/ax/1.0",
		"openid.ax.mode": "fetch_request",
		"openid.ax.required": "email",
		"openid.ax.type.email": "http://axschema.org/contact/email"
	};
	return redirect(uri+'?'+objToParamString(params));
});

GET('/sessionTest', function() {
	var q = this.request.query,
		session = this.session;
	if(q.name) {
		session.name = q.name;
		session.save();
		return "saved!";
	} else {
		return objToString(this.session);
	}
});

/* example response:
openid.ns=http://specs.openid.net/auth/2.0
&openid.mode=id_res
&openid.op_endpoint=https://www.google.com/accounts/o8/ud
&openid.response_nonce=2010-10-13T16:34:03Z2nxLo_g2fa9_ag
&openid.return_to=http://sweetsoft.joshuabradley.co.uk/checkauth
&openid.assoc_handle=AOQobUeHquhqrDXAOH-qfcQlREktVXICa781U-Em-NjcE8IQ7k47oxo-
&openid.signed=op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle,ns.ext1,ext1.mode,ext1.type.email,ext1.value.email
&openid.sig=9GQpWGkFOgProMjVb2bILLczxs4%3D
&openid.identity=https://www.google.com/accounts/o8/id%3Fid%3DAItOawn2dcFZ_TxaWtzqFC6JuTFbhOZ6SDRnM50
&openid.claimed_id=https://www.google.com/accounts/o8/id%3Fid%3DAItOawn2dcFZ_TxaWtzqFC6JuTFbhOZ6SDRnM50
&openid.ns.ext1=http://openid.net/srv/ax/1.0
&openid.ext1.mode=fetch_response
&openid.ext1.type.email=http://axschema.org/contact/email
&openid.ext1.value.email=jnthnlstr%40gmail.com
*/

GET('/checkauth', function() {
	// check auth is OK
	var q = this.request.query,
		host = this.request.headers.Host,
		mode = q['openid.mode'];
	if(mode==='id_res') {
		// grab id and email from response params
		var id = q['openid.identity'],
			email = q['openid.ext1.value.email'];
		// check to see if this account already exists - if not, create it
		var account;
		try {
			account = GID.getAccount(email);
		} catch(ex) {
			// do nothing
		}
		if(!account) {
			var accountObj = {
				id: email,
				gid: id
			};
			account = GID.storeNewAccount(email, accountObj);
		}
		// redirect to /admin keeping login creds in session
		this.session.email = email;
		this.session.gid = id;
		this.session.save();
		var url = "http://"+host+"/admin";
		return redirect(url);
	} else {
		return "error with Google authentication! openid.mode: "+id_res;
	}
});

GET('/listGIDAccounts', function() {
	var accounts = GID.listAccounts(),
		out = "";
	out += "<h1>GID Accounts</h1>";
	if(accounts.length) {
		out += "<ul>";
		for(var i=0, il=accounts.length, account, calendars, calendarNames; i<il; i++) {
			account = accounts[i];
			out += "<li>"+account.id;
			out += "<br />gid: "+account.gid+"</li>";
		}
		out += "</ul>";
	} else {
		out += "<p>no GID accounts</p>";
	}
	return out;
});

var GID = {};

GID.resourceName = "GIDAccount";
GID.storeNewAccount = function(accountName, account) {
	if(!accountName) {
		throw new Error("Error: GID.storeNewAccount: no account name provided");
	}
	if(account.gid) {
		account.id = accountName;
		return system.datastore.write(GID.resourceName, account);
	} else {
		throw new Error("Error: GID.storeNewAccount: no GID provided for account");
	}
};
GID.getAccount = function(accountName) {
	if(!accountName) {
		throw new Error("Error: GID.getAccount: no account name provided");
	}
	return system.datastore.get(GID.resourceName, accountName);
};
GID.removeAccount = function(accountName) {
	if(!accountName) {
		throw new Error("Error: GID.deleteAccount: no account name provided");
	}
	return system.datastore.remove(GID.resourceName, accountName);
};
GID.listAccounts = function() {
	var accounts = system.datastore.search(GID.resourceName, {});
	return accounts;
};

/* utils */
function makeXML(response) {
	var feedXML = response.content.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, ""); // E4X bug 336551
	var xml = new XML(feedXML);
	return xml;
}

function is_logged_in(session, id) {
	var e;
	if(!session.gid) {
		e = new Error();
		e.type = 'login';
		e.message = 'not logged in';
	} else if(id && session.email!==id) {
		e = new Error();
		e.type = 'id';
		e.message = 'bad login id';
	}
	if(e) {
		throw e;
	}
}

function objToParamString(obj) {
	var out = "";
	for(var i in obj) {
		if(obj.hasOwnProperty(i)) {
			out += "&"+i+"="+encodeURIComponent(obj[i]);
		}
	}
	return out.substring(1);
};