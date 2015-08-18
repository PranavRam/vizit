(function(d3) {
	d3.vizit = d3.vizit || {};
	function Evidence() {
		var opts = {
			width: 250
		}

		var draggable = false;
		var drag = d3.behavior.drag()
		    .origin(function(d) { return d; })
		    .on("dragstart", function() { 
		    	d3.event.sourceEvent.stopPropagation();
		    	var targetNode = d3.event.sourceEvent.target;
					if(d3.select(targetNode).classed("header") || 
						$(targetNode).parents('.header').length) {
						draggable = true;
					};
		    })
		    .on("drag", dragmove)
		    .on("dragend", function(d) {
		    	draggable = false;
		    })

		function dragmove(d) {
			if(!draggable) return;
			d.x += d3.event.dx;
      d.y += d3.event.dy;
		  d3.select(this)
		      .attr({
		      	x: d.x,
		      	y: d.y
		      });
		}

		function component(selection) {
			selection.each(function(data, i) {
				// debugger;
				var parent = d3.select(this);
				var fo = parent.append("foreignObject")
    					    .attr({
    					    	x:data.x,
    					    	y:data.y
    					    })
				var wrapper = fo.append("xhtml:body")

				var container = wrapper
													.append("xhtml:div")
													.attr("class", "evidence");

				var header = container.append("xhtml:div").attr("class", "header");
				var body = container.append("xhtml:div").attr("class", "body");

				var title = header.append("xhtml:p").attr("class", "title");
				var count = header.append("xhtml:div").attr("class", "count");
				var showHide = header.append("xhtml:div").attr("class", "show-hide");

				container.style({
					"color": "white"
				})
				header
					.style({
						width: opts.width+"px",
						height: 50+"px",
						"background-color": "#283593",
						padding: "8px"
					})
					.attr({
						layout: "row",
						"layout-align": "space-around center"
					})


				title.text("Evidence "+i)
							.attr({
								flex: ""
							});

				count.style({
					"text-align": "center",
					"background-color": "#4CAF50",
					// "color": "white",
					width: 25+"px",
					height: 25+"px",
					padding: "8px"
				})
				.text("3")
				.attr({
					// flex: "5"
				})

				showHide.style({
					"text-align": "center",
					padding: "8px"
				})
				.html('<i class="fa fa-chevron-down"></i>')
				// .attr({
				// 	flex: "5"
				// })

				body.style({
					width: opts.width+"px",
					"min-height": 150+"px",
				})

				var node = $(container.node());
				fo.attr({
					width: opts.width,
					height: node.height()
				});

				fo.call(drag);
			})
		}
		return component;
	}
	d3.vizit.evidence = Evidence;
})(d3);