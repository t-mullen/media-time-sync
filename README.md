# media-time-sync

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Sync playback between multiple media elements with high accuracy. 

Transport latency and playback state is accounted for, ensuring that media plays simulatenously even across laggy networks with many viewers.

## Example
Here is an example of syncing two media elements on the same page:

```javascript
var m1 = new MediaTimeSync('1', document.querySelector('video#one'))
var m2 = new MediaTimeSync('2', document.querySelector('video#two'))

m1.on('message', (id, message) => {
  // you can use any transport to send the message
  if (id === '2') {
    m2.receive(m1.id, message)
  }
})

// sync requires two-way communication
m2.on('message', (id, message) => {
  if (id === '1') {
    m1.receive(m2.id, message)
  }
})
```

Now we can control playback state with the given methods. (Native events will not be synced).
```javascript
m1.play()
m2.seek(1000)
```

## API

### `var mts = new MediaTimeSync(id, element)`
Create a new sync object for the given MediaElement. 

`id` is a globally unique identifier.

`element` is any MediaElement.

### `mts.on('message', (id, message) => {})`
Fired when a sync message needs to be sent to another MediaTimeSync instance.

`id` is the ID of the MediaTimeSync instance that must **receive** the message.

### `mts.receive(id, message)`
Receive a sync message from a remote MediaTimeSync instance.

`id` is the ID of the instance that **sent** the message.

### `mts.play()`
Start playback. Use this method instead of the native `play` method on the media element.

Using the native method or the native controls will cause the element to fall out of sync.

### `mts.pause()`
Pause playback. Use this instead of native methods.

### `mts.seek(time)`
Seek to a specific playback time, in seconds. Use this instead of native methods.

### `mts.now()`
Get the synchronized time in seconds past Unix epoch format.

## Thanks
Thanks to @enmasseio for timesync, the algorithm that accounts for network latency in this module.
https://github.com/enmasseio/timesync