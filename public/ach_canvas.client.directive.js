angular.module('vizit')
    .directive('achCanvas', achCanvas);

function achCanvas($timeout) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {
            var hypothesis = d3.vizit.hypothesis();
            var evidence = d3.vizit.evidence();
            var minimap = d3.minimap();
            var minimapScale = 0.05;
            var borderScale = d3.scale.linear()
                .domain([0.1, 1])
                .range([11, 3]);
            var minimapWidth = 250, minimapHeight = 150;
            var compile = function () {
                var achCanvas = $(el[0]);
                var svg = d3.select(achCanvas.get()[0]).append("svg");
                var translation = [0, 0];
                var scale = 1;

                svg.attr({
                    width: achCanvas.width(),
                    height: achCanvas.height()
                });

                var container = svg.append("g")
                    .attr({
                        "class": "ach-canvas-container",
                        "height": achCanvas.height(),
                        "width": achCanvas.width()
                    });
                var hypotheses = container.selectAll('.hypothesis');
                var evidences = container.selectAll('.evidence');

                var minimapLoc = [
                    achCanvas.width() - 8 - minimapWidth,
                    achCanvas.height() - 8 - minimapHeight
                ]

                // hypotheses = hypotheses.data([{x: 100, y: 100, name: "Hypothesis 0"}]);

                // var hp = hypotheses
                // 					.enter()
                // 					.append('g')
                // 	      .call(hypothesis)
                // 	      .on('click.hypothesis', function(d) {
                // 	      	scope.ach.selectedHypothesis = d;
                // 	      });

                function render() {
                    evidences = evidences.data(scope.evidences);
                    evidences.enter().append('g');
                    evidences.exit().remove();
                    evidences.call(evidence);

                    hypotheses = hypotheses.data(scope.hypotheses);
                    hypotheses.enter().append('g');
                    hypotheses.exit().remove();
                    hypotheses.call(hypothesis);
                }

                render();
                var zoom = d3.behavior.zoom()
                    .scaleExtent([0.1, 1])
                    .on("zoom", zoomHandler);

                function zoomHandler(newScale) {
                    newScale ? scale = newScale : scale = d3.event.scale;
                    translation = d3.event ? d3.event.translate : [0, 0];
                    container.attr("transform", "translate(" + translation + ")scale(" + scale + ")");

                    container.selectAll(".body")
                        .style({
                            "border-width": Math.round(borderScale(scale)) + "px"
                        });

                    minimap.render();
                }

                // fb.call(drag);
                svg.call(zoom);

                minimap
                    .zoom(zoom)
                    .target(container)
                    .minimapScale(minimapScale)
                    .minimapWidth(minimapWidth)
                    .minimapHeight(minimapHeight)
                    .x(minimapLoc[0])
                    .y(minimapLoc[1]);

                svg.call(minimap);

                zoom.scale(scale);
                zoomHandler(scale);
                scope.ach.updateACH = function () {
                    render();
                    minimap.render();

                };
                scope.$watch('ach.showDocumentViewer', function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        $timeout(function () {
                            svg
                                // .transition()
                                .attr({
                                    width: achCanvas.width(),
                                    height: achCanvas.height()
                                });
                            container
                                // .transition()
                                .attr({
                                    width: achCanvas.width(),
                                    height: achCanvas.height()
                                });

                            minimap
                                .target(container)
                                .x(achCanvas.width() - 8 - minimapWidth)
                                .y(achCanvas.height() - 8 - minimapHeight)
                                .render()
                        })
                    }
                });
                scope.$watch('ach.fullscreen', function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        $timeout(function () {
                            svg
                                // .transition()
                                .attr({
                                    width: achCanvas.width(),
                                    height: achCanvas.height()
                                });
                            container
                                // .transition()
                                .attr({
                                    width: achCanvas.width(),
                                    height: achCanvas.height()
                                });

                            minimap
                                .target(container)
                                .x(achCanvas.width() - 8 - minimapWidth)
                                .y(achCanvas.height() - 8 - minimapHeight)
                                .render()
                        })
                    }
                });
                scope.$watchCollection('evidences', function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        // console.log(scope.evidences);
                        render();
                    }
                });
                scope.$watchCollection('hypotheses', function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        // console.log(scope.evidences);
                        render();
                    }
                })
            };

            $timeout(compile);
        }
    }
}