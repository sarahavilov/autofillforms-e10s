/* globals self */
'use strict';

var background = {
  send: self.port.emit,
  receive: self.port.on
};

var app = {
  unload: (c) => self.port.on('detach', c)
};
