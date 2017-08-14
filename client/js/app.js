var debug = {};

angular.module('app', []).controller('GridController', function($scope, $q, socket) {

    function drawChart(stock) {
        var d = $q.defer();

        if (stock.chart.graphic) {
            stock.chart.graphic.redraw($q, {
                data: stock.chart.data,
                type: $scope.bars ? 1 : 2,
                zoom: stock.chart.zoom,
                pan: stock.chart.pan,
                range: stock.range,
                cursor: $scope.cursor && $scope.cursor.id === stock.id ? $scope.cursor : undefined,

            }).then(function(value){

                var x = $('#' + stock.id + '-x'),
                    y = $('#' + stock.id + '-y');

                if ($scope.cursor) {
                    x.text(value.x === '' ? '' : value.x);
                    y.text(value.y === '' ? '' : parseFloat(value.y).toFixed(2));

                    $scope.cursor.x < value.w / 2 ? y.css({'left': '', 'right': '0px'}) : y.css({
                        'left': '0px',
                        'right': ''
                    });
                    
                    x.css({
                        'background-color': '#585858',
                        'color': '#FFF',
                        'left': ($scope.cursor.x - 16) + 'px'
                    });

                    y.css({
                        'background-color': '#585858',
                        'color': '#FFF',
                        'top': ($scope.cursor.y - 7) + 'px'
                    });

                    stock.ra = value.r; // current price range

                    d.resolve(value);

                } else {
                    x.text('');
                    y.text('');
                    d.resolve();
                }

            });

        } else {

            stock.chart.graphic = new Chart({
                id: stock.id,
                symbol: stock.symbol,
                data: stock.chart.data,
                zoom: stock.chart.data.length,
                pan: 0,
                width: 300,
                height: 200,
            });

            stock.chart.zoom = stock.chart.data.length;

            if (stock.chart.graphic) stock.chart.graphic.draw();

            d.resolve();
        }

        return d.promise;
    }

    function redraw() {
        _.forEach($scope.stocks, function(stock) {
            drawChart(stock);
        });
    }

    $scope.flag = function(flag) {
        var stock = getSelectedStock();
        if (stock) {
            for (var i = 1; i <= 5; i++) {
                if (flag === i) {
                    stock['flag' + i] = !stock['flag' + i];    
                } else {
                    stock['flag' + i] = false;
                }
            }
        }
    }

    $scope.mouseEnter = function(stock) {
        stock.hover = true;
    }

    $scope.mouseLeave = function(stock) {
        $scope.cursor = undefined;
        stock.hover = false;
        if (stock.chart.graphic) {
            drawChart(stock);
        }
    }

    $scope.mousemove = function(e) {
        if (e.event.buttons === 1) {
            $scope.moveChart(e.event.movementX, e.event.movementY)

        } else {
            $scope.cursor = { id: parseInt(e.id), x: e.event.pageX - (e.offset.left + 1), y: e.event.pageY - (e.offset.top + 2) };
            var stock = _.findWhere($scope.stocks, { id: $scope.cursor.id });
            if (stock && stock.chart.graphic) {
                drawChart(stock);
            }
        }
    }

    $scope.resize = function() {
        var width = $(document).width();

        var items = $('.grid-item');
        _.forEach(items, function(item){
            item.style.width = "306px";
        });

        var inputs = $('.grid-item-input');
        _.forEach(inputs, function(input){
            input.style.width = "306px";
        });

        var x = Math.floor(width / 314);
        var y = width % 314;
        var z = Math.floor(y / x) - 8;
        
        _.forEach(items, function(item){
            item.style.width = 306 + z + 'px';
        });

        _.forEach(inputs, function(input){
            input.style.width = 306 + z + 'px';
        });

        redraw();
    }

    function getSelectedStock() {
        for (var i = 0; i < $scope.stocks.length; i++) {
            if ($scope.stocks[i].hover) return $scope.stocks[i];
        }
    }

    $scope.toggleMode = function() {
        $scope.bars = !$scope.bars;
        redraw();
    };

    $scope.resetChart = function() {
        var stock = getSelectedStock();

        if (stock) {
            stock.chart.zoom = stock.chart.data.length;
            stock.chart.pan = 0;
            stock.range = undefined;

            drawChart(stock);
        }
    }

    $scope.moveChart = function(x, y) {
        if ($scope.cursor) {
            var stock = _.findWhere($scope.stocks, { id: $scope.cursor.id });

            if (stock && stock.chart.graphic) {
                var f = y;
                var r = stock.ra.max - stock.ra.min;
                var p = parseFloat(((r / 100) / 2).toFixed(2));

                if (p < 1) p = 0.01;

                p *= f;

                var min = stock.ra.min + p;
                var max = stock.ra.max + p;

                stock.range = { min: min, max: max };

                var f = x * -1;

                var c = stock.chart;

                c.auto = false;

                if (c.pan === 0 && c.zoom < 65) {
                    c.zoom -= f;
                    if (c.zoom < 1) c.zoom = 1;
                } else {
                    c.pan += f;
                    if (c.pan > 0) {
                        c.pan = 0 
                    } else if (c.pan < (c.data.length - c.zoom) * -1) {
                        c.pan = (c.data.length - c.zoom) * -1;
                    }
                }

                drawChart(stock);
            }
        }
    }

    $scope.setChartRange = function(factor) { 
        var stock = _.findWhere($scope.stocks, { id: $scope.cursor.id });
        if (stock && stock.chart.graphic) {
            var c = stock.chart;

            if (c.data && c.data.length > 0) {
                var f = factor * -1;
                var r = stock.ra.max - stock.ra.min;
                var p = parseFloat(((r / 100) / 2).toFixed(2));

                if (p < 1) p = 0.01;

                p *= f;

                c.auto = false;

                var min = stock.ra.min - p;
                var max = stock.ra.max + p;

                if (min < max) {
                    stock.range = { min: min, max: max };
                    drawChart(stock);
                }
            }
        }
    }

    $scope.zoomChart = function(factor) {
        var stock = _.findWhere($scope.stocks, { id: $scope.cursor.id });
        
        if (stock && stock.chart.graphic) {
            var c = stock.chart;

            if (c.data && c.data.length > 0) {
                var f = Math.ceil(factor / 2) * -1;

                c.auto = false;
                c.zoom += f;

                if (c.zoom > c.data.length) {
                    c.zoom = c.data.length;
                } else if (c.pan !== 0 && c.zoom < 65) {
                    c.zoom = 65;
                } else if (c.zoom < 1) {
                    c.zoom = 1;
                }

                if (c.pan < (c.data.length - c.zoom) * -1) {
                    c.pan = (c.data.length - c.zoom) * -1;
                }

                drawChart(stock);
            }
        }
    }

    $scope.panChart = function(factor) {
        var stock = _.findWhere($scope.stocks, { id: $scope.cursor.id });
        if (stock && stock.chart.graphic) {
            var c = stock.chart;

            if (c.data && c.data.length > 0) {
                var f = Math.floor(factor / 2) * -1;

                c.auto = false;

                if (c.pan === 0 && c.zoom < 65) {
                    c.zoom -= f;    
                } else {
                    c.pan += f;
                    if (c.pan > 0) {
                        c.pan = 0 
                    } else if (c.pan < (c.data.length - c.zoom) * -1) {
                        c.pan = (c.data.length - c.zoom) * -1;
                    }
                }

                drawChart(stock);
            }
        }
    }

    $scope.init = function(){
        $scope.bars = true;
        socket.on('stocks:get', function(result){
            $scope.stocks = result;
            debug.stocks = result;
        });
        socket.emit('stocks:get');
    };

    $scope.init();
})

