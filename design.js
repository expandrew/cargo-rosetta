/**
 * Rosetta
 */

var Site = Site || { };

// Cache
Site.$el = {

	setup : function() {
		this.window = $(window);
		this.index  = $('#index');
	}

};

// Run the setup & events methods on all Site namespaces
$(function() {

	var key, namespace;

	for (key in Site) {
		namespace = Site[key];
		if ( namespace.hasOwnProperty('setup') && typeof namespace.setup === "function" ) {
			namespace.setup();
		}
		if ( namespace.hasOwnProperty('events') && typeof namespace.events === "function" ) {
			namespace.events();
		}
	}

});


var Design = {

	data : {
		stageHeight: 0,
		stageWidth: 0,
		textBodyStartHeight :0,
		allThumbWidth: 0,
		allMediaWidth: 0,
		titleHeight: 0,
		intextImageHeight: 0,
		entryWidth: 0,
		bottomMarginAdjust: 0
	},

	bindKeys : function() {
		Cargo.Core.KeyboardShortcut.Add("Left", 37, function() {
			Action.Project.Prev();
			return false;
		});

		Cargo.Core.KeyboardShortcut.Add("Right", 39, function() {
			Action.Project.Next();
			return false;
		});
	},

	hoverProject: function() {

		// add hover class for project thumbs, if no titles or tags—add a separate class for separate styling

		if (!Cargo.Model.DisplayOptions.get('title_in_thumb') && !Cargo.Model.DisplayOptions.get('tags_in_thumb')) {

			hoverClass = 'hovering-no-info';

			$('.thumb_info').remove();

		} else {

			hoverClass = 'hovering';

		}

		// Thumbnail hover
		if (!Cargo.Helper.isMobile()) {

			$(".thumbnails")
				.on("mouseenter", ".project_thumb", function(e) {
					$(this).addClass(hoverClass);
				})
				.on("mouseleave", ".project_thumb", function(e) {
					$(this).removeClass(hoverClass);
				});

		}

	},

	setFormatting: function() {

		// group sets in navigation

		var navGroups = [];

		$(".navigation div[data-type]").each(function() {

			var type = this.getAttribute("data-type");

			if ($.inArray(type, navGroups) == -1) {

				// first unwrap if already wrapped
				if ($(this).parent().hasClass("group")) {
					$(this).unwrap();
				}

				if (type == "link" || type == "page") {
					var items = $(".navigation div[data-type='link'], .navigation div[data-type='page']");
					navGroups.push("link", "page");
				} else {
					var items = $(".navigation div[data-type='" + type + "']");
					navGroups.push(type);
				}

				items.wrapAll("<div class='group' />");

			}

		});

	},

	captionFormatting: function() {

		// formatting for captions on media images, and slideshows

		// if slideshow nav is on top—(not slideshow images') captions go on bototm, else they are on top
		if ( Cargo.Model.DisplayOptions.get("slide_nav_position") == "top" ){
			captionClass = 'on_bottom';
		} else {
			captionClass = 'on_top';
		}


		// slideshow captions
        $('.slideshow_caption').each(function(i){

	        $(this).addClass(captionClass);

        });

		// take caption from the img caption attribute, and put content in an absolute position div
		if (Cargo.Model.DisplayOptions.get('captions_view') == true) {

		   	$('.project_media .img_holder img').each(function(i){

			   	var caption = $(this).attr('caption');

		        if ( typeof caption !== typeof undefined && caption !== false ) {

		            $(this).after('<div class="caption on_bottom">' + caption + '</div>');

	            }

	        });

		}

	},

	columnizeText: function() {

		// columnize text on projects

		var stage			= $('.entry'),
			titleHeight		= $('.project_title').height() + parseInt($('.project_title').css('padding-bottom')),
			footerHeight	= $('.project_footer').outerHeight(true),
			hasText			= $('.project_content > .textcolumns').length > 0,
			minWidth		= parseInt($('.project_content').css('min-width')),
			projectPadding	= parseInt($('.project').css('padding-bottom')) + parseInt($('.project').css('padding-top')),
			adjustedHeight	= Design.data.stageHeight + -Design.data.titleHeight + -projectPadding + -Design.data.bottomMarginAdjust,
			calcColumns		= Design.data.textBodyStartHeight / adjustedHeight,
			columnsNeeded	= Math.ceil(calcColumns);

		// add a marker to see if there is overflow
		if ($('.column-marker').length < 1) {
			$('.textcolumns').append('<div class="column-marker" />');
		}

		// Set height of columns subtracting height of title from stage
		$('.project_content .textcolumns').height(adjustedHeight);

		// if there is no text, set a hard width on project_content instead of min-width
		if (hasText == false) {
			$('.project_content').width(minWidth);
		}

		//if text is taller than window stage, columnize
		if (Design.data.textBodyStartHeight > adjustedHeight) {

			$('.project_content .textcolumns').addClass('columnized');
			$('.project_content .textcolumns').attr('columns', columnsNeeded);

			columnWidth = parseInt($('.columnized').css('column-width')),
			columnGutter = parseInt($('.columnized').css('column-gap')),
			columnTotalWidth = columnGutter + columnWidth,
			oneMoreColumn = 0;

			// if we have a column parker past the width of columns, add another column
			if ($('.column-marker').position().left > (columnTotalWidth * columnsNeeded) - columnGutter) {
				oneMoreColumn = 1;
			}

			// set the column container width, and column count
			$('.columnized').css({
				'width' : (columnTotalWidth * (columnsNeeded + oneMoreColumn)) - columnGutter,
				'-webkit-column-count' : columnsNeeded + oneMoreColumn,
				   '-moz-column-count' : columnsNeeded + oneMoreColumn,
				         'column-count': columnsNeeded + oneMoreColumn
			});

		} else {

			// get rid of any column attributes that were added
			$('.project_content').removeAttr('columns');
			$('.project_content .textcolumns').removeAttr('style');
			$('.project_content .textcolumns').removeClass('columnized');

		}

		Cargo.Event.trigger("column_complete", "Cargo");

	},

	noBreaksOnTop: function() {

		// visually remove breaks at the top of columns, add them to the end of the content

		var brAtTop = $('.break_span'),
			spanHeight = parseInt($('.project_content').css('line-height'));
			footer = $('.project_footer');

		// determine where to add breaks that have been visually removed
		if (footer.length > 0  && footer.is(':visible')){
			endPlace = '.project_footer';
		} else {
			endPlace = 'p';
		}

		// clear top and last breaks before they are set
		brAtTop.removeClass('top-br');
		$('.last_span').remove();


		$(brAtTop).each( function(el){

			// set a height to each span
			$(this).css('height', spanHeight);

			// if a break is at the top of the container, remove its height, add that height to the end place
			if (($(this).position().top - $('.project_title').outerHeight(true)) <= 1) {

				$(this).addClass('top-br').css('height', '0');
				$('.project_content ' + endPlace).append('<span class="last_span" style=" height: ' + spanHeight + 'px' + '"></span>');

			}

		});

	},

	setProjectMediaSize: function() {

		// set a hard width on project media based on the combined width of its children

		slideshowGutter	= ($('.slideshow').length > 0) ? $('.slideshow').length * parseInt($('.slideshow').css('margin-right')): 0;
		projContPad	= parseInt($('.project_media').css('padding-right')),
		mediaCount	= parseInt($('.project_media > *').length);

		if ($('.project_media > *:not(.slideshow)').length > 0) {
			Design.data.allMediaWidth = 0;
			$('.project_media > *').each(function() {
				Design.data.allMediaWidth += $(this).outerWidth(true);
			});
		}

		$('.project_media').width(Design.data.allMediaWidth + projContPad + slideshowGutter);

	},

	setStageProperties: function() {

		// set the height and width of the stage

		var stagePadding = parseInt($('.thumbnails').css('padding-top')) + parseInt($('.thumbnails').css('padding-bottom'));

	    Design.data.stageHeight = $('#index > div:visible').last().height();

	    Design.data.stageWidth = $(window).width();

	},

	titleHeight: function() {

		// find the height of the project title

		if (Cargo.Model.DisplayOptions.get('title_in_project') && Cargo.Model.Project.GetShowTitle()) {

			Design.data.titleHeight = $('.project_title').height() + parseInt($('.project_title').css('padding-bottom'));

		} else {

			Design.data.titleHeight = 0;

		}

	},

	intextImageHeight: function() {

		// FOR FUTURE USE (if browsers advance CSS3 columns)
		// find the height of images inside of columns

		if ($('.textcolumns p').has('span img')) {

				Design.data.intextImageHeight = 0;

				$('.textcolumns p span img').each(function(){

					Design.data.intextImageHeight += $(this).outerHeight(true);

				});

		} else { Design.data.intextImageHeight = 0; }

	},

	setThumbSize: function() {

		// set the size of thumbnails

		var thumbMargin	= parseInt($('.project_thumb').css('margin-bottom')),
			marginPerc	= (Design.data.stageHeight / thumbMargin) / 100,
			thumbSize	= parseInt(Cargo.Model.DisplayOptions.get('thumb_size').h) + thumbMargin,
			rowCount	= (Design.data.stageHeight + thumbMargin) / thumbSize,
			rowsNeeded	= Math.ceil(rowCount),
			rowHeightpx	= Design.data.stageHeight / rowsNeeded,
			rowHeight	= Math.floor(rowHeightpx),
			leftover	= Design.data.stageHeight - (rowHeight * rowsNeeded);

		if (rowsNeeded > rowCount) {

			// Set percentage height for each row depending on user's thumb height
			$('.project_thumb').css('height', rowHeight - thumbMargin + 'px');

			// Set width of each thumb based on amount of rows
			$('.project_thumb').each(function() {
				$(this).width(parseInt($(this).find('.thumb_image img').css('width')));
			});

			// pixels leftover if rows are an odd number
			Design.data.bottomMarginAdjust = leftover;

		}

		Cargo.Event.trigger("thumbsize_complete", "Cargo");

	},

	setThumbSizeAfterFirstLoad: function() {

		// Run setThumbSize and horizontalIsotope functions for the first time

		// tell Cargo that pagination is occuring so it will not fire twice
		if (typeof Cargo.View.Autopaginate == 'object') {
			Cargo.View.Autopaginate.Data.is_updating = true;
		}

		var elems = $(".project_thumb[data-rowed!='true']");

		// hide thumbs before until they have loaded
		elems.css('visibility', 'hidden');

		// once images have loaded
		elems.imagesLoaded( function() {

			elems.css('visibility', 'hidden');
			Design.setThumbSize();
			Design.horizontalIsotope();

		});

	},

	thumbInfoClick: function() {

		// make sure clicking thumb_info works in the inspector, and when in the active project thumb

		var clickEvent = 'click';

		// if inspector is open, clickEvent occurs on double click
		if (location.href.match(/[\?|\&]inspecting/) !== null || parent.editor !== undefined) {

			clickEvent = 'dblclick';

		}

		// Make thumb_info clickable
		$(".project_thumb .thumb_info").on(clickEvent, function(){

		    if ($(this).find("a").length){

			    Cargo.Event.trigger("add_history", $(this).find("a:first").attr("href"));

		    }

		});

		// if is the active project thumb, go back to start of project
		$(".project_thumb.active .thumb_info").on(clickEvent, function(){

		    setTimeout(function() {
				Cargo.Helper.ScrollToLeft( $('#slide_container') );
			}, 10)

		});

	},

	horizontalIsotope: function() {

		imagesLoaded( '#thumbnails', function() {

			$('#thumbnails').isotope({

				layoutMode: 'masonryHorizontal',
				itemSelector: '.project_thumb',
				sortBy: 'number',
				transitionDuration: 0,
				masonryHorizontal: {},

			});

			// for testing purposes, add class first-isotope, so we only run it once depending on whether or not 'doc ready' or 'show index' fires first
			$('#thumbnails').addClass('first-isotope');

			setTimeout( function() {

				// if we are on the first page, force check for pagination
				if (Cargo.API.Config.current_page == 1) {

					if (typeof Cargo.View.Autopaginate == 'object') {
						Cargo.View.Autopaginate.CheckForPagination();
					}

				}

			}, 50);

		});

		// once isotope has run, add the 'data-rowed' attribute
		$("#thumbnails .project_thumb").attr('data-rowed', 'true');

		Design.firstImageIsLoaded();

	},

	firstImageIsLoaded: function() {

		// if the first image has been loaded, show the project thumbnials, and tell pagination it is not firing

		var imgLoad = imagesLoaded('#thumbnails');

		imgLoad.on( 'always', function() {

			var is_loaded = false;

			// find out if one image has been loaded (if one image is loaded we can assume we have the height / width info for the rest of the images)
			for ( var i = 0, len = imgLoad.images.length; i < len; i++ ) {

				image = imgLoad.images[i];

				if (typeof image == "object" && image.isLoaded) {

					is_loaded = true;

				}

			}

			// if one image is loaded:
			if (is_loaded == true) {

				// fade in the new projects
				$(".project_thumb[data-rowed='true']").css({opacity: 0, visibility: 'visible'}).animate({opacity: 1}, 400);

				// move the autopagination loader to the middle of the screen, and right of the projects already loaded
				$('#autopaginate_loader').css('display', 'none').addClass('after-load');

				// tell Cargo pagination it is no longer firing
				if (typeof Cargo.View.Autopaginate == 'object') {
					Cargo.View.Autopaginate.Data.is_updating = false;
				}

			}

		});

	},

	isotopeOnPagination: function() {

		// append new thumbnails to isotope
		if (typeof Cargo.View.Autopaginate == 'object') {
			Cargo.View.Autopaginate.Data.is_updating = true;
		}

		// hide thumbnails that have not been data-rowed
		var elems = $(".project_thumb[data-rowed!='true']");
		elems.css('visibility', 'hidden');

		var imgLoad = imagesLoaded(elems);

		imgLoad.on( 'always', function() {

			var is_loaded = false;

			// find out if one image has been loaded (if one image is loaded we can assume we have the height / width info for the rest of the images)
			for ( var i = 0, len = imgLoad.images.length; i < len; i++ ) {

				image = imgLoad.images[i];

				if (typeof image == "object" && image.isLoaded) {

					is_loaded = true;

				}

			}

			// if one image has been loaded:
			if (is_loaded == true) {

				// set new thumbnails size
				Design.setThumbSize();

				// append the new thumbnails
				$('#thumbnails').isotope( 'appended', elems);

				// Add 'data-rowed' attribute and display loaded thumbs
				elems.attr('data-rowed', 'true');
				elems.css({opacity: 0, visibility: 'visible'}).animate({opacity: 1}, 400);

				// if we've already paginated and thumbnails is not wide enough to trigger pagination again
				if ($('#thumbnails').width() < $(window).width() + 300) {

					setTimeout(function() {

						if (typeof Cargo.View.Autopaginate == 'object') {
							Cargo.View.Autopaginate.CheckForPagination();
						}

					}, 100)

				}

				// tell Cargo pagination it is no longer firing
				if (typeof Cargo.View.Autopaginate == 'object') {
					Cargo.View.Autopaginate.Data.is_updating = false;
				}

			}

		});

	},

	dataRows: function() {

		// Add attribute of data-rowed, once thumbnails have been isotoped

		thumbs = $(".project_thumb[data-rowed!='true']");

		thumbs.attr('data-rowed', 'true');

	},

	adjustStage: function() {

		// Adjust the stage height of projects after thumbnail rows have been calculated so project_media aligns with thumbnails

		var currentPad = parseInt($('.project').css('padding-bottom'));

		Cargo.Plugins.elementResizer.setOptions({

			forceVerticalMargin: $(window).height() - Design.data.stageHeight + Design.data.bottomMarginAdjust + currentPad

		});

		$('.project').addClass('adjust_stage');

		Cargo.Plugins.elementResizer.refresh();

		$('.project_media').css('visibility', 'visible');

		Design.setResizerOptions();

	},

	setResizerOptions: function() {

		// set vertical & horizontal margins on element resizer

		if (Cargo.Helper.isPhone()) {

			var container = screen.width;
			var extra = 40;
			var parent = $('.entry').width();

			if (Cargo.Model.DisplayOptions.get('captions_view') == true) {

				var containerBottom = parseInt($('.container').css('bottom'));

			} else {

				var containerBottom = 0;

			}

		} else {

			var container = 0;
			var parent = 0;
			var extra = 0;
			containerBottom = 0;

		}

		Cargo.Plugins.elementResizer.setOptions({
			forceVerticalMargin: $(window).height() - $('.entry').height() + containerBottom,
			forceHorizontalMargin: parent - container + extra
		});

	},

	imageScroll: function() {

		// scroll project_media image based on location in the window

		var media 					= $('.project_media .img_holder img'),
			moreThanOne				= $(media).length > 1,
			scrollContainer			= $('#slide_container'),
			projectContent			= $('.project_content').width() + $('.project_content').css('margin-right'),
			projectLeftMargin		= parseInt($('.project').css('margin-left')),
			entryWidth				= $('.entry').width(),
			stageWidthHalf			= Design.data.stageWidth / 2,
			thumbnailLocation		= $('#thumbnails').position().left,
			thumbnailPadding		= parseInt($('#thumbnails').css('margin-left')),
			noThumbsProj			= Cargo.Model.DisplayOptions.get('thumbs_below_projects') && Cargo.Helper.GetCurrentPageType() == "project",
			noThumbsPage			= Cargo.Model.DisplayOptions.get('thumbs_below_pages') && Cargo.Helper.GetCurrentPageType() == "page",
			imgPadding				= parseInt($('.project_media img').css('margin-right'));


		if (moreThanOne) {
			// if more than 1 image, identify first image

			$(media).first().addClass('first');

		} else if (!moreThanOne && (!noThumbsProj && !noThumbsPage)) {
			// else, if only one image and no thumbs to the right, identify as loner

			$(media).first().addClass('loner');

		}

		// identify last image
		$(media).last().addClass('last');


		// for each image
		media.each(function() {

			var	lonerImg 		= $(this).hasClass('loner'),
				distanceRightH	= this.getBoundingClientRect().right;

			// hover conditions
			$(this).on('mouseenter', function(e) {

				e.preventDefault();

				// if the image is a loner and is completely in view, don't use pointer
				if (lonerImg && (distanceRightH < $(window).width())) {
					$(this).css('cursor', 'default');
				} else {
					$(this).css('cursor', 'pointer');
				}

			}).on('mouseleave', function(e) {

				$(this).css('cursor', 'default');

			});


			// click conditions
			$(this).on('click', function(e) {

				e.preventDefault();

				// image properties
				var	imgWidth		= $(this).width(),
					imgLeft			= $(this).closest('.img_holder').position().left + projectLeftMargin,
					inView			= $(this).is(':in-viewport'),
					lastImg			= $(this).hasClass('last'),
					firstImg		= $(this).hasClass('first'),
					imgRight		= imgLeft + imgWidth,
					distanceLeft	= this.getBoundingClientRect().left,
					distanceRight	= this.getBoundingClientRect().right,
					distFromRight	= Design.data.stageWidth - distanceRight,
					transitionFlag	= false;

				// image position conditions
					windowLeft		= $(scrollContainer).scrollLeft(),
					windowRight		= windowLeft + Design.data.stageWidth,
					isOffRight		= inView && (Design.data.stageWidth < distanceRight),
					isOffLeft		= inView && (0 > distanceLeft),
					isOff			= isOffLeft || isOffRight,
					inFullView		= inView && !isOffRight && !isOffLeft,
					isCenter		= inView && (distanceLeft < stageWidthHalf) && (distanceRight > stageWidthHalf);

				// next image properties
				if (!lastImg) {

					nextImg			= $(this).closest('.img_holder').next(),
					prevImg			= $(this).closest('.img_holder').prev(),
					nextImgPos		= $(nextImg).position().left + projectLeftMargin,
					nextImgPosMid	= ((Design.data.stageWidth - $(nextImg).width() + imgPadding) / 2);

				}

				// go to this image
				if ((transitionFlag == false) &&
					(	(!inFullView && !isCenter && !firstImg && !lastImg && (!nextImg.is(':in-viewport')) && (!prevImg.is(':in-viewport')))
					||	(isOffRight && !lastImg && !firstImg && !isCenter)
					||	(isOffLeft && !lastImg && !firstImg && !isCenter)
					||	((firstImg && isOffRight && !isOffLeft) || (firstImg && isOffLeft && !isOffRight))
					||	(!inFullView && !firstImg && ((nextImg.is(':in-viewport')) || (prevImg.is(':in-viewport'))))
					||	(firstImg && (distanceRight < stageWidthHalf) && inFullView)
					||	(lastImg && isOff)
					||	(inFullView && (distanceRight < stageWidthHalf) && !lastImg && !isCenter && !firstImg)
					||	(inFullView && (distanceLeft > stageWidthHalf) && !lastImg && !isCenter)
					||	(inFullView && !isOff && !lastImg && !firstImg && isCenter && (nextImg == lastImg))
						)) {

								transitionFlag = true;
								$(scrollContainer).animate({
									scrollLeft: imgLeft - ((Design.data.stageWidth - imgWidth) / 2)
								}, 300, 'easeInOutCubic', function() {
									transitionFlag = false;
								});


				// go to the next image
				} else if ((transitionFlag == false) &&
					(	(inFullView && firstImg && !lastImg)
					||	(inFullView && !isOff && !lastImg && !firstImg && isCenter && (nextImg !== lastImg))
					||	(inFullView && firstImg && !lastImg && !isCenter && (distanceRight < stageWidthHalf))
					||	(isOff && !lastImg && !firstImg && isCenter && (!nextImg.is(':in-viewport')) && (!prevImg.is(':in-viewport')))
					||	(!isOff && !lastImg /* && !firstImg */ && isCenter && (nextImg.is(':in-viewport')) && (prevImg.is(':in-viewport')))
					||	(firstImg && isOffRight && isOffLeft)
						)) {

								transitionFlag = true;
								$(scrollContainer).animate({
									scrollLeft: nextImgPos - nextImgPosMid
								}, 300, 'easeInOutCubic', function() {
									transitionFlag = false;
								});

				// if is the last image
				} else if ((transitionFlag == false) &&
						(inFullView && lastImg && isCenter && !lonerImg)
					||	(!isOff && lastImg && isCenter && lonerImg && (windowLeft > 0))
					||	(inFullView && lastImg && !lonerImg && !isCenter && (distanceLeft > stageWidthHalf) && (!noThumbsPage || !noThumbsProj))
						) {

								// if thumbnails are visible next to project / pages, animate to them
								if (!noThumbsPage || !noThumbsProj) {

									transitionFlag = true;
									$(scrollContainer).animate({
										scrollLeft: (thumbnailLocation + thumbnailPadding) - stageWidthHalf
									}, 400, 'easeOutExpo', function() {
										transitionFlag = false;
									});

								// or animate to beginning of the project / page
								} else {

									transitionFlag = true;
									$(scrollContainer).animate({
										scrollLeft: 0
									}, 250, 'easeInOutCubic', function() {
										transitionFlag = false;
									});
								}

				// if is a loner (completely in viewport and there is no content to the right)
				} else if ((transitionFlag == false) &&
						(lonerImg && inFullView && (windowLeft <= 0) && (!noThumbsPage || !noThumbsProj))
						) {

							// do nothing

				}

			});

		});

	},

	Mobile : {
		init: function() {

			if ( Cargo.Helper.isPhone() ){

				$('body').addClass('phone');

				$('head').append('<meta name="viewport" content="width=device-width">');

				// add max-width to slide
				$('#slide_container').css("max-width", screen.width + "px");

				$('.header_text a, .navigation_toggle').bind( "touchstart", function(){
					return true;
				});

				$('.navigation_toggle').bind("click", function(){

					Design.Mobile.toggleNav();

				});

				$('.navigation').bind( "touchstart", function(e){

					var touchtarget = $(e.target);

					if ( !touchtarget.is('a') ) {

						Design.Mobile.toggleNav();

					}

				});

				Cargo.Event.on("project_load_complete", function(pid) {

					Design.Mobile.toggleNav(true);

				});

			} else if ( Cargo.Helper.isTablet() ) {

				ratio = window.devicePixelRatio;

				$('body').addClass('tablet');
				$('.container').css("max-width", (screen.width * ratio) + "px");

			} else {

				$('body').addClass('desktop');

			}

			// Add attribute once this is done
			$('body').attr('data-mobileload', 'true');
		},

		toggleNav: function(closeNav){

			if ( $('.navigation_toggle').is(".active") || closeNav ){

				$(".navigation, .navigation_toggle").removeClass("active");

			} else {

				$(".navigation, .navigation_toggle").addClass("active");

			}

		}
	}
};


