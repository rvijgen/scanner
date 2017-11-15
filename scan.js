var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

channel = 1;
var timer;
foo = new cmd_exec('airport', ['en1', 'sniff', channel])
scanChannel()

var row = Array();
var historic = Array();

function scanChannel() {

    //console.log('================================================================')
    //console.log('start')
    var spawn = require('child_process').spawn
    var ts = spawn('tshark', ['-i', 'en1', '-I'], { stdio: ['pipe', 'pipe', 'pipe'] });


    var start = new Date().getTime();
    if (ts.stdout != null) {
        ts.stdout.on('data', function(data) {

            var str = data.toString(),
                lines = str.split('\n');


            for (var i = 0; i < lines.length; i++) {
                var scr = '';
                var dst = '';
                // Process the line, noting it might be incomplete.
                console.log(lines[i]);
                //value = lines[i].split(',');
                //console.log(value)
            }
        });

    }

    ts.on('close', function(code) {
        //console.log('child process exited with code ' + code);
    });
    clearTimeout(timer);
    



    timer = setTimeout(function() {
        //console.log('kill');
        if (ts != null) ts.kill();
        ts = null
        channel++

        if (channel > 13) {
            channel = 1;
        }

        foo = new cmd_exec('airport', ['en1', 'channel', channel],
            function(me, data) { me.stdout += data.toString(); },
            function(me) { me.exit = 1; }
        );

        results = 0;
        setTimeout(scanChannel, 100);
    
    }, 2000);


}








function cmd_exec(cmd, args, cb_stdout, cb_end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    me.exit = 0; // Send a cb to set 1 when cmd exits
    child.stdout.on('data', function(data) { cb_stdout(me, data) });
    child.stdout.on('end', function() { cb_end(me) });
}

//tshark -i wlan0 -c 10 -T fields -e ip.src -e ip.dst -e ip.proto -e tcp.srcport -e tcp.dstport -e udp.srcport -e udp.dstport > test.txt

//tshark -i en0 -I
//tshark -i en0 -T text -E separator=,  -T fields -e frame.number -e eth.src_resolved -e eth.dst_resolved -e wlan.bssid_resolved -I -Y data