/*************************************************************************
 *  
 * 								AUTHOR
 * 						Pelle Lagermann Jensen
 * 
 * USAGE
 * [1] 
 * [2] 
 * [3] 
 * --- optionals
 * [4]  
 * [5]  
*************************************************************************/

(function (window, document, undefined) {
	"use strict";

	var _reveal = window.reveal;

	// Default settings
	var defaults = {
		//OPTIONS
		selector: '[data-mosaicjs]',			//Selector for mosaic wrapper		
		minColumns: 1,							//Minimum number of columns
		maxColumns: 4,							//Maximum number of columns
		minColumnWidth: 300,					//Minimum column width before updating number of columns
		evenColumnHeights: true,				//Even the column heights by always adding items to the lowest column
		columnClass: "mosaicjs-column",			//CSS class added to columns
		itemClass: "mosaicjs-item",				//CSS class added to items		 
		animationDelay: 50,						//Delay between animating items in or out
		animate: true,							//Animate items when rebuilding columns
		exitAnimationClass: "zoomOut",			//CSS class used for animating items when destroying columns		
		entranceAnimationClass: "zoomIn",		//CSS class used for animating items when building columns
		autoUpdate: true,						//Update columns automatically on resize. Disable to run manually with .update();
		//CALLBACKS
		ready: function () {},					//Called when MosaicJS has been fully initialized
		layoutChange: function () {}			//Called when the number of columns has changed
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
	
	var getWrappers = function (selector) {
		var _wrappers = document.querySelectorAll( selector ),
			wrappers = [];
				
		forEach( _wrappers, function (wrapper) {
			var items = wrapper.children;
			for (var i = 0; i < items.length; i++) {
				items[i].classList.add(settings.itemClass);
				if (settings.animate) {					
					items[i].style.visibility = "hidden";
				}
			}
			wrappers.push({
				elem: wrapper,
				items: wrapper.querySelectorAll("." + settings.itemClass)
			});			
		});

		return wrappers;		
	};

	var createColumns = function (wrapperItem) {
		var width = wrapperItem.offsetWidth,
			numberOfColumns = Math.floor(width / settings.minColumnWidth);
			if (numberOfColumns < settings.minColumns) numberOfColumns = settings.minColumns;
			else if (numberOfColumns > settings.maxColumns && settings.maxColumns !== 0) numberOfColumns = settings.maxColumns;

		for (var i = 0; i < numberOfColumns; i++) {
			var column = document.createElement("div");
			column.classList.add(settings.columnClass);
			column.style.width = 100 / numberOfColumns + "%";
			wrapperItem.appendChild(column);
		}			
	};

	var arrangeItems = function (wrapper) {		
		var columns = wrapper.elem.querySelectorAll("." + settings.columnClass),
		columnIndex = -1;
		
		for (var i = 0; i < wrapper.items.length; i++) {
			if (settings.animate) {
				wrapper.items[i].style.visibility = "hidden";
				wrapper.items[i].classList.remove(settings.exitAnimationClass);
			}			

			if (settings.evenColumnHeights) {
				columnIndex = 0;
				for (var c = 1; c < columns.length; c++) {					
					if (columns[c].offsetHeight < columns[columnIndex].offsetHeight) {
						columnIndex = c;
					}
				}
			} else {
				columnIndex++;
				if (columnIndex >= columns.length) {
					columnIndex = 0;
				}					
			}

			columns[columnIndex].appendChild(wrapper.items[i]);				
		}

		if (settings.animate) {
			forEach(wrapper.items, function (item, index) {		
				setTimeout(function() {					
					item.classList.add(settings.entranceAnimationClass);
					item.style.visibility = "visible";	
				}, settings.animationDelay * index);				
			});
		}

		settings.layoutChange();						
	};

	var resetInProgress = false;
	var resetColumns = function (wrapper) {		
		for (var i = 0; i < wrapper.items.length; i++) {	
			wrapper.elem.appendChild(wrapper.items[i]);					
		}

		var columns = wrapper.elem.querySelectorAll("." + settings.columnClass);
		for (var c = 0; c < columns.length; c++) {	
			wrapper.elem.removeChild(columns[c]);					
		}
	
		//Create columns
		createColumns(wrapper.elem);
		//Arrange items
		arrangeItems(wrapper);
	};

	var fadeOutItems = function (wrapper) {		
		resetInProgress = true;			
		
		forEach(wrapper.items, function (item, index) {			
			setTimeout(function() {			
				item.classList.add(settings.exitAnimationClass);
				
				if (index === wrapper.items.length-1) {
					resetInProgress = false;				
					resetColumns(wrapper);
				}
			}, settings.animationDelay * index);			
		});
	};
		
    window.mosaicjs = function (input1, input2) {
		var _m = {},			
			eventTimeout,
			windowDimensions,
			options = {},
			eventThrottler = function (event) {
			if ( !eventTimeout ) {
				eventTimeout = setTimeout(function() {
					eventTimeout = null;
					_m.update();				
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

		_m.update = function () {
			forEach(this.wrappers, function (wrapper) {
				var width = wrapper.elem.offsetWidth,
					numberOfColumns = Math.floor(width / settings.minColumnWidth),
					currentColumns = wrapper.elem.querySelectorAll("." + settings.columnClass);	
				if (numberOfColumns < settings.minColumns) numberOfColumns = settings.minColumns;
				else if (numberOfColumns > settings.maxColumns && settings.maxColumns !== 0) numberOfColumns = settings.maxColumns;

				if (currentColumns.length === 0) {					
					createColumns(wrapper.elem);					
					arrangeItems(wrapper);
				} else {
					if (numberOfColumns !== currentColumns.length) {
						if (!resetInProgress) {							
							if (settings.animate) {
								fadeOutItems(wrapper);
							} else {
								resetColumns(wrapper);
							}				
						}								
					}
				}											
			});			
		};		

    	// Merge default and user options
		settings = extend( defaults, options );

    	_m.wrappers = getWrappers(settings.selector);
    	if (_m.wrappers.length === 0 ) {
			console.info("MosaicJS: No elements matched the selector '" + settings.selector + "'.");
			return;	
		}
   		   		
   		_m.update();		
   				
		// Listen for events
		if (settings.autoUpdate) {
			window.addEventListener('resize', eventThrottler, false);
		}				

		settings.ready();

		return _m;
	};	

	mosaicjs.noConflict = function() {
		window.mosaicjs = mosaicjs;
        return this;
	};	

})(this, document);