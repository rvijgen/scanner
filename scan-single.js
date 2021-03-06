const io = require('socket.io')(8888);
const crypto = require('crypto');

let channel = 11;

let sniffer = execute('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', ['en0', 'sniff', channel]);

let tshark = execute('tshark', [
	'-i', 'en0',
	'-I',
	'-T', 'fields',
	'-E', 'separator=*',
	'-e', 'wlan.sa_resolved',
	'-e', 'wlan.da_resolved',
	'-e', 'wlan_radio.frequency',
	'-e', 'wlan_radio.noise_dbm',
	'-e', 'wlan_radio.signal_dbm',
	'-e', 'wlan.fc.type_subtype',
	'-e', 'wlan.fc.type',
	'-e', 'frame.time_epoch',
	'-e', 'wlan.ssid',
	'-e', 'wlan_radio.duration',
	'-e', 'frame.len',
	'-e', 'wlan_radio.channel'
], processBuffer);

function processBuffer(buffer) {
	let data = buffer.toString().split('\n');
	let message = [];

	data.forEach(line => {
		let packetData = line.split('*');

		let packet = {
			source: {name:"", id:""},
			destination: {name:"", id:""},
			ssid: {name:"", id:""},
			frequency: parseInt(packetData[2]),
			noise: parseInt(packetData[3]),
			signal: parseInt(packetData[4]),
			subtype: parseInt(packetData[5]),
			type: parseInt(packetData[6]),
			timestamp: Math.round(parseFloat(packetData[7]) * 1000),
			duration: parseInt(packetData[9]) / 1000,
			size: parseInt(packetData[10]),
			channel: parseInt(packetData[11]),
			snr: 0
		};

		if (packet.size && packet.signal) {
			if (packetData[0]) {
				packet.source = {
					name: packetData[0],
					id: crypto.createHash('md5').update(packetData[0]).digest("hex")
				}
			}

			if (packetData[1]) {
				packet.destination = {
					name: packetData[1],
					id: crypto.createHash('md5').update(packetData[1]).digest("hex")
				}
			}

			if (packetData[8]) {
				packet.ssid = {
					name: packetData[8],
					id: crypto.createHash('md5').update(packetData[8]).digest("hex")
				}
			}

			packet.snr = packet.signal - packet.noise;

			message.push(packet);
		}
	});

	io.emit('data', message);
	console.log(`Processed ${message.length} frames.`);
}

function execute(cmd, args, onData, onEnd) {
	let child = require('child_process').spawn(cmd, args, {
		stdio: ['ignore', 'pipe', 'ignore']
	});

	if (typeof onData === 'function') child.stdout.on('data', onData);
	if (typeof onEnd === 'function') child.stdout.on('end', onEnd);

	return child;
}
