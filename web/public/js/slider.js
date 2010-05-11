// JavaScript Document

$(document).ready(function(){
	$('div#week').hide().css({opacity:0});
	$('span#seeAll').
		addClass('clickable').
		click(function(){				
			toggleSection($(this).next());
			$(this).blur();
			return false;
		}).
		keypress(function(e){
			if(e.which == 13){
				toggleSection($(e.target).next());
				$(this).blur();
			}
		});
});

function toggleSection(section){
	if(section.is(':visible')){
		section.animate({opacity:0}, {duration:300, queue: false});
		section.slideUp(500, 'easeInOutCubic');
	} else {
		section.slideDown({duration:400, queue: false, easing:'easeInOutCubic'});
		section.animate({opacity:1, duration:300, easing:'easeInOutCubic'});
	}	
}