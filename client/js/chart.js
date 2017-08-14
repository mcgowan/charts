var Chart = function(params) {
    this.id = params.id;
    this.frame = document.getElementById(params.id);
    this.symbol = params.symbol;
    this.data = params.data;
    this.line = params.line;
    this.type = params.type ? params.type : 1; // 1 = bar, 2 = line
    this.last = params.last;

    var canvas = document.createElement('canvas');

    canvas.setAttribute("width", "600px");
    canvas.setAttribute("height", "200px");
    canvas.setAttribute("style", "width:600px;height:200px");

    canvas.getContext('2d').translate(0.5, 0.5);

    this.frame.appendChild(canvas);

    this.frame.canvas = canvas;
    this.watermark = params.watermark;
    this.previous = params.previous;
    this.alert1 = params.alert1;
    this.alert2 = params.alert2;

    this.x = '';
    this.y = '';

    this.zoom = params.zoom;
    this.pan = params.pan;
};

Chart.prototype = function() {

    var chart = {};

    chart.textAlign = Object.freeze({ left: {}, middle: {}, right: {} });

    chart.defaults = {
        coordRangeY1: { min: 190, max: 45 },
        coordRangeY2: { min: 200, max: 160}
    };

    chart.assign = function(obj) {
        chart.id = obj.id;

        chart.symbol = obj.symbol;
        chart.frame = document.getElementById(chart.id);
        chart.data = obj.data;
        chart.line = obj.line;
        chart.type = obj.type;
        chart.last = obj.last;

        chart.zoom = obj.zoom;
        chart.pan = obj.pan;
        chart.range = { price: obj.range };

        chart.watermark = obj.watermark;
        chart.previous = obj.previous;
        chart.alert1 = obj.alert1;
        chart.alert2 = obj.alert2;
        chart.cursor = undefined;
        chart.mode = undefined;
        chart.x = '';
        chart.y = '';
    };

    chart.coordY = function(value, coordRange, valueRange){
        var unit = (coordRange.min - coordRange.max) / (valueRange.max - valueRange.min);
        return Math.floor(coordRange.min - ((value - valueRange.min) * unit));
    };

    chart.valueY = function(coord, coordRange, valueRange){
        var unit = (coordRange.min - coordRange.max) / (valueRange.max - valueRange.min);
        return valueRange.min + ((coordRange.min - coord) / unit);
    };

    chart.draw = function() {
        data = chart.data.slice(chart.data.length - (chart.zoom - chart.pan), chart.data.length + chart.pan);

        var drawBars = function() {

            var i = 0; data.length < 45 ? i = chart.width / 50 : i = chart.width / (data.length + 2);

            x = 0;
            context.beginPath();
            _.forEach(data, function(point){
                context.lineTo(Math.floor(x), chart.coordY(point.vwap, chart.defaults.coordRangeY1, chart.range.price));
                x += i;
            });
            context.strokeStyle = '#00FFFF';
            context.lineWidth = 1;
            context.stroke();

            x = 0;
            context.beginPath();
            _.forEach(data, function(point){
                context.lineTo(Math.floor(x), chart.coordY(point.ma20, chart.defaults.coordRangeY1, chart.range.price));
                x += i;
            });
            context.strokeStyle = '#7F7F7F';
            context.lineWidth = 1;
            context.stroke();

            // volume
            x = i/2;
            context.beginPath();
            _.forEach(data, function(point){
                var c = chart.defaults.coordRangeY2.min,
                    o = chart.coordY(point.volume, chart.defaults.coordRangeY2, chart.range.volume);
                context.rect(x - 2, c, 4, o - c);
                x += i;
            });
            context.fillStyle = '#0B357E';
            context.strokeStyle = '#0F47AB';
            context.lineWidth = 1;
            context.fill();
            context.stroke();


            // price bar
            x = i/2;
            _.forEach(data, function(point){
                context.beginPath();
                context.moveTo(Math.floor(x), chart.coordY(point.high, chart.defaults.coordRangeY1, chart.range.price));
                context.lineTo(Math.floor(x), chart.coordY(point.low, chart.defaults.coordRangeY1, chart.range.price));
                if (point.open > point.close) {
                    context.strokeStyle = '#B5B5B8';
                    context.lineWidth = 1;
                    context.stroke();
                } else {
                    context.strokeStyle = '#B5B5B8';
                    context.lineWidth = 1;
                    context.stroke();
                }
                x += i;
            });

            x = i/2;
            _.forEach(data, function(point){
                context.beginPath();
                var c = chart.coordY(point.close, chart.defaults.coordRangeY1, chart.range.price),
                    o = chart.coordY(point.open, chart.defaults.coordRangeY1, chart.range.price);
                    
                if (data.length < 50) {
                    context.rect(Math.floor(x) - 2, o, 4, c - o);
                } else if (data.length >= 45 && data.length < 120) {
                    context.rect(Math.floor(x) - 1, o, 2, c - o);
                } else {
                    context.moveTo(Math.floor(x), chart.coordY(point.open, chart.defaults.coordRangeY1, chart.range.price));
                    context.lineTo(Math.floor(x), chart.coordY(point.close, chart.defaults.coordRangeY1, chart.range.price));
                }

                if (point.open > point.close) {
                    context.fillStyle = '#D11D17';
                    context.strokeStyle = '#FFAD7D';
                    context.lineWidth = 1;
                    context.fill();
                    context.stroke();
                } else {
                    context.fillStyle = '#36A845';
                    context.strokeStyle = '#74E05E';
                    context.lineWidth = 1;
                    context.fill();
                    context.stroke();
                }
                x += i;
            });

        };

        var drawLine = function(params){
            var data = params.data;
            var volume = params.volume !== undefined ? params.volume : true;
            var width = params.width ? params.width : 2;
            var range = params.range ? params.range : chart.range.price;
            var color = params.color ? params.color : '#4184F3';

            var i = 0; data.length < 45 ? i = chart.width / 50 : i = chart.width / (data.length + 2);

            x = 0;
            context.beginPath();
            _.forEach(data, function(point){
                context.lineTo(Math.floor(x), chart.coordY(point.vwap, chart.defaults.coordRangeY1, range));
                x += i;
            });
            context.strokeStyle = '#00FFFF';
            context.lineWidth = width;
            context.stroke();

            x = 0;
            context.beginPath();
            _.forEach(data, function(point){
                context.lineTo(Math.floor(x), chart.coordY(point.ma20, chart.defaults.coordRangeY1, range));
                x += i;
            });
            context.strokeStyle = '#7F7F7F';
            context.lineWidth = 1;
            context.stroke();


            // price

            x = 0;

            context.beginPath();
            _.forEach(data, function(point){
                context.lineTo(x, chart.coordY(point.close, chart.defaults.coordRangeY1, range));
                x += i;
            });


            context.strokeStyle = color;

            if (!params.color && chart.previous) {
                var close = data[data.length - 1].close;

                if (!close) close = data[data.length - 2].close; // TODO: find out why?

                if (close > chart.previous.close)
                    context.strokeStyle = '#36A845'
                else if (close < chart.previous.close)
                    context.strokeStyle = '#D75442';

                //context.strokeStyle = close > chart.previous.close ? '#36A845' : '#FF0000';

            }

            context.lineWidth = width;
            context.stroke();


            if (volume) {
                var x = 0;
                context.beginPath();
                _.forEach(data, function(point){
                    context.moveTo(x, chart.defaults.coordRangeY2.min);
                    context.lineTo(x, chart.coordY(point.volume, chart.defaults.coordRangeY2, chart.range.volume))
                    x += i;
                });
                //context.strokeStyle = '#CD00CD';
                //context.fillStyle = '#0B357E';
                context.strokeStyle = '#0F47AB';

                context.lineWidth = 2;
                context.stroke();
            }

        };

        if (data && data.length > 0 && chart.frame && chart.frame.canvas) {

            data.length < 45 ? chart.defaults.coordRangeY1 = { min: 190, max: 45 } : chart.defaults.coordRangeY1 = { min: 190, max: 25 };

            chart.width = chart.frame.clientWidth;
            chart.height = chart.frame.clientHeight;

            var context = chart.frame.canvas.getContext('2d');

            context.clearRect(-5, -5, 600, 400);


            if (chart.range.price) {
                chart.range.daily = chart.line && chart.line.length > 0 ? { max: chart.line[0].high, min: chart.line[0].low } : { max: 0, min: 0 },
                chart.range.volume = { max: data[0].volume, min: 0 };

                _.forEach(data, function(point){
                    if (point && point.volume && point.volume > chart.range.volume.max)
                        chart.range.volume.max = point.volume;
                });

            } else {
                chart.range = {
                    price: { max: data[0].high, min: data[0].low },
                    daily: chart.line && chart.line.length > 0 ? { max: chart.line[0].high, min: chart.line[0].low } : { max: 0, min: 0 },
                    volume: { max: data[0].volume, min: 0 }
                };

                _.forEach(data, function(point){
                    if (point) {
                        if (point.high && point.high > chart.range.price.max)
                            chart.range.price.max = point.high
                        if (point.low && point.low < chart.range.price.min)
                            chart.range.price.min = point.low;
                        if (point.volume && point.volume > chart.range.volume.max)
                            chart.range.volume.max = point.volume;
                    }
                });
            }

            chart.lines = [];

            var min = chart.valueY(200, chart.defaults.coordRangeY1, chart.range.price);
            var max = chart.valueY(  0, chart.defaults.coordRangeY1, chart.range.price);

            while (max > min) {
                if (parseFloat((max % .5).toFixed(2)) === 0 || parseFloat((max % 1).toFixed(2)) === 0)
                    chart.lines.push({price: max, coord: chart.coordY(max, chart.defaults.coordRangeY1, chart.range.price)});

                max = parseFloat((max -= 0.01).toFixed(2));
            }

            var intervals = [0.5, 1, 2, 5, 10, 20], reduce = [];

            for (var i = 0; i < intervals.length; i++){
                reduce = [];
                _.forEach(chart.lines, function(line){
                    if (parseFloat((line.price % intervals[i]).toFixed(2)) === 0) {
                        reduce.push(line);
                    }
                });
                if (reduce.length <= 10) break;
            }

            chart.lines = reduce;

            _.forEach(chart.lines, function(line){
                context.beginPath();
                context.moveTo(0, line.coord);
                context.lineTo(chart.width, line.coord);
                context.lineWidth = 0.3;
                context.strokeStyle = '#2d2d2d';
                context.stroke();
            });


            switch (chart.type) {
                case 1:
                    drawBars();
                    break;
                case 2:
                    drawLine({
                        data: data
                    });
                    break;
            }

            if (chart.cursor) {

                if (!chart.mode || chart.mode === '') context.setLineDash([2, 2]);
                context.beginPath();

                context.moveTo(0, chart.cursor.y);
                context.lineTo(600, chart.cursor.y);

                context.moveTo(chart.cursor.x, 0);
                context.lineTo(chart.cursor.x, 400);

                context.strokeStyle = '#9C9C9C';

                context.lineWidth = 0.7;
                context.stroke();
                context.setLineDash([]);

                chart.y = chart.valueY(chart.cursor.y, chart.defaults.coordRangeY1, chart.range.price);

                var interval, intervalRange = { min: 0, max: 0 };

                if (data.length < 45) {
                    intervalRange = { min: 0, max: 50 };
                } else {
                    intervalRange = { min: 0, max: data.length + 2 };
                }

                interval = parseInt(Math.floor(chart.valueY(chart.cursor.x, { min: 0, max: chart.width }, intervalRange)));

                var base = (chart.data.length) - (chart.zoom - chart.pan);

                var bar = chart.data[base + interval];

                if (bar && bar.time) {
                    var h = bar.time.hh < 10 ? '0' + bar.time.hh : bar.time.hh;
                    var m = bar.time.mm < 10 ? '0' + bar.time.mm : bar.time.mm;
                    chart.x = h + ':' + m;
                }
            }
        }
    };

    var draw = function() {
        chart.assign(this);
        if (chart.data && chart.data.length > 0) chart.draw();
    };

    var redraw = function(q, params) {
        var d = q.defer();

        chart.assign(this);

        if (params) {
            if (params.data) chart.data = params.data;
            if (params.line) chart.line = params.line;
            if (params.type) chart.type = params.type;
            if (params.mode) chart.mode = params.mode;
            if (params.last) chart.last = params.last;

            chart.zoom = params.zoom;
            chart.pan = params.pan;

            if (params.range) chart.range = { price: params.range };
            
            if (params.cursor) chart.cursor = params.cursor;
            
            chart.alert1 = params.alert1;
            chart.alert2 = params.alert2;

            chart.alertLinger1 = params.alertLinger1;
            chart.alertLinger2 = params.alertLinger2;
        }

        if (chart.data && chart.data.length > 0) chart.draw();

        d.resolve({
            x:chart.x, 
            y:chart.y, 
            w:chart.width, 
            h:chart.height, 
            m:chart.mode, 
            l:chart.last,
            r: { min: chart.range.price ? chart.range.price.min : 0, max: chart.range.price ? chart.range.price.max : 0 }
        });

        return d.promise;
    };

    return {
        draw: draw,
        redraw: redraw
    };

}();
