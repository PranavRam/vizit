angular.module('vizit')
    .filter('to_trusted', ['$sce', function($sce){
        return function(text, scope) {
        	if(!text) return;
          return $sce.trustAsHtml(text);
        };
    }])
    .filter('sentences', function() {

    	// var compiled = _.template(template);
    	return function(text) {
    		if(!text) return text;
    		var result = text.match(/\(?[^\.\?\!]+[\.!\?]\)?/g);
    		return result = result.map(function(sentence, i) {
    			return '<span context-menu data-target="menu-'+i+'" hover-class="select-text">'+sentence+'</span>';
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
		.directive('hoverClass', function ($document) {
		    return {
		        restrict: 'A',
		        link: function (scope, element, attrs) {
		        		var clicked = false;
		            element.on('click', function() {
		            	if(clicked){
		            		clicked = false;
		            		return element.removeClass(attrs["hoverClass"]);
		            	}
	                element.addClass(attrs["hoverClass"]);
	                clicked = true;
		            });
		            // element.on('mouseleave', function() {
		            // 	if(clicked) return;
	             //    element.removeClass(attrs["hoverClass"]);
	             //    clicked = false;
		            // });
		            // $document.bind('click.selectedText', function(event){
		            // 		if(event.target === element[0]) {
		            // 			element.addClass(attrs["hoverClass"]);
		            // 			clicked = true;
		            // 			return;
		            // 		}

              //       var isClickedElementChildOfPopup = element
              //           .find(event.target)
              //           .length > 0;

              //       if (isClickedElementChildOfPopup){
              //       	clicked = true;
              //         return;
              //       }

              //       // scope.$apply(function(){
              //       element.removeClass(attrs["hoverClass"]);
              //       clicked = false;
              //       // });
              //   });
		        }
		    };
		})
		.directive('autoHeight', function($timeout, $window) {
		    return function (scope, element, attrs) {
		    			var target = attrs["autoHeight"] || 'entity-list-container';
		    			var reduce = +attrs["height"] || 48;
		    			function setHeight() {
		    				var height = $('.'+target).height();
		    				if(height < 500) height = 500;
		    				element.css('height', height - reduce);
		    				// console.log(height);
		    			}
		    			setHeight();
		    		// })
							$timeout(function() {
							  setHeight();
							});
							var w = angular.element($window);
							w.bind('resize', function () {
			            setHeight();
			        });
			        scope.$watch('ach.showDocumentViewer', function(newVal, oldVal) {
			        	if(newVal !== oldVal) {
			        		$timeout(function() {
			        			setHeight();
			        		})
			        	}
			        })
						// });
		        // element.height($(window).height() - $('.header').outerHeight());
		    }
		});