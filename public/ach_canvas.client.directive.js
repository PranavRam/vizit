d3.vizit = {};
(function(d3) {
	function Hypothesis() {
		var opts = {
			width: 200
		}
		function component(selection) {
			selection.each(function(data) {
				// debugger;
				var parent = d3.select(this);
				var fo = parent.append("foreignObject")
    					    .attr({
    					    	x:data.x,
    					    	y:data.y
    					    })
				var wrapper = fo.append("xhtml:body")

				var container = wrapper
													.append('xhtml:div')
													.attr('class', 'hypothesis');

				var header = container.append('xhtml:div');
				var body = container.append('xhtml:div')

				header.style({
					width: opts.width+'px',
					height: 50+'px',
					"background-color": "red"
				})
				body.style({
					width: opts.width+'px',
					height: 150+'px',
					"background-color": "blue"
				})

				var node = $(container.node());
				fo.attr({
					width: opts.width,
					height: node.height()
				});

				var drag = d3.behavior.drag()
				    .origin(function(d) { return d; })
				    .on('dragstart', function() { d3.event.sourceEvent.stopPropagation(); })
				    .on("drag", dragmove);

				function dragmove(d) {
					d.x += d3.event.dx;
          d.y += d3.event.dy;
					var translate = [d.x, d.y];
				  d3.select(this)
				      .attr({
				      	x: d.x,
				      	y: d.y
				      });
				}

				fo.call(drag);
			})
		}
		return component;
	}
	d3.vizit.hypothesis = Hypothesis;
})(d3);

angular.module('vizit')
				.directive('achCanvas', achCanvas);

function achCanvas($timeout) {
	return {
    restrict: 'A',
    link: function(scope, el, attrs) {
    	var hypothesis = d3.vizit.hypothesis();
    	var compile = function() {
    		var achCanvas = $(el[0]);
    		var svg = d3.select(achCanvas.get()[0]).append("svg");

    		svg.attr({
    			width: achCanvas.width(),
    			height: achCanvas.height()
    		});

    		var container = svg.append("g");
    		var hypotheses = container.selectAll('.hypothesis');
    		var minimap = svg.append("rect")
											    .attr("width", 250)
											    .attr("height", 150)
											    .style("fill", "gray")
											    .attr({
											    	x: achCanvas.width() - 8 - 250,
											    	y: achCanvas.height() - 8 - 150
											    })
											    .style("pointer-events", "all");

				// var hypotheses = container.selectAll('.hypothesis');

				// 										hypotheses
				// 											.data([0])
				// 											.enter()
				// 											.append('g')
				// 											.call(hypothesis);

    		
    		hypotheses = hypotheses.data([{x: 100, y: 100}, {x: 200, y: 200}]);

    		var fb = hypotheses
    							.enter()
    							.append('g')
  					      .call(hypothesis);

		    // var div = fb.enter()
								  	

			  var zoom = d3.behavior.zoom()
			      .scaleExtent([0.1, 1])
			      .on("zoom", zoomed);

				function zoomed() {
				  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
				}
				// fb.call(drag);
				svg.call(zoom);

				scope.$watch('ach.fullscreen', function(newVal, oldVal) {
					if(newVal !== oldVal) {
						$timeout(function() {
							svg
								// .transition()
								.attr({
									width: achCanvas.width(),
									height: achCanvas.height()
								});

							minimap
								// .transition()
								.attr({
						    	x: achCanvas.width() - 8 - 250,
						    	y: achCanvas.height() - 8 - 150
						    })
						})
					}
				})
    	}

    	$timeout(compile);
    }
  }
}