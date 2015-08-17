angular.module('vizit')
				.directive('achCanvas', achCanvas);

function achCanvas($timeout) {
	return {
    restrict: 'A',
    link: function(scope, el, attrs) {
    	var compile = function() {
    		var achCanvas = $(el[0]);
    		var svg = d3.select(achCanvas.get()[0]).append('svg');

    		svg.attr({
    			width: achCanvas.width(),
    			height: achCanvas.height()
    		});
    	}

    	$timeout(compile);
    }
  }
}