/**
 * Created by pranavram on 10/10/15.
 */
angular.module('app.provenance')
    .controller('provenance', provenance);

function provenance($scope, $timeout, dataservice) {
    $scope.controls = {
        type: 'event'
    };
    $scope.$watch('controls.type', function(prev, curr) {
        var preparedData = prepareData(provenanceData);
        activate(preparedData);
    });
    var iso = d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");
    var provenanceData = [];
    $scope.showGraph = false;
    $timeout(function() {
        dataservice.getHypothesesEvents()
            .then(function(data) {
                $scope.showGraph = true;
                provenanceData = data;
                var preparedData = prepareData(provenanceData);
                activate(preparedData);
            })
    });

    var optionsEvent = {
        chart: {
            type: 'lineWithFocusChart',
            //height: 450,
            margin : {
                top: 20,
                right: 20,
                bottom: 60,
                left: 40
            },
            transitionDuration: 500,
            // x: function(d) {
            //   return d.x;
            // },
            // xAxis: {
            //   staggerLabels: true,
            //   axisLabel: 'Events',
            //   tickFormat: function(d) {
            //     if(provenanceData[0].events[d]){
            //       return provenanceData[0].events[d].name;
            //     }
            //   }
            // }
            tooltip: {
               contentGenerator: function (e, i) {
                 var series = e.series[0];
                 if (series.value === null) return;
                 var rows =
                   "<tr>" +
                     "<td class='key'>" + 'Event: ' + "</td>" +
                     "<td class='x-value'>" + series.values[e.point.x].name + "</td>" +
                   "</tr>" +
                   "<tr>" +
                     "<td class='key'>" + 'Weight: ' + "</td>" +
                     "<td class='x-value'><strong>" + (series.value?series.value.toFixed(2):0) + "</strong></td>" +
                   "</tr>";

                 var header =
                   "<thead>" +
                     "<tr>" +
                       "<td class='legend-color-guide'><div style='background-color: " + series.color + ";'></div></td>" +
                       "<td class='key'><strong>" + series.key + "</strong></td>" +
                     "</tr>" +
                   "</thead>";

                 return "<table>" +
                     header +
                     "<tbody>" +
                       rows +
                     "</tbody>" +
                   "</table>";
               }
             }
        }
    };

    var optionsTime = {
            chart: {
                type: 'lineWithFocusChart',
                //height: 450,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 60,
                    left: 40
                },
                x: function(d) {
                    return d.x;
                },
                y: function(d) {
                    return d.y
                },
                transitionDuration: 500,
                xAxis: {
                   staggerLabels: true,
                   axisLabel: 'Time',
                   tickFormat: function(d){
                    // console.log(d, d3.time.format('%Y-%m-%dT%H:%M:%SZ')(new Date(d)));
                       return d3.time.format('%m-%d T%H:%M:%S')(new Date(d));
                   }
                },
                yAxis: {
                    axisLabel: 'Weight'
                },
                x2Axis: {
                  axisLabel: 'Time',
                  tickFormat: function(d){
                   // console.log(d, d3.time.format('%Y-%m-%dT%H:%M:%SZ')(new Date(d)));
                      return d3.time.format('%m-%d T%H:%M:%S')(new Date(d));
                  }

                }

            }
        };
    function prepareData(data) {
        if($scope.controls.type === 'event') {
            return data.map(function(hyp) {
                return {
                    key: hyp.name,
                    values: hyp.events.map(function(event, i) {
                        return {
                            x: i,
                            name: event.event +": "+event.name,
                            y: event.weight || 0
                        }
                    })
                }
            });
        }

        else {
            return data
                .map(function(hyp) {
                    return {
                        key: hyp.name,
                        values: hyp.events
                            .filter(function(event) {
                                return !!event.name;
                            })
                            .map(function(event) {
                                return {
                                    x: iso.parse(event.time.iso),
                                    y: event.weight || 0
                                }
                            })
                    }
                });
        }
    }
    function activate(data) {
        $scope.options = $scope.controls.type === 'event' ? optionsEvent : optionsTime;
        console.log(data);
        $scope.data = data;
    }
}
