# Subscribe
A Concierge KPM module for syncing messages between different threads.

## Installing
#### KPM
```
/kpm install subscribe
```

#### Manual
```
git clone https://github.com/concierge/subscribe.git modules/subscribe
node main.js
```

## Commands
Within this documentation, the `commandPrefix` is assumed to be `/`. This should be changed as appropriate for your configuration.

- `/subscribe add read <channelName>` - Adds this thread as a reader on channel `<channelName>`.
- `/subscribe add write <channelName>` - Adds this thread as a writer on channel `<channelName>`.
- `/subscribe remove read <channelName>` - Stops this thread from being a reader on channel `<channelName>`.
- `/subscribe remove write <channelName>` - Stops this thread from being a writer on channel `<channelName>`.
- `/subscription-list` - Lists all channels that the current thread is subscribed to (either as a reader or writer).
- `/reply <channelName> <message...>` - If the current thread is a reader in channel `<channelName>`, this command will send the message `<message...>` to the threads of all writers subscribed to channel `<channelName>`.
- `/help subscribe` - basic help that recommends you look at this readme.

## Configuration Options
Add the following to this modules `config.json` to configure it.
- `messagePrefix` - The text to show before forwarded messages. By default, if not provided this string will be ''. This is a string that can contain any of these special substrings:
	- `{{thread_id}}` - will be replaced with the unique thread ID.
	- `{{sender_id}}` - will be replaced with the unique sender ID.
    - `{{sender_name}}` - will be replaced with the name of the sender.
	- `{{event_souce}}` - will be replaced with the name of the integration that the message was sent on.
	- `{{channel}}` - channel name.

## Concepts
Within this module, there are three concepts, a 'reader' (output), a 'writer' (input) and a 'channel' (what connects writers to readers). These form a linear pipeline through which messages are passed.

#### Writer
A writer is a message source. All received messages on the thread of a writer will be forwarded to the channel. Any channel can have infinite writers.

#### Channel
The channel receives messages from all subscribed writers and passes them directly to any subscribed readers.

#### Reader
A writer is a message sink. All received messages from the channel will be shown to the user (sent). Any channel can have infinite readers.

## Examples
#### One-Way
For example, say you wanted to forward all sent to a Slack thread to a Facebook thread. Assuming Concierge is already added into both threads:

*On Slack:*
```
/subscribe add write someSuperSecretChannelNameYouWillNeverGuess
```

*On Facebook:*
```
/subscribe add read someSuperSecretChannelNameYouWillNeverGuess
```

In this situation, to reply to a Slack message from Facebook you would need to do the following on Facebook:
```
/reply someSuperSecretChannelNameYouWillNeverGuess This is the message I want to send to slack.
```

#### Two-Way
As this module creates a one-way pipeline (a 'channel'), two way binding requires two channels. Extending the above example to be two way:

*On Slack:*
```
/subscribe add read someSuperSecretChannelNameYouWillNeverGuess1
/subscribe add write someSuperSecretChannelNameYouWillNeverGuess2
```

*On Facebook:*
```
/subscribe add write someSuperSecretChannelNameYouWillNeverGuess1
/subscribe add read someSuperSecretChannelNameYouWillNeverGuess2
```

In this setup, the `/reply` command is not needed.

## License and Copyright
Copyright (c) Matthew Knox 2016. Licensed under the MIT license. Contributions welcome.
