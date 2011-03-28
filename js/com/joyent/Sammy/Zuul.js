
enable("Sessions");

before(function() {
  if ( this.session.userid )
    this.user = Zuul.resource.get( this.session.userid );
});

Zuul = {
  resource: null,
  validate: null,

  'basic': function( map ) {
    before( function() {
      for each ( var uri in map ) {
	if ( this.request.uri.match( uri ) && !this.session.userid )
	  Zuul.checkBasic( this );
      }
    });
  },

  'form': function( map, options ) {

    before( function() {
      for each ( var uri in map ) {
	if ( this.request.uri.match( uri ) && !this.session.userid )
	  redirect( options.signin.uri );
      }

      var signin = function() {
	this.error = true;
	if (!options['process']) return template( options.signin.template );
	else return options.process( options.signin.uri );
      };

      POST( options.signin.uri, function() {
	var body = this.request.body;

	// if we don't have a username and password...
	if (!( body.username && body.password )) {
	  signin();
	}

	try {
	  var aResource = Zuul.resource.get( username );
	} catch(e) {
	  this.error = true;
	}
      });

    });

  },

  'checkBasic': function( theObject ) {
    var headers  = theObject.request.headers;
    var response = theObject.response;
    if (!headers['Authorization']) {
      response.code = 401;
      response.headers["WWW-Authenticate"] = "Basic realm=\"Secure\"";
      throw response;
    } else {
      system.use("info.webtoolkit.Base64");
      var [type, enc]  = headers.Authorization.split(" ");
      var [user, pass] = Base64.decode(enc).split(":");
      try {
	var aUser = Zuul.resource.get( user );
	if ( Zuul.validate.apply( aUser, [ pass ] ) ) {
	  theObject.session.userid = aUser.id;
	  theObject.user = aUser;
	  theObject.session.save();
	} else {
	  throw new Error("couldn't auth");
	}
      } catch(e) {
	response.code = 401;
	response.headers["WWW-Authenticate"] = "Basic realm=\"Secure\"";
	throw response;
      }
    }
  }



}