/*********************************************
 *
 * Helpers
 *
 *********************************************/

 Site.Helper = {

	formatText : function(node, includeWhitespaceNodes) {

		var validTags			= ['img', 'object', 'video', 'audio', 'iframe', 'div'],
			keepClass 			= ['in-text'],
			nodeContents		= node.contents(),
			newPageFromCache	= true,
			textPages			= {},
			pageCache			= [],
			pageCount			= 0;

		// inline helper functions
		var _isValidText = function(txt, strict) {

			if (txt !== undefined) {
				txt = txt.replace(/<!--([\s\S]*?)-->/mig, "");
				txt = txt.replace(/(\r\n|\n|\r|\t| )/gm, "");
				txt = txt.replace(/[^A-Za-z0-9\s!?\.,-\/#!$%\^&\*;:{}=\-_`~()[[\]]/g, "");

				if (txt.length > 0) {
					return true;
				}
			} else {
				if (strict) {
					return false;
				} else {
					return true;
				}
			}

			return false;

		}

		var _getTag = function(el) {

			if (typeof el !== "undefined") {
				var tag = el.tagName;

				if (typeof tag === "undefined") {
					tag = 'text';
				}

				return tag.toLowerCase();
			}

		}

		nodeContents.each(function(key, val) {

			if ($.inArray(_getTag(val), validTags) >= 0) {
				// Don't do anything here
				if($.inArray($(val).attr('class'), keepClass) >= 0) {
					pageCache.push(val);
				}

			} else {
				if (_isValidText(val.data) && val.nodeType != 8) {
					pageCache.push(val);
				}
			}

		});

		// Still some stuff left in cache
		if (pageCache.length > 0) {

			// Check if it needs a new page
			for (var i = 0; i < pageCache.length; i++) {
				if (pageCache[i].nodeType == 8 || pageCache[i].nodeName == "SCRIPT" || pageCache[i].nodeName == "STYLE") {
					// Contains text, create new page
					newPageFromCache = false;
				}
			}

			if (newPageFromCache) {
				// Create new page
				textPages[pageCount] = pageCache;
				pageCache = [];
				pageCount++;
			} else {
				for (var i = 0; i < pageCache.length; i++) {
					// Dump and hide remaining elements
					$(pageCache[i]).hide().appendTo($('.project_footer'));
				}
			}

		}

		$.each(textPages, function(key, arr) {

			var breaks = 0;
			$.each(arr, function(key, el) {
				if (el.nodeName == "BR") {
					 breaks++;
				}

			});

			if (breaks < arr.length) {
				var first = arr[0],
					parent = $('<p />');

				$(first).before(parent);

				$.each(arr, function(key, el) {
					$(el).appendTo(parent);
				});



			} else {

				$.each(arr, function(key, el) {
					$(el).remove();
				});
			}

		});

		$('.project_content p').each(function(key) {

			// Strip leading <br>
			var found_text = false;
			$(this)
				.contents()
				.filter(function() {
					if(this.nodeName != "br") {
						found_text = true;
					}
					return (!found_text);
				})
				.remove();

		});

	}

 };

 Site.Project = {

	 Data : {

		'file_name'			: 'thumb_size.json',
		'size_var'			: 'thumb_size_list',
		'thumb_size_list'	: false,
		'open'				: false

	},

	loadComplete : function() {

		setTimeout(function(){
			Site.Project.Data.open = true;
		}, 100);

		// Cache
		var self			= Site.Project,
			data			= { },
			ignoreList		= '.project_title, .project_footer, span img, .in-text, .in-text *',
			mediaElements	= 'img, video, iframe, object, audio, embed, div';

		// Cache
		Site.$el.entry          = $('.entry');
		Site.$el.projectContent = $('.project_content');
		Site.$el.projectMedia   = $('.project_media');

		// Only split on projects
		if ( Cargo.Helper.GetCurrentPageType() =="project" || Cargo.Helper.GetCurrentPageType() =="page" ){
			// Split the content into blocks
			Site.Helper.formatText(Site.$el.projectContent);

			// Move elements into containers
			Site.$el.projectContent
				.children(mediaElements)
				.not(ignoreList)
				.appendTo(Site.$el.projectMedia);
		};

		Site.$el.projectMedia.append('<img src="http://cargocollective.com/_gfx/spacer.gif" class="spacer" width="1" height="2000" style="pointer-events:none; margin: 0; padding: 0; position: absolute; z-index: -99">');

		if ($('.project_content p').length > 0) {
			// Make double <br> into single
			$(".project_content p").html($(".project_content p").html().replace(/(<br\s*\/?>){2,2}/gi,'<br>'));
			// Strip the first <br> if it is first
			$(".project_content p").html($(".project_content p").html().replace(/^(<br\s*\/?>)/,''));
			// Wrap everything
			$('.project_content p').wrap('<div class="textcolumns"></div>');
		}

		// Wrap all breaks in spans to measure their position
		$('.project_content p br').wrap('<span class="break_span" />');

		// If embedded objects have 100%, give them a max width of the user's max image width
		var embeddedMedia = $('.project_media > iframe, .project_media > object, .project_media > video, .project_media > audio, .project_media > embed');

		$(embeddedMedia).each(function() {
			if ($(this).attr('width') == '100%') {
				$(this).attr('width', parseInt(Cargo.Model.DisplayOptions.GetImageWidth()));
			}
		});

		// Prepend the title to the project content container, set width to text column width
		columnWidth = parseInt($('.project_content .textcolumns').css('width'));
		$('.project_title').prependTo('.project_content').css('maxWidth', columnWidth + 'px');

		// If there is no title and no content, remove the content div

		var title_exists = Cargo.Model.DisplayOptions.get('title_in_project') && Cargo.Model.Project.get("show_title") && $('.project_title').css("display") != "none";
		var content_exists = $.trim( $('.project_content').html()).length > 0 && $('.project_content').css("display") != "none";
		var footer_exists = $('.project_footer').css("display") != "none" && $.trim( $('.project_footer > *').not('.editlink').html()).length > 0;

		if ( !title_exists && !content_exists && !footer_exists){
			$('.project_content, .project_footer').hide();
		}

		// Remove project media if no content
		if ((!$.trim( $('.project_media').html() ).length )) {
			$('.project_media').remove();
		}

		// Remove footer if no content
		if ((!$.trim( $('.project_footer').html() ).length )) {
			$('.project_footer').remove();
		}

		//Remove classes before adding them conditionally
		$('body #thumbnails').removeClass('inline-block');

		// If thumbs are set next to projects make them inline block
		if ((Cargo.Model.DisplayOptions.get('thumbs_below_pages') && Cargo.Helper.GetCurrentPageType() == "page") || (Cargo.Model.DisplayOptions.get('thumbs_below_projects') && Cargo.Helper.GetCurrentPageType() == "project")) {
			$('body #thumbnails').addClass('inline-block');
		} else {
			$('.project_media > *:last-child').css('margin-right', '0');
		}

		// if no project media, no margin right
		if ($('.project_media').length <= 0) {
			$('.project_content').css('margin-right', '0');
		}

		// Append the footer if there is text to the text container, or append it to project_content
		if ($('.textcolumns').length > 0) {
			$('.project_footer').appendTo('.project_content .textcolumns');
		} else {
			$('.project_footer').appendTo('.project_content');
		}

		// add img_holder around each project media img
		$('.project_media > img').not('.spacer').wrap('<div class="img_holder" data-elementresizer-no-centering />');


		// Set variables for calculating ColumnizeText
	    Design.setStageProperties();
	    Design.titleHeight();
		Design.intextImageHeight();

		// Find the height of the content before it is columnized
		Design.data.textBodyStartHeight = $('.project_content .textcolumns').height() + Design.data.intextImageHeight;

		// Add event to fire things when it is complete
		Cargo.Event.trigger("formatting_complete", "Cargo");

	},

	mediaLinks: function () {

		// if user wants an image to have an external link (they must wrap with a blank div)
		// Make sure this div works in element resizer and has a set heigh & width

		$('.project_media > div').each(function() {

			if (this.attributes.length === 0 ){

				imgPadding = parseInt($('.project_media img').css('margin-right'));
				this_Width = $(this).find('img').width();

				$(this).attr('data-elementresizer-no-centering', '');
				$(this).find('a').attr('data-elementresizer-no-centering', '');

				$(this).width(this_Width + imgPadding);
				$(this).find('a').width(this_Width + imgPadding);
				$(this).find('img').css('margin-left', '0');

			}

		});

	}

};

/**
 * Events
 */

$(function() {

	// run mobile init if it has not already
	if (!$('body').hasClass('phone')) {
		Design.Mobile.init();
	}

	// display the pagination loader
	$('#autopaginate_loader').css('display', 'block');

	// set first thumbsize and run first isotope
	Design.setThumbSizeAfterFirstLoad();
	Design.dataRows();

	// if not on the phone, format sets
	if (!Cargo.Helper.isPhone()) {
		Design.setFormatting();
	}

	Cargo.Core.ReplaceLoadingAnims.init();
	Design.bindKeys();
	Design.hoverProject();

	// hide the project until ready to show
	$('.project').css('visibility', 'hidden');

});


// Window Resize
$(window).on('resize', function() {

    Design.setStageProperties();
	Design.setThumbSize();
	Design.horizontalIsotope();

	Design.columnizeText();

	Site.Project.mediaLinks();

	if (Cargo.Helper.isMobile()) {
		setTimeout(function(){
			Design.setResizerOptions();
		}, 250)
	}
});

// Project Load Complete
Cargo.Event.on("project_load_complete", function(pid) {

	// load complete sometimes fires before doc.ready
	// For direct links, this is a problem, so delay this event
	if($("body[data-mobileload!='true']").length == 1) {
		setTimeout(function() {
			Cargo.Event.trigger("project_load_complete", pid);
		}, 100);
		return false;
	}

	// Remove active state on Set link if thumbnails are hidden
	if ( (Cargo.Helper.GetCurrentPageType() =="page" && !Cargo.Model.DisplayOptions.get("thumbs_below_pages") && Cargo.Helper.IsOnSet()) ) {

		$('.set_link.active').removeClass("active");

	}

	Design.setStageProperties();

	// if we haven't already isotoped, run the first isotope
	if ($('#thumbnails').hasClass('first-isotope')) {
		Design.setThumbSizeAfterFirstLoad();
	}

	Site.Project.loadComplete();

	Site.Project.mediaLinks();

	$('.project_media').width(Design.data.allMediaWidth);

	Design.setProjectMediaSize();

	Design.setResizerOptions();

	Design.thumbInfoClick();

	// scroll to the left on load
	Cargo.Helper.ScrollToLeft( $('#slide_container') );

	// scroll to left of project if you click on the active project thumb
	$('.project_thumb .active .thumb_image').click( function() {
		setTimeout(function() {
			Cargo.Helper.ScrollToLeft( $('#slide_container') );
		}, 10)
	});


});



Cargo.Event.on("project_load_start", function() {

	$('.project_media').css('visibility', 'hidden');

});

Cargo.Event.on("formatting_complete", function() {

	Design.setThumbSize();

	$('.project').css('visibility', 'visible');

	Design.captionFormatting();

	Design.columnizeText();

	if (!Cargo.Helper.isMobile() && Cargo.Model.DisplayOptions.get('image_scroll') == true && Cargo.Model.DisplayOptions.get('lightbox_view') == false) {

		Design.imageScroll();

	}

	// Re-check for audio components that have moved
	Cargo.Core.Audio.CheckForAudio();

	makeThumbnailLinksClickable();
});

Cargo.Event.on("thumbsize_complete", function() {

		Design.adjustStage();

});


Cargo.Event.on("elementresizer_update_complete", function() {
// 	Set width for project media
	$('.project_media').width(Design.data.allMediaWidth);
	Design.setProjectMediaSize();

});

Cargo.Event.on("pagination_start", function() {

	// add some extra width to thumbnails container, so we don't run pagination if thumbnails end in the center of the window
	$("#thumbnails").width($("#thumbnails").width()+ 500);

});

Cargo.Event.on("pagination_complete", function() {

	Design.isotopeOnPagination();

	Design.hoverProject();

});

Cargo.Event.on("column_complete", function() {

	Design.setProjectMediaSize();
	Design.noBreaksOnTop();


});

Cargo.Event.on("project_change", function() {

	$('body #thumbnails').removeClass('inline-block');

	if (!$('.project').hasClass('adjust_stage')) {
		setTimeout(function() {
			Design.adjustStage();
		}, 100)
	}

});

Cargo.Event.on("show_index_start", function() {

	// run mobile init if it has not already
	if (!$('body').hasClass('phone')) {
		Design.Mobile.init();
	}

	// make sure the project thumbs are hidden
	$(".project_thumb").css('visibility', 'hidden');

	// scroll everything to left
	setTimeout(function() {
		Cargo.Helper.ScrollToLeft( $('#slide_container') );
	}, 10)

	Design.setStageProperties();
	Design.setProjectMediaSize();

});

Cargo.Event.on("admin_edit_load_complete", function() {});

Cargo.Event.on("show_index_complete", function(pid) {

	Design.setStageProperties();

	// make sure un-isotoped images are hidden
	$(".project_thumb[data-rowed!='true']").css('visibility', 'hidden');

	// if thumbnails have been isotoped, set the first thumb size
	if ($('#thumbnails').hasClass('first-isotope')) {
		Design.setThumbSizeAfterFirstLoad();
	}

	// remove inline-block class from thumbnails for index
	$('body #thumbnails').removeClass('inline-block');

	makeThumbnailLinksClickable();
});


Cargo.Event.on("slideshow_on", function(el, obj) {

	slide_length = $('.slideshow').length;
	slide_pad = parseInt($('.slideshow').css('margin-right'));
	default_img_w = parseInt(Cargo.Model.DisplayOptions.get('image_width'));

	Design.data.allMediaWidth = slide_length * (slide_pad+default_img_w);

	$('.project_media').width(Design.data.allMediaWidth);

	Design.setProjectMediaSize();

});

Cargo.Event.on("reseed_navigation_complete", function() {

	// hide the index before the page reloads
	$('#index').css('visibility', 'hidden');

	// if not on the phone, format sets
	if (!Cargo.Helper.isPhone()) {
		Design.setFormatting();
	}

	// hard reload the page
	document.location.href = document.location.href;

});

Cargo.Event.on("navigation_set_toggle", function() {});

Cargo.Event.on("first_project_collection_reset", function() {

	// if has isotope, destroy isotope
	if ($(".thumbnails").hasClass('isotope')) {
		$(".thumbnails").isotope('destroy');
	}

	Design.setStageProperties();

	Design.setResizerOptions();

});

Cargo.Event.on("fullscreen_destroy_hotkeys", function() {

    Design.bindKeys();

});

Cargo.Event.on('fullscreen-initialized', function(fullscreen_view){
    fullscreen_view.prevent_smart_image_picking = true;
});

// easeOutExpo easing effect (used in imageScroll)
jQuery.extend( jQuery.easing,
	{
		easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
});


////////////////////////////////////////////////////////////////////////////////
// To make thumbnail links clickable
////////////////////////////////////////////////////////////////////////////////
function makeThumbnailLinksClickable () {
	$(".thumbnail-link").on('click', function() {
		window.location = $(this).find("a").attr("href");
		return false;
	});
}
////////////////////////////////////////////////////////////////////////////////