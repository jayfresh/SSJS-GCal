function makeXML(response) {
	var feedXML = response.content.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, ""); // E4X bug 336551
	var xml = new XML(feedXML);
	return xml;
}
/*
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
		"openid.return_to": "http://www.postbin.org/11twlhp",
		"openid.mode": "checkid_setup",
		"openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
		"openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
		"openid.ns.ax": "http://openid.net/srv/ax/1.0",
		"openid.ax.mode": "fetch_request",
		"openid.ax.required": "email",
		"openid.ax.type.email": "http://axschema.org/contact/email"
	};
	var objToString = function(obj) {
		var out = "";
		for(var i in obj) {
			if(obj.hasOwnProperty(i)) {
				out += "&"+i+"="+encodeURIComponent(obj[i]);
			}
		}
		return out.substring(1);
	};
	return redirect(uri+'?'+objToString(params));
});

GET('/checkauth', function() {
	// check auth is OK
	var host = this.request.headers.Host,
		mode = this.request.query['openid.mode'];
	if(mode==='id_res') {
		// grab id and email from response params
		var url = host+"/admin";
		return this.request.query;
		return redirect(url);
	} else {
		return "error!";
	}
});