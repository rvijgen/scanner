var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var interface = 'en1'

channel = 1;
var timer;
foo = new cmd_exec('airport', [interface, 'sniff', channel])
scanChannel()

var row = Array();
var historic = Array();
var channelData = Array();


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  //console.log('a user connected');
  socket.on('disconnect', function(){
    //console.log('user disconnected');
  });
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});

http.listen(8888,"localhost", function(){
  console.log('emitting from localhost:8888');
});





function scanChannel() {

    //console.log('================================================================')
    //console.log('start')
    var spawn = require('child_process').spawn
    var ts = spawn('tshark', ['-i', interface, '-I'], { stdio: ['pipe', 'pipe', 'pipe'] });


    var start = new Date().getTime();
    if (ts.stdout != null) {
        ts.stdout.on('data', function(data) {

            var str = data.toString(),
            lines = str.split('\n');


            for (var i = 0; i < lines.length; i++) {
                var scr = '';
                var dst = '';
                // Process the line, noting it might be incomplete.
                
                //value = lines[i].split(',');
                //console.log(value)
                channelData.push(lines[i])
            }
            
            
        });

    }

    ts.on('close', function(code) {
        //console.log('child process exited with code ' + code);
    });
    clearTimeout(timer);
    



    timer = setTimeout(function() {
        // kill scanner
        if (ts != null) ts.kill();
        ts = null


        console.log('channel '+channel+' '+channelData.length+' logs');
        io.emit('boop', {channel, channelData});
        // clear channel data
        channelData = Array();


        // up channel
        channel++

        if (channel > 13) {
            channel = 1;
        }

        foo = new cmd_exec('airport', [interface, 'channel', channel],
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