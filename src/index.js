var timesync = require('timesync')
var EventEmitter = require('nanobus')
var inherits = require('inherits')

inherits(MediaTimeSync, EventEmitter)

function MediaTimeSync (id, element) {
  var self = this
  if (!(self instanceof MediaTimeSync)) return new MediaTimeSync(element)

  EventEmitter.call(self)

  self.id = id
  self._peerIds = []
  self._ts = timesync.create({
    interval: 10000,
    delay: 100,
    peer: self._peerIds
  })
  self._ts.send = function (to, data) {
    self.emit('message', id, {
      type: 'timesync',
      content: data
    })
  }

  element.controls = false

  self._element = element
  self._targetTime = element.currentTime
  self._playingState = false
}

MediaTimeSync.prototype.addPeer = function (id) {
  var self = this
  if (self._peerIds.indexOf(id) === -1) self._peerIds.push(id)
}

MediaTimeSync.prototype.receive = function (id, msg) {
  var self = this

  self.addPeer(id)

  switch (msg.type) {
    case 'timesync':
      self._ts.receive(id, msg.content)
      break
    case 'play':
      self._onRemotePlay(msg.time, msg.timestamp)
      break
    case 'pause':
      self._onRemotePause(msg.time, msg.timestamp)
      break
    case 'seek':
      self._onRemoteSeek(msg.time, msg.timestamp)
      break
  }
}

MediaTimeSync.prototype.now = function () {
  var self = this
  return self._ts.now()
}

MediaTimeSync.prototype.play = function () {
  var self = this
  self._playingState = true
  self._element.play()
  self._sendToAll('play', self._element.currentTime)
}

MediaTimeSync.prototype.pause = function () {
  var self = this
  self._playingState = false
  self._element.pause()
  self._sendToAll('pause', self._element.currentTime)
}

MediaTimeSync.prototype.seek = function (time) {
  var self = this
  self._element.currentTime = time
  self._sendToAll('seek', self._element.currentTime) // playing
}

MediaTimeSync.prototype._sendToAll = function (type, time) {
  var self = this

  self._peerIds.forEach(id => {
    self.emit('message', id, {
      type: type,
      time: time,
      timestamp: self.now()
    })
  })
}

// transform a play time and a creationg timestamp in the synchronized clock
// to a play time relative to our local element
MediaTimeSync.prototype._adjustTime = function (time, timestamp) {
  var self = this

  var currentTimestamp = self.now()
  var dt = currentTimestamp - timestamp

  return time + (dt / 1000) // adjust the play time by the delta-t of network latency
}

MediaTimeSync.prototype._onRemotePlay = function (time, timestamp) {
  var self = this

  self._playingState = true

  self._element.currentTime = self._adjustTime(time, timestamp)
  self._element.play()
}

MediaTimeSync.prototype._onRemotePause = function (time) {
  var self = this

  self._playingState = false

  self._element.currentTime = time
  self._element.pause()
}

MediaTimeSync.prototype._onRemoteSeek = function (time, timestamp) {
  var self = this

  if (self._playingState) {
    self._onRemotePlay(time, timestamp)
  } else {
    self._onRemotePause(time, timestamp)
  }
}

module.exports = MediaTimeSync