.directive('appResize', function() {
    return {
        restrict: 'A',
        link: function(scope) {
            $(window).on('resize', function (e) {
                scope.$apply(scope.resize(document.body.clientWidth));
            });
        }
    };
})

.directive('appMouseMove', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.on('mousemove', function(e) {
                scope.$apply(function() {
                    scope.mousemove({
                        id: attrs.appMouseMove,
                        event: e,
                        offset: $('#' + attrs.appMouseMove).offset()
                    });
                });
            });
        }
    };
})

.directive('appScroll', function ($window) {
    return {
    restrict: 'A',
        link: function(scope, element, attrs) {
            element.on('DOMMouseScroll mousewheel', function (event) {
                if (event) { 
                    if (event.altKey) {
                        if (scope.cursor) {
                            scope.$apply(function() {
                                if (event.wheelDeltaY !== 0) scope.setChartRange(event.wheelDeltaY);
                            });
                            return prevent(event);
                        }

                    } else if (event.ctrlKey) {
                        if (scope.cursor) {
                            scope.$apply(function() {
                                if (event.wheelDeltaX !== 0) scope.panChart(event.wheelDeltaX);
                                if (event.wheelDeltaY !== 0) scope.zoomChart(event.wheelDeltaY);
                            });
                            return prevent(event);
                        }
                    }
                }
            });

            function prevent(event) {
                event.stopPropagation();
                event.preventDefault();
                event.returnValue = false;
                return false;
            };
        }
    };
})

