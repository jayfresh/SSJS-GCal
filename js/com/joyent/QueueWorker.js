var QueueWorker = function( jsFile ) {
  if (!jsFile) throw new Error("no queue file");
  this.jsfile = jsFile;
};

QueueWorker.prototype.__noSuchMethod__ = function(id, args) {
  system.queue_execute(this.jsfile, id, args);
};