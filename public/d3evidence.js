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
				var container = parent.selectAll('.evidence');
				var header = parent.selectAll('.header');
				var body = parent.selectAll('.body');
				var title = parent.selectAll('.title');
				var count = parent.selectAll('.count');
				var showHide = parent.selectAll('.show-hide');

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
												.attr("class", "evidence");

					header = container.append("xhtml:div").attr("class", "header");
					body = container.append("xhtml:div").attr("class", "body");

					title = header.append("xhtml:p").attr("class", "title");
					count = header.append("xhtml:div").attr("class", "count");
					showHide = header.append("xhtml:div").attr("class", "show-hide");
				}

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


				title.text(data.name)
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
				.text(data.weight)
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
					"height": 150+"px",
					color: 'black',
					'font-size': '11px',
					'overflow-y': 'auto'
				});
				var content = body.selectAll('.content').data(data.content);

				content.enter().append('p')
					.attr('class', 'content')
					.html(function(d) { return d.name + '<br />' + d.text});
				content.exit().remove();
				// var text = 'A Special Asparagus Season<br>Story by: <person data-entity-id="2635">Ellie</person> <person data-entity-id="2636">Olmsen</person><br><person data-entity-id="2637">Date</person> Published to Web: <date data-entity-id="2638">7/3/2004</date><br><br><organization data-entity-id="2639">ALDERWOOD</organization> - Local asparagus is on the stands <date data-entity-id="2640">early</date> <date data-entity-id="2641">this</date> <date data-entity-id="2642">year</date> in <location data-entity-id="2643">Eastern</location> <location data-entity-id="2644">Washington</location>, catching both farmers and consumers off guard.'
				// body.html(text);
				// var node = $(container.node());
				fo.attr({
					width: opts.width,
					height: 200
				});

				fo.call(drag);
				body.call(zoomDisabled);
			})
		}
		return component;
	}
	d3.vizit.evidence = Evidence;
})(d3);