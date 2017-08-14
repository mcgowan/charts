var _ = require('lodash');
var q = require('q');
var express = require('express');
var io = require('socket.io');
var fs = require('fs');
var config = require('./config');
var app = express();
var server = require('http').createServer(app);

io = io.listen(server);

app.use(express.static(__dirname));

server.listen(config.port);

var data = [], subs = [];

io.on('connection', function(socket){

    subs.push(socket);

    socket.on('error', function(error){
		console.error(error);
        socket.emit('server:error', error);
	})

    .on('disconnect', function(){
        var index = subs.indexOf(socket);
        if (index !== -1) {
            subs.splice(index, 1);
        }
	})

    .on('stocks:get', function(){
        socket.emit('stocks:get', data);
	})

});

function loadData() {
    var d = q.defer(), result = [], id = 1;

	fs.readdirSync(config.folders.data).forEach(function(file){
        var lines = fs.readFileSync(config.folders.data + file).toString().split('\n');

        if (lines.length > 1) {
            var dot = file.indexOf('.');

            var chart = {
                id: id++,
                symbol: file.substr(0, dot),
                date: {
                    yy: file.substr(dot + 7, 2),
                    mm: file.substr(dot + 4, 2),
                    dd: file.substr(dot + 1, 2)
                },
                chart: { 
                    data: [],
                    pan: 0,
                    zoom: 0
                }
            }

            _.forEach(lines, function(line){
                var parts = line.split(',');

                if (parts.length === 5) {
                    var time = parts[0].split(':');

                    chart.chart.data.push({ 
                        time: { 
                            hh: parseInt(time[0]),
                            mm: parseInt(time[1]),
                            ss: parseInt(time[2])
                        },
                        open:  parseFloat(parts[1]),
                        high:  parseFloat(parts[2]),
                        low:   parseFloat(parts[3]),
                        close: parseFloat(parts[4])
                    });
                }
            });

            result.push(chart);
        }
    });
    
    d.resolve(result);

    return d.promise;
}

function main() {
    loadData().then(function(result){
        data = result;
        console.log('Serving ' + data.length + ' chart(s).');

    }).catch(function(error){
        console.log(error.stack);
    });

    // allow delete
}

function exitHandler(options, error) {
    if (options.cleanup) {
        // any cleanup code here...
	}	
    if (error) console.log(error.stack);
    if (options.exit) process.exit();
}

main();

process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
