angular.module('vizit')
    .filter('to_trusted', ['$sce', function($sce){
        return function(text, scope) {
        	if(!text) return;
          return $sce.trustAsHtml(text);
        };
    }])
    .filter('sentences', function() {
    	var template = [
				'<div class="dropdown position-fixed" id="menu-<%= index %>">',
				  '<ul class="dropdown-menu" role="menu">',
				    '<li>',
				      'yo',
				    '</li>',
				  '</ul>',
				'</div>',
			].join('');
    	var compiled = _.template(template);
    	return function(text) {
    		if(!text) return text;
    		var result = text.match(/\(?[^\.\?\!]+[\.!\?]\)?/g);
    		return result = result.map(function(sentence, i) {
    			return '<span context-menu data-target="menu-'+i+'" hover-class="select-text" ng-click="check($event)">'+sentence+'</span>';
    		}).join(" ");
    	}
    })
    .directive('compileTemplate', function($compile, $parse){
	    return {
	      link: function(scope, element, attr){
	          var parsed = $parse(attr.ngBindHtml);
	          function getStringValue() { return (parsed(scope) || '').toString(); }

	          //Recompile if the template changes
	          scope.$watch(getStringValue, function() {
	              $compile(element, null, -9999)(scope);  //The -9999 makes it skip directives so that we do not recompile ourselves
	          });
		      }         
		  	}
			})
		.directive('hoverClass', function () {
		    return {
		        restrict: 'A',
		        link: function (scope, element, attrs) {
		            element.on('mouseenter', function() {
		                element.addClass(attrs["hoverClass"]);
		            });
		            element.on('mouseleave', function() {
		                element.removeClass(attrs["hoverClass"]);
		            });
		        }
		    };
		})