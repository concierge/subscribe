let helpText = 'I suggest you check the help, cause thats not how you do things...';

// http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
let escapeRegex = (str) => {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

let replaceAll = (str, find, replace) => {
    return str.replace(new RegExp(escapeRegex(find), 'g'), replace);
};

let constructMessage = (input, channel, event) => {
    let prefix = exports.config.messagePrefix || '{{sender_name}}@{{channel}} ~ ';
    prefix = replaceAll(prefix, '{{thread_id}}', event.thread_id);
    prefix = replaceAll(prefix, '{{sender_id}}', event.sender_id);
    prefix = replaceAll(prefix, '{{sender_name}}', event.sender_name);
    prefix = replaceAll(prefix, '{{event_souce}}', event.event_souce);
    prefix = replaceAll(prefix, '{{channel}}', channel);
    return prefix + input;
};

let subscribe = (api, event) => {
    if (event.arguments.length !== 4) {
        return api.sendMessage(helpText, event.thread_id);
    }

    let action = event.arguments[1],
        type = event.arguments[2],
        channel = event.arguments[3];

    if (type === 'read') {
        if (action === 'add') {
            if (!exports.config.targets.hasOwnProperty(channel)){
                exports.config.targets[channel] = {};
            }

            if (!exports.config.targets[channel].hasOwnProperty(event.event_source)) {
                exports.config.targets[channel][event.event_source] = [];
            }

            if (!exports.config.targets[channel][event.event_source].includes(event.thread_id)) {
                exports.config.targets[channel][event.event_source].push(event.thread_id);
                return api.sendMessage('Add complete.', event.thread_id);
            }
            else {
                return api.sendMessage('This thread is already reading that channel!', event.thread_id);
            }
        }
        else if (action === 'remove') {
            if (!exports.config.targets.hasOwnProperty(channel) ||
                !exports.config.targets[channel].hasOwnProperty(event.event_source) ||
                !exports.config.targets[channel][event.event_source].includes(event.thread_id)) {
                return api.sendMessage('You arn\'t reading from that channel!', event.thread_id);
            }
            let array = exports.config.targets[channel][event.event_source];
            array.splice(array.indexOf(event.thread_id), 1);
            return api.sendMessage('Remove complete.', event.thread_id);
        }
        else {
            return api.sendMessage(helpText, event.thread_id);
        }
    }
    else if (type === 'write') {
        if (action === 'add') {
            if (!exports.config.sources.hasOwnProperty(event.event_source)){
                exports.config.sources[event.event_source] = {};
            }

            if (!exports.config.sources[event.event_source].hasOwnProperty(event.thread_id)) {
                exports.config.sources[event.event_source][event.thread_id] = [];
            }

            if (!exports.config.sources[event.event_source][event.thread_id].includes(channel)) {
                exports.config.sources[event.event_source][event.thread_id].push(channel);
                return api.sendMessage('Add complete.', event.thread_id);
            }
            else {
                return api.sendMessage('This thread is already writing to that channel!', event.thread_id);
            }
        }
        else if (action === 'remove') {
            if (!exports.config.sources.hasOwnProperty(event.event_source) ||
                !exports.config.sources[event.event_source].hasOwnProperty(event.thread_id) ||
                !exports.config.sources[event.event_source][event.thread_id].includes(channel)) {
                return api.sendMessage('You arn\'t writing to that channel!', event.thread_id);
            }
            let array = exports.config.sources[event.event_source][event.thread_id];
            array.splice(array.indexOf(channel), 1);
            return api.sendMessage('Remove complete.', event.thread_id);
        }
        else {
            return api.sendMessage(helpText, event.thread_id);
        }
    }
    else {
        return api.sendMessage(helpText, event.thread_id);
    }
};

let reply = (api, event) => {
    if (event.arguments.length < 3) {
        return api.sendMessage(helpText, event.thread_id);
    }

    if (!exports.config.targets.hasOwnProperty(event.arguments[1]) ||
        !exports.config.targets[event.arguments[1]].hasOwnProperty(event.event_source) ||
        !exports.config.targets[event.arguments[1]][event.event_source].includes(event.thread_id)) {
        return api.sendMessage('This thread is not reading in the channel "' + event.arguments[1] + '" so cannot reply to messages sent there...', event.thread_id);
    }

    let apis = exports.platform.getIntegrationApis(),
        message = event.arguments.slice(2, event.arguments.length).join(' '),
        wroteTo = [];
    for (let source in exports.config.sources) {
        let oapi = apis[source];
        for (let thread in exports.config.sources[source]) {
            if (exports.config.sources[source][thread].includes(event.arguments[1])) {
                oapi.sendMessage(constructMessage(message, event.arguments[1], event), thread);
                if (!wroteTo.includes(source)) {
                    wroteTo.push(source);
                }
            }
        }
    }

    let writeToStr = wroteTo.length > 0 ? wroteTo.join(', ') : '<nowhere? what are you doing...>';
    return api.sendMessage('Message sent to: ' + writeToStr, event.thread_id);
};

let forwardMessage = (event) => {
    let apis = exports.platform.getIntegrationApis(),
        channels = exports.config.sources[event.event_source][event.thread_id];
    for (let channel of channels) {
        let message = constructMessage(event.body, channel, event);
        if (!exports.config.targets.hasOwnProperty(channel)) {
            continue;
        }

        for (let integ in exports.config.targets[channel]) {
            for (let thread of exports.config.targets[channel][integ]) {
                let api = apis[integ];
                api.sendMessage(message, thread);
            }
        }
    }
};

let list = (api, event) => {
    let output = 'Mode   \tChannel\n----------------------------------------\n',
        count = 0;
    for (let channel in exports.config.targets) {
        if (!exports.config.targets[channel][event.event_source]) {
            continue;
        }
        if (exports.config.targets[channel][event.event_source].includes(event.thread_id)) {
            output += '[READ ]\t' + channel + '\n';
            count++;
        }
    }

    if (exports.config.sources[event.event_source] &&
        exports.config.sources[event.event_source][event.thread_id]) {
        for (let channel of exports.config.sources[event.event_source][event.thread_id]) {
            output += '[WRITE]\t' + channel + '\n';
            count++;
        }
    }

    if (count === 0) {
        output += 'You are not reading or writing to any channels.\n';
    }

    return api.sendMessage(output, event.thread_id);
};

exports.load = () => {
    if (!exports.config.sources) {
        exports.config.sources = {};
    }

    if (!exports.config.targets) {
        exports.config.targets = {};
    }
};

exports.match = (event, commandPrefix) => {
    let match = event.arguments[0] === commandPrefix + 'subscribe' ||
                event.arguments[0] === commandPrefix + 'reply' ||
                event.arguments[0] === commandPrefix + 'subscription-list';

    if (!match &&
        exports.config.sources.hasOwnProperty(event.event_source) &&
        exports.config.sources[event.event_source].hasOwnProperty(event.thread_id)) {
        process.nextTick(() => {
            forwardMessage(event);
        });
    }

    return match;
};

exports.run = (api, event) => {
    switch (event.arguments[0]) {
        case api.commandPrefix + 'subscribe': return subscribe(api, event);
        case api.commandPrefix + 'reply': return reply(api, event);
        case api.commandPrefix + 'subscription-list': return list(api, event);
        default: return api.sendMessage(helpText, event.thread_id);
    }
}
