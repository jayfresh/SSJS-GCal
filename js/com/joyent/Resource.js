var Resource = function( typename, watches ) {

  if (!watches) watches = {};

  // the constructor for the object.
  // add a creation date and an id.  Of course,
  // the id isn't set in stone until the object is
  // saved to the datastore, and then it is essentially
  // immutable (but not enforced...)
  var theType = function() {
    this.created = new Date();
    this.id      = system.uuid();
    this._set_watches();
    if ( watches['@constructor'] )
      watches['@constructor'].apply(this, arguments);
  };

  // if the object is transient then it only goes into
  // the memory cache.
  theType.transient = false;

  // query the datastore for objects.
  //  ...this and the get method need refactoring so they both unzip the object with
  //   the same code...
  theType.search = function( aQuery, someOptions ) {
    if ( theType.transient ) throw new Error("cannot search for transient objects");
    return system.datastore.search(typename, aQuery, someOptions).map( function( anObject ) {
      anObject.__proto__ = theType.prototype;
      if ( watches['@get'] ) watches['@get'].apply(anObject, []);
      anObject.created = new Date(anObject.created);
      anObject.updated = new Date(anObject.updated);
      anObject._set_watches();
      return anObject;
    });
  };

  // remove an object from the datastore, but as a class
  // method instead of an object method.
  theType.remove = function( anId ) {
    theType.get( anId ).remove();
  };

  // gets an object from the datastore.
  theType.get = function( anId ) {
    var theObject = system.datastore.get(typename, anId);
    theObject.__proto__ = theType.prototype;
    if ( watches['@get'] ) watches['@get'].apply(theObject, []);
    theObject.created = new Date( theObject.created );
    theObject.updated = new Date( theObject.updated );
    // can probably do something to protect the id from being changed here,
    //   should consider doing it at some point.  I'm not entirely sure why, though.
    theObject._set_watches();
    return theObject;
  };

  // applies the watch funtions.
  theType.prototype._set_watches = function() {
    for ( var prop in watches ) {
      // should probably do this with indexOf instead...
      if ( !prop.match(/^\@/) ) {
	var watcher = function( id, oldval, newval ) {
	  return watches[prop].apply( this, [ id, oldval, newval ] );
	};
	this.watch( prop, watcher );
      }
    }
  };

  // removes the watch functions.
  // this is here for completeness rather than
  //  utility at the moment.
  theType.prototype._unset_watches = function() {
    for ( var prop in watches ) {
      this.unwatch( prop );
    }
  };

  // remove the object from the datastore
  theType.prototype.remove = function() {
    system.datastore.remove(typename, this.id );
    if ( watches['@remove'] )
      watches['@remove'].apply(this,[]);
  };

  // write the object to the datastore.
  theType.prototype.save = function() {
    if ( this.created instanceof Date )
      this.created = this.created.getTime();
    this.updated = new Date().getTime();

    var aCache = {};
    if ( watches['@save'] )
      watches['@save'].apply(this, [ aCache ]);

    system.datastore.write(typename, this, theType.transient);
    if ( watches['@saved'] )
      watches['@saved'].apply(this, [ aCache ]);

    this.created = new Date( this.created );
    this.updated = new Date( this.updated );
  };

  theType.typename = typename;

  // keep track of the resource-types we have
  //  created.  If we're the first one, make sure
  //  we have the object available to us.
  if (!Resource.types) Resource.types = [];
  Resource.types.push( typename );

  // keep track of the actual resources we
  //  have created.
  if (!Resource.typemap) Resource.typemap = {};
  Resource.typemap[typename] = theType;

  // return the "class"
  return theType;
};
