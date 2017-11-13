var ProgressBar = require('progress');
var bar = new ProgressBar(':bar :name', { total: 13, clear: true, width: 100 });


results = 0;
channel = 1;
var timer;
foo = new cmd_exec('airport', ['en0', 'sniff', channel])
scanChannel()

var row = Array();
var historic = Array();

function scanChannel() {

    //console.log('================================================================')
    //console.log('start')
    var spawn = require('child_process').spawn
    var ts = spawn('tshark', ['-i', 'en0', '-I', '-Y', 'data'], { stdio: ['pipe', 'pipe', 'pipe'] });


    var start = new Date().getTime();
    if (ts.stdout != null) {
        ts.stdout.on('data', function(data) {
            
            //console.log('stdout: ' + data); 
            

            var str = data.toString(),
                lines = str.split('\n');


            for (var i = 0; i < lines.length; i++) {
                var scr = '';
                var dst = '';
                // Process the line, noting it might be incomplete.
                //console.log(lines[i]);
                value = lines[i].split(',');
                //console.log(value)
                src = value[0]
                dst = value[1]
                //console.log('data');
                results++

            }

            // if (ts!=null){
            //  console.log('eerder klaar');
            //  ts.kill();
            //  ts = null
            // }


        });

        // ts.stderr.on('data', function (data) {
        //     console.log('stderr: ' + data);
        // });

    }

    ts.on('close', function(code) {
        //console.log('child process exited with code ' + code);
    });
    clearTimeout(timer);
    timer = setTimeout(function() {
        //console.log('kill');
        if (ts != null) ts.kill();
        ts = null


        var end = new Date().getTime();
        var time = end - start;
        //console.log('found '+results+' transfers on channel '+channel+' in '+time/1000+' seconds')
        var seconds = time / 1000
        results /= seconds

        start = new Date().getTime();
        resultval = Math.round(results * 60)
        //console.log('channel '+channel+' has '+resultval+' transfers per minute')
        row.push(resultval)
        //console.log(row)


        bar.tick({
            'name': 'scanning channel: ' + channel
        });
        channel++

        if (bar.complete) {

            bar = new ProgressBar(':name :bar', { total: 13, clear: true, width: 100 });
        }


        if (channel > 13) {
            channel = 1;
            historic.push(row)
            row = Array();
            display()
        }

        foo = new cmd_exec('airport', ['en0', 'channel', channel],
            function(me, data) { me.stdout += data.toString(); },
            function(me) { me.exit = 1; }

        );


        results = 0;
        setTimeout(scanChannel, 100);
    }, 2000);


}






function display() {
    output = '';
    for (var i = 0; i < historic[historic.length - 1].length; i++) {
        output += (historic[historic.length - 1][i] + '\t')
    }
    console.log(output)
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