(function(d3) {
	d3.minimap = d3.minimap || {};
	
	function getXYFromTranslate(translateString) {
		var split = translateString.split(",");
		var x = split[0] ? ~~split[0].split("(")[1] : 0;
		var y = split[1] ? ~~split[1].split(")")[0] : 0;
		return [x, y];
	}
	function Minimap() {
		var opts = {
			x: 0,
			y: 0,
			canvasWidth: 0,
			canvasHeight: 0,
			minimapWidth: 0,
			minimapHeight: 0,
			minimapBgColor: "#e0e0e0",
			minimapHandleColor: "#757575",
			minimapHandleX: 0,
			minimapHandleY: 0,
			zoom: null,
			target: null,
			scale: 1,
			minimapScale: 0.15
		}

		function component(selection) {
			var svg = selection;

			var minimapContainer = svg.append("g")
																.attr("class", "minimap-container");

			var minimapBg =	minimapContainer
												.append("rect")
												.attr("class", "minimap-background");

			var minimap = minimapContainer
												.append("g")
												.attr("class", "minimap-content");

			var minimapHandleContainer = minimap.append("g")
																		.attr("class", "minimap-handle-container");
			var minimapClone = minimap.append("g").attr("class", "minimap-clone");

			var minimapHandle = minimapHandleContainer
																			.append("rect")
																			.attr({
																				"class": "minimap-handle",
																				"width": opts.canvasWidth,
																				"height": opts.canvasHeight,
																			});

			function dragstart() {
				var frameTranslate = getXYFromTranslate(minimapHandleContainer.attr("transform"));
				opts.minimapHandleX = frameTranslate[0];
				opts.minimapHandleY = frameTranslate[1];
			}

			function dragmove() {
				d3.event.sourceEvent.stopImmediatePropagation();
				opts.minimapHandleX += d3.event.dx;
				opts.minimapHandleY += d3.event.dy;

				var minimapHandleTransform = [
					opts.minimapHandleX,
					opts.minimapHandleY
				];

				minimapHandleContainer
						.attr({
							"transform": "translate("+minimapHandleTransform+")"
						});

				var translate = [
					-opts.minimapHandleX * opts.scale,
					-opts.minimapHandleY * opts.scale,
				];
				// console.log(opts.scale);
				opts.target
								.attr({
									"transform": "translate(" + translate + ")scale(" + opts.scale + ")"
								})
				opts.zoom.translate(translate);
				opts.zoom.event(opts.target);
			}
			var drag = d3.behavior.drag()
									.on("dragstart.minimap", dragstart)
									.on("drag.minimap", dragmove);

			var dragDisabled = d3.behavior.drag()
									.on("dragstart.minimap", function() {
										d3.event.sourceEvent.stopImmediatePropagation();
									});

			var zoomDisabled = d3.behavior.zoom()
			    .on("zoom", function() {
			    	d3.event.sourceEvent.stopImmediatePropagation();
			    });

			opts.zoom.on("zoom.minimap", function() {
				opts.scale = d3.event.scale;
			});

			minimapHandleContainer.call(drag);
			minimapBg.call(dragDisabled);
			minimapBg.call(zoomDisabled);

			component.render = function() {
				opts.scale = opts.zoom.scale();

				minimapContainer
					.attr({
						"transform": "translate("+ [opts.x, opts.y] +")"
					});

				minimap
					.attr({
						"transform": "scale("+ opts.minimapScale +")"
					});

				minimapBg
						.attr({
							"width": opts.minimapWidth,
							"height": opts.minimapHeight
						})
						.style({
							"fill": opts.minimapBgColor
						})

				var targetTranslate = getXYFromTranslate(opts.target.attr("transform"));
				var minimapHandleTransform = [
					-targetTranslate[0] / opts.scale,
					-targetTranslate[1] / opts.scale
				];

				minimapHandleContainer
						.attr({
							"transform": "translate("+ minimapHandleTransform +")"
						});

				minimapHandle
								.attr({
									"width": opts.canvasWidth / opts.scale,
									"height": opts.canvasHeight / opts.scale,
								})
								.style({
									fill: opts.minimapHandleColor
								})
				var clone = opts.target.node().cloneNode(true);
				clone.removeAttribute("transform");
				minimapClone.selectAll('.ach-canvas-container').remove();
				minimapClone.node().appendChild(clone);

			}
		}

		function accessor(key) {
			return function(value) {
				if(!arguments.length) return opts[key];
				opts[key] = value;
				return component;
			}
		}

		for(var n in opts) {
			if(opts.hasOwnProperty(n)) {
				component[n] = accessor(n);
			}
		}

		component.target = function(value) {
			if(!arguments.length) return opts.target;
			opts.target = value;
			opts.canvasWidth = +value.attr("width");
			opts.canvasHeight = +value.attr("height");
			return component;
		}

		return component;
	}
	d3.minimap = Minimap;
})(d3);