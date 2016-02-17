(function () {
    'use strict';
    angular.module('app.achcanvas')
        .directive('vzAchcanvas', vzAchcanvas);

    function vzAchcanvas($rootScope, $timeout, dataservice, allData) {
        return {
            restrict: 'EA',
            transclude: true,
            templateUrl: 'public/achcanvas/vzAchcanvas.html',
            link: function (scope, el, attrs) {
                var compile = function () {
                    var hypothesis = d3.vizit.hypothesis().onDragEnd(onHypothesisDragEnd);
                    var evidence = d3.vizit.evidence().onDragEnd(onEvidenceDragEnd);
                    var minimap = d3.minimap();
                    var minimapScale = 0.05;
                    var borderScale = d3.scale.linear()
                        .domain([0.1, 1])
                        .range([11, 3]);
                    var minimapWidth = 250, minimapHeight = 150;
                    var achCanvas = $(el[0]);
                    var svg = d3.select(el.find('svg')[0]);
                    var t;
                    var pattern;
                    var translation = [0, 0];
                    var scale = 1;
                    var minimapLoc = [
                        achCanvas.width() - 8 - minimapWidth,
                        achCanvas.height() - 8 - minimapHeight
                    ];
                    var zoom = d3.behavior.zoom()
                        .scaleExtent([0.1, 1])
                        .on("zoom", zoomHandler);
                    var container;
                    var hypotheses;
                    var evidences;

                    svg.attr({
                        width: achCanvas.width(),
                        height: achCanvas.height()
                    });

                    function addPattern() {
                        t = textures.circles()
                            .lighter();

                        svg.call(t);

                        //svg.append("circle")
                        //    .style("fill", t.url());
                        //rect = svg.append("rect")
                        //    .attr("x", 0)
                        //    .attr("width", achCanvas.width())
                        //    .attr("height", achCanvas.height())
                        //    .style("fill", 'white');

                        pattern = svg.append("rect")
                            .attr("x", 0)
                            .attr("width", achCanvas.width())
                            .attr("height", achCanvas.height())
                            .style("fill", t.url());
                            //.attr('fill', 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiPjwvcmVjdD4KPC9zdmc+")');
                    }
                    addPattern();
                    container = svg.append("g")
                        .attr({
                            "class": "ach-canvas-container",
                            "height": achCanvas.height(),
                            "width": achCanvas.width()
                        });

                    hypotheses = container.selectAll('.hypothesis');
                    evidences = container.selectAll('.evidence');

                    // hypotheses = hypotheses.data([{x: 100, y: 100, name: "Hypothesis 0"}]);

                    // var hp = hypotheses
                    // 					.enter()
                    // 					.append('g')
                    // 	      .call(hypothesis)
                    // 	      .on('click.hypothesis', function(d) {
                    // 	      	scope.ach.selectedHypothesis = d;
                    // 	      });

                    function render() {
                        evidences = evidences.data(scope.evidences, function(d) { return d._id; });
                        evidences.enter().append('g');
                        evidences.exit().remove();
                        evidences.call(evidence);

                        hypotheses = hypotheses.data(scope.hypotheses, function(d) { return d._id; });
                        hypotheses.enter().append('g');
                        hypotheses.exit().remove();
                        hypotheses.call(hypothesis);
                    }

                    render();

                    function zoomHandler(newScale) {
                        scale = newScale ? newScale : d3.event.scale;
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

                    scope.$on('loadedData', function() {
                        render();
                        minimap.render();
                    });
                    scope.ach.updateACH = function () {
                        render();
                        minimap.render();

                    };
                    scope.ach.moveTo = function(item) {
                        scale = 1;
                        translation = [-item.x + 100, -item.y + 100];
                        container
                            .transition()
                            .attr("transform", "translate(" + translation + ")scale(" + scale + ")")
                            .each("end", function() {
                                minimap.scale(scale);
                                minimap.render();
                            });
                        container.selectAll(".body")
                            .style({
                                "border-width": Math.round(borderScale(scale)) + "px"
                            });
                    };

                    function resize() {
                        $timeout(function () {
                            svg
                                // .transition()
                                .attr({
                                    width: achCanvas.width(),
                                    height: achCanvas.height()
                                });

                            pattern
                                .attr("width", achCanvas.width())
                                .attr("height", achCanvas.height())
                                .style("fill", t.url());

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
                        },200)
                    }
                    $rootScope.$on('showDocumentViewer:changed', function (event, mass) {
                        resize()
                    });
                    scope.$watch('ach.fullscreen', function (newVal, oldVal) {
                        resize()
                    });
                    /*scope.$watchGroup('evidences', function (newVal, oldVal) {
                        //if (newVal !== oldVal) {
                            // console.log(scope.evidences);
                            render();
                            minimap.render();
                        //}
                    });
                    scope.$watchCollection('hypotheses', function (newVal, oldVal) {
                        //if (newVal !== oldVal) {
                            // console.log(scope.evidences);
                            render();
                            minimap.render();
                        //}
                    });*/

                    function intersectRect(r1, r2, width, height) {
                        return !(r2.x > (r1.x + width) ||
                        (r2.x + width) < r1.x ||
                        r2.y > (r1.y + height) ||
                        (r2.y + height) < r1.y);
                    }

                    function onHypothesisDragEnd(d) {
                        dataservice.updateHypothesis(d);
                    }

                    function onEvidenceDragEnd(d, event) {
                        console.log('dragged', d, event);
                        var found = false;
                        scope.hypotheses.every(function(hypothesis, loc) {
                            if(intersectRect(d, hypothesis, 250, 200)) {
                                //console.log(hypothesis);
                                found = true;
                                hypothesis.tabType = d3.select(hypotheses[0][loc]).select(".tabs").attr("data-type");
                                // hypothesis[hypothesis.tabType] = hypothesis[hypothesis.tabType] || [];
                                if(_.findIndex(hypothesis[hypothesis.tabType], '_id', d._id)) {
                                    hypothesis[hypothesis.tabType].push(d);
/*                                    var weight = 0;
                                    hypothesis['positive'].forEach(function(evidence) {
                                        weight += evidence.weight;
                                    });
                                    hypothesis['negative'].forEach(function(evidence) {
                                        weight -= evidence.weight;
                                    });
                                    hypothesis.weight = weight;*/
                                    // render();
                                    //console.log('intersect', hypothesis);
                                    dataservice.updateHypothesis(hypothesis, d);
                                    return false;
                                }
                            }
                            return true;
                        });
                        if(!found) {
                            dataservice.updateEvidence(d);
                        }
                        return found;
                    }
                };

                $timeout(compile);
            }
        }
    }
})();