.directive('appKeyPress', function($window, $document) {
    return {
        restrict: 'A',
        require : '?ngModel',
        link: function(scope, element, attrs, ngModel) {
            angular.element($window).on('keyup', function(e) {

                // console.log('appKeyPress');

                var focused = $(':focus');

                if (focused && focused.length === 0) {
                    if (e.shiftKey) {
                        if (e.keyCode === 49) { // toggle highlight orange (shft + 1)
                            scope.$apply(function(){scope.flag(1)});

                        } else if (e.keyCode === 50) { // toggle highlight blue (shft + 2)
                            scope.$apply(function(){scope.flag(2)});

                        } else if (e.keyCode === 51) { // toggle highlight red (shft + 3)
                            scope.$apply(function(){scope.flag(3)});

                        } else if (e.keyCode === 52) { // toggle highlight green (shft + 4)
                            scope.$apply(function(){scope.flag(4)});

                        } else if (e.keyCode === 53) { // toggle highlight green (shft + 5)
                            scope.$apply(function(){scope.flag(5)});
                        }

                //     if (!scope.tickerSearch) {
                //         if (e.shiftKey) {
                //             if (e.keyCode === 49) { // toggle highlight orange (shft + 1)
                //                 scope.$apply(function(){scope.flag1()});

                //             } else if (e.keyCode === 50) { // toggle highlight blue (shft + 2)
                //                 scope.$apply(function(){scope.flag2()});

                //             } else if (e.keyCode === 51) { // toggle highlight red (shft + 3)
                //                 scope.$apply(function(){scope.flag3()});

                //             } else if (e.keyCode === 52) { // toggle highlight green (shft + 4)
                //                 scope.$apply(function(){scope.flag4()});

                //             } else if (e.keyCode === 53) { // toggle highlight green (shft + 4)
                //                 scope.$apply(function(){scope.flag5()});
                //             }

                        } else if (e.ctrlKey) {
                            if (e.keyCode === 53) { // sort on change (ctrl + %)
                                // scope.$apply(function(){scope.sort('c')});

                            } else if (e.keyCode === 65) { // sort on symbol (ctrl + a)
                                // scope.$apply(function(){scope.sort('s')});

                            } else if (e.keyCode === 80) { // toggle period (ctrl + p)
                                // scope.$apply(function(){scope.togglePeriod()});

                            } else if (e.keyCode === 77) { // toggle mode (line/bar) (ctrl + m)
                                scope.$apply(function(){scope.toggleMode()});

                            } else if (e.keyCode === 70) { // toggle filter using flags (ctrl + f)
                                // scope.$apply(function(){scope.toggleFlagFilter()});
                            }

                        } else if (e.altKey) {
                            if (e.keyCode === 49) { // set alert 1 (alt + 1)
                                // scope.$apply(function(){scope.setMode('alert1')});

                            } else if (e.keyCode === 50) { // set alert 2 (alt + 2)
                                // scope.$apply(function(){scope.setMode('alert2')});

                            } else if (e.keyCode === 68) { // delete (alt + d)
                                // scope.$apply(function(){scope.delete()});

                            } else if (e.keyCode === 81) { // reset chart (alt + q)
                                scope.$apply(function(){scope.resetChart()});

                            } else if (e.keyCode === 84) { // trade (alt + t)
                                // scope.$apply(function(){scope.setMode('trade')});
                            }
                        }

                //         } else if ((e.keyCode > 64 && e.keyCode < 91) || (e.keyCode > 96 && e.keyCode < 123)) {

                //             var focused = $(':focus');

                //             if (focused && focused.length === 0) {
                //                 var input = $("#search");

                //                 scope.$apply(function(){
                //                     scope.showTickerSearch();
                //                 });

                //                 input.val(e.key);
                //                 input[0].setSelectionRange(2, 2);
                //                 input.focus();

                //                 var ngModel = angular.element(document.activeElement).controller('ngModel');

                //                 ngModel.$setViewValue(e.key);
                //                 ngModel.$render();

                //             }
                //         } else if (e.keyCode === 27) {
                //             scope.$apply(function () {
                //                 scope.esc(angular.element(document.activeElement).attr('data-name'))
                //             });
                //         }
                //     }

                // } else {
                //     if (e.keyCode === 27) {
                //         scope.$apply(function () {
                //             scope.esc(angular.element(document.activeElement).attr('data-name'))
                //         });
                //     } else {
                //         if (focused[0].attributes['data']) {
                //             scope.$apply(function () {
                //                 scope.saveNotes(focused[0].attributes['data'].value);
                //             });
                //         }
                //     }

                }
            });
        }
    };
})

.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.resize();
                    // scope.sort(scope.sorted.by());
                });
            }

        }
    };
})

.factory('socket', function ($rootScope) {
    var socket = io.connect(config.server);

    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
})