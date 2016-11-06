/*************************************************************************
 * 				!!!!!!!! Requires animate.css !!!!!!!!
 * 				https://daneden.github.io/animate.css/
 * 
 * 								AUTHOR
 * 						Pelle Lagermann Jensen
 * 
 * USAGE
 * [1] Add script to page
 * [2] Run script: reveal({... options ...}})
 * [3] Add a data-reveal attribute to all elements that needs to be animated
 * --- optionals
 * [4] Specify per element animations by assigning animate.css classes to the data-reveal attribute 
 * [5] Set per element animation delay (ms) with data-reveal-delay="200" 
*************************************************************************/

(function (window, document, undefined) {
	"use strict";

	var _reveal = window.reveal;

	// Default settings
	var defaults = {
		selector: '[data-reveal]',				//Selector for elems		
		buffer: 0,								//Number of pixels above the bottom of the screen before animating
		delay: 0,								//Delay before animating
		animation: "slideInUp",					//Default animation 				
		callback: function () {}				//Callback with revealed element
	},
	settings;

	var forEach = function ( collection, callback, scope ) {
		if ( Object.prototype.toString.call( collection ) === '[object Object]' ) {
			for ( var prop in collection ) {
				if ( Object.prototype.hasOwnProperty.call( collection, prop ) ) {
					callback.call( scope, collection[prop], prop, collection );
				}
			}
		} else {
			for ( var i = 0, len = collection.length; i < len; i++ ) {
				callback.call( scope, collection[i], i, collection );
			}
		}
	};

	var extend = function () {
		// Variables
		var extended = {};
		var deep = false;
		var i = 0;
		var length = arguments.length;

		// Check if a deep merge
		if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
			deep = arguments[0];
			i++;
		}

		// Merge the object into the extended object
		var merge = function (obj) {
			for ( var prop in obj ) {
				if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
					// If deep merge and property is an object, merge properties
					if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
						extended[prop] = extend( true, extended[prop], obj[prop] );
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};

		// Loop through each object and conduct a merge
		for ( ; i < length; i++ ) {
			var obj = arguments[i];
			merge(obj);
		}

		return extended;
	};

	var getDocumentHeight = function () {
		return Math.max(
			document.body.scrollHeight, document.documentElement.scrollHeight,
			document.body.offsetHeight, document.documentElement.offsetHeight,
			document.body.clientHeight, document.documentElement.clientHeight
		);
	};

	var getWindowScrollPos = function () {
		// Calculate the page scroll. 
		// All browsers except IE<9 support `pageXOffset/pageYOffset`, and in IE when DOCTYPE is set, the scroll can be taken from documentElement(<html>), 
		// otherwise from `body` - so we take what we can.
		var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
	    	scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;

		return {
			top: scrollTop ? scrollTop : 0,
			left: scrollLeft ? scrollLeft : 0
		};		
	};

	function getOffsetRect(elem) {
		// http://javascript.info/tutorial/coordinates
	    // (1) - Get the enclosing rectangle
	    var box = elem.getBoundingClientRect(),	    
	    	body = document.body,
	    	docElem = document.documentElement;
	    
	    var windowScrollPos = getWindowScrollPos();
	    	    
	    // (3) - The document (`html` or `body`) can be shifted from left-upper corner in IE. Get the shift.
	    var clientTop = docElem.clientTop || body.clientTop || 0,
	    	clientLeft = docElem.clientLeft || body.clientLeft || 0;
	    
	    // (4) - Add scrolls to window-relative coordinates and substract the shift of `html/body` to get coordinates in the whole document.
	    var top  = box.top +  windowScrollPos.top - clientTop,
	    	left = box.left + windowScrollPos.left - clientLeft;
	    
	    return { top: Math.round(top), left: Math.round(left) };
	}

	var getElems = function (selector) {
		var _elems = document.querySelectorAll( selector ),
			elems = [];
				
		forEach( _elems, function (elem) {
			elem.classList.add("animated");
			elem.style.visibility = 'hidden';				
			elems.push({
				elem: elem,					
				offset: {
					top: 0,
					left: 0
				},
				revealAnim: elem.getAttribute("reveal") || elem.getAttribute("data-reveal") || settings.animation,
				revealDelay: elem.getAttribute("reveal-delay") || elem.getAttribute("data-reveal-delay") || settings.delay
			});			
		});

		return elems;		
	};

	var sortElems = function (elems) {
		elems.sort( function (a, b) {
			if (a.offset.top > b.offset.top) {
				return 1;
			}
			if (a.offset.top < b.offset.top) {
				return -1;
			}
			return 0;
		});

		return elems;
	};	
	
    window.peekaboo = function (input1, input2) {
		var r = {},			
			eventTimeout,
			windowDimensions,
			options = {},
			eventThrottler = function (event) {
			if ( !eventTimeout ) {
				eventTimeout = setTimeout(function() {
					eventTimeout = null;					
					
					if ( event.type === 'resize' ) {
						r.setDistances();					
					}

					r.update();				
				}, 66);
			}
		};

		if (typeof input1 === "object") {
			options = input1;
		} else if (typeof input1 === "string") {
			if (typeof input2 === "object") {
				options = input2;
			}
			options.selector = input1;
		}		

		r.setDistances = function () {						
			var windowScrollPosition = getWindowScrollPos();
			windowDimensions = {
				width: document.documentElement.clientWidth || document.body.clientWidth,
				height: document.documentElement.clientHeight || document.body.clientHeight
			};
			window.scrollTo(0, 0);

			forEach(this.elems, function (elem) {				
				elem.offset = getOffsetRect(elem.elem);
				console.log(elem, elem.offset.top);
			});

			window.scrollTo(windowScrollPosition.left, windowScrollPosition.top);
					
			this.elems = sortElems(this.elems);
		};	

		r.update = function () {
			var windowScrollPos = getWindowScrollPos();					

			forEach(this.elems, function (elem) {				
				if (elem.offset.top <= (windowScrollPos.top + windowDimensions.height - settings.buffer)) {					
					setTimeout(function() {
						elem.elem.style.visibility = '';
						elem.elem.classList.add(elem.revealAnim);	
					}, elem.revealDelay);
										
					elem.elem.dataset.inView = "true";					
					
					settings.callback({
						elem: elem.elem,
						inView: true
					});					
				}				
			});

			
			
		};		

    	// Merge default and user options
		settings = extend( defaults, options );

    	r.elems = getElems(settings.selector);
    	if (r.elems.length === 0 ) {
			console.info("No elements matched the selector '" + settings.selector + "'.");
			return;	
		}
   		
   		r.setDistances();
   		r.update();		
   				
		// Listen for events
		window.addEventListener('resize', eventThrottler, false);
		window.addEventListener('scroll', eventThrottler, false);

		return r;
	};	

	peekaboo.noConflict = function() {
		window.peekaboo = peekaboo;
        return this;
	};	

})(this, document);