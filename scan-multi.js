const io = require('socket.io')(8888);
const crypto = require('crypto');

let channel = 0;
let nPackets = 0;

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

execute('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', ['en0', 'sniff', channel + 1]);
next();

function next() {
	setTimeout(() => {
		console.log(`Captured ${nPackets} packets on channel ${channel + 1}`);

		if (nPackets < 200) {
			channel++;
			channel %= 13;

			execute('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', ['en0', 'sniff', channel + 1]);
		}

		nPackets = 0;

		next();
	}, 2000);
}

function processBuffer(buffer) {
	let data = buffer.toString().split('\n');
	let message = [];

	data.forEach(line => {
		let packetData = line.split('*');

		let packet = {
			source: null,
			destination: null,
			frequency: parseInt(packetData[2]),
			noise: parseInt(packetData[3]),
			signal: parseInt(packetData[4]),
			subtype: parseInt(packetData[5]),
			type: parseInt(packetData[6]),
			timestamp: Math.round(parseFloat(packetData[7]) * 1000),
			ssid: null,
			duration: parseInt(packetData[9]) / 1000,
			size: parseInt(packetData[10]),
			channel: parseInt(packetData[11])
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
	// console.log(`Processed ${message.length} frames on channel ${channel + 1}.`);

	nPackets += message.length;
}

function execute(cmd, args, onData, onEnd) {
	let child = require('child_process').spawn(cmd, args, {
		stdio: ['ignore', 'pipe', 'ignore']
	});

	if (typeof onData === 'function') child.stdout.on('data', onData);
	if (typeof onEnd === 'function') child.stdout.on('end', onEnd);

	return child;
}
