angular.module('vizit')
				.directive('achCanvas', achCanvas);

function achCanvas($timeout) {
	return {
    restrict: 'A',
    link: function(scope, el, attrs) {
    	var compile = function() {
    		var achCanvas = $(el[0]);
    		var svg = d3.select(achCanvas.get()[0]).append("svg");

    		svg.attr({
    			width: achCanvas.width(),
    			height: achCanvas.height()
    		});

    		var container = svg.append("g");

    		container.append("rect")
    .attr("width", 200)
    .attr("height", 200)
    .style("fill", "blue")
    .style("pointer-events", "all");

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
				fb.call(drag);
				container.call(zoom);
    	}

    	$timeout(compile);
    }
  }
}