system.use("com.joyent.Resource");
var Session = new Resource('session');
Session.transient = true;

before( function() {
  var session_id;
  if ( this.request.cookies )
    session_id = this.request.cookies['session'];
  if ( !session_id ) {
    this.session = new Session();
    this.session.save();
  } else {
    try {
      this.session = Session.get( session_id );
    } catch(e) {
      this.session = new Session();
    }
  }
  this.response.headers["Set-Cookie"] = [
    ['session', this.session.id].join('='),
    ['path', '/'].join('=')
  ].join(';');
});
