d3.vizit = {};
(function(d3) {
	function Hypothesis() {
		function component(selection) {
			selection.each(function(data) {
				var container = d3.select(this);
				container
					.append("rect")
			    .attr("width", 250)
			    .attr("height", 150)
			    .style("fill", "red")
			    .attr({
			    	x: 100,
			    	y: 100
			    });
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

				var fb = container
									.append("foreignObject")
							    .attr({
							    	width: 100,
							    	height: 100,
							    	x:100,
							    	y:100
							    });
    		fb.data([{x: 100, y: 100}]);

		    var div = fb
								  	.append("xhtml:body").append("xhtml:div")
								    .style({
								    	"background-color": "red",
								    	width: 100+'px',
								    	height: 100+'px'
								    });
			  var zoom = d3.behavior.zoom()
			      .scaleExtent([1, 10])
			      .on("zoom", zoomed);

				var drag = d3.behavior.drag()
				    .origin(function(d) { return d; })
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

				function zoomed() {
				  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
				}
				// fb.call(drag);
				svg.call(zoom);
    	}

    	$timeout(compile);
    }
  }
}