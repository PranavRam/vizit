(function(d3) {
	d3.vizit = d3.vizit || {};
	function Hypothesis() {
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
		var zoomDisabled = d3.behavior.zoom()
		    .on("zoom", function() {
		    	d3.event.sourceEvent.stopImmediatePropagation();
		    });

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
				var fo = parent.selectAll('foreignObject');
				var container = parent.selectAll('.hypothesis');
				var header = parent.selectAll('.header');
				var body = parent.selectAll('.body');
				var title = parent.selectAll('.title');
				var count = parent.selectAll('.count');
				var showHide = parent.selectAll('.show-hide');
				var tabs = body.selectAll('.tabs');
				var positiveTab = tabs.selectAll('.positive');
				var negativeTab = tabs.selectAll('.negative');
				data.tabType = 'positive';
				//var content = body.selectAll('.content');
				//var evidences = content.selectAll('.evidences');

				if(fo.empty()){
					fo = parent
									.append("foreignObject")
    					    .attr({
    					    	x:data.x,
    					    	y:data.y
    					    })

					var wrapper = fo.append("xhtml:body")

					container = wrapper
												.append("xhtml:div")
												.attr("class", "hypothesis");

					header = container.append("xhtml:div").attr("class", "header");
					body = container.append("xhtml:div").attr("class", "body");

					title = header.append("xhtml:p").attr("class", "title");
					count = header.append("xhtml:div").attr("class", "count");
					showHide = header.append("xhtml:div").attr("class", "show-hide");

					tabs = body.append('div')
						.attr('layout', 'row')
						.attr('class', 'tabs');

					positiveTab = tabs.append('div')
						.attr('flex', '')
						.attr('class', ' tab positive')
						.classed('selected', true)
						.text('Positive')
						.on('click', function(d) {
							negativeTab.classed('selected', false);
							positiveTab.classed('selected', true);
							data.tabType = 'positive'
							changeTab(data.tabType);
						});

					negativeTab = tabs.append('div')
						.attr('flex', '')
						.attr('class', 'tab negative')
						.text('Negative')
						.on('click', function(d) {
							negativeTab.classed('selected', true);
							positiveTab.classed('selected', false);
							data.tabType = 'negative'
							changeTab(data.tabType);
						});

					//content = body.append('div')
					//	.attr('class', 'content');
				}
				container.style({
					"color": "white"
				})
				header
					.style({
						width: opts.width+"px",
						height: 50+"px",
						"background-color": "#263238",
						padding: "8px"
					})
					.attr({
						layout: "row",
						"layout-align": "space-around center"
					})


				title.text(data.name)
							.attr({
								flex: ""
							});
				console.log(data);
				count.style({
					"text-align": "center",
					"background-color": "#4CAF50",
					// "color": "white",
					width: 25+"px",
					height: 25+"px",
					padding: "8px"
				})
				.text(data.weight)
				.attr({
					// flex: "5"
				});

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
					"height": 150+"px",
					"overflow-y": "auto"
				})

				//console.log(evidences);
				var node = $(container.node());
				fo.attr({
					width: opts.width,
					height: 200
				});
				changeTab(data.tabType);
				fo.call(drag);
				body.call(zoomDisabled);

				function changeTab(type) {
					var positiveData = data.positive || [];
					var negativeData = data.negative || [];
					var content = body.selectAll('.content');

					if(type === 'positive') {
						content = content.data(positiveData);
					}
					else {
						content = content.data(negativeData);
					}
					content.enter().append('p').attr('class', 'content');
					content.text(function(d) { return d.name; });
					content.exit().remove();
				}
			})
		}

		function accessor(key) {
			return function (value) {
				if (!arguments.length) return opts[key];
				opts[key] = value;
				return component;
			}
		}

		for (var n in opts) {
			if (opts.hasOwnProperty(n)) {
				component[n] = accessor(n);
			}
		}

		return component;
	}
	d3.vizit.hypothesis = Hypothesis;
})(d3);