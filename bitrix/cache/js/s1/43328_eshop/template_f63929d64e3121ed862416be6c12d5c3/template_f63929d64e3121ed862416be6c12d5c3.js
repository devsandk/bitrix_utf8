
; /* Start:/bitrix/templates/.default/components/bitrix/menu/menu-main2/script.js*/
var jshover = function()
{
	var menuDiv = document.getElementById("horizontal-multilevel-menu")
	if (!menuDiv)
		return;

	var sfEls = menuDiv.getElementsByTagName("li");
	for (var i=0; i<sfEls.length; i++) 
	{
		sfEls[i].onmouseover=function()
		{
			this.className+=" jshover";
		}
		sfEls[i].onmouseout=function() 
		{
			this.className=this.className.replace(new RegExp(" jshover\\b"), "");
		}
	}
}

if (window.attachEvent) 
	window.attachEvent("onload", jshover);
/* End */
;
; /* Start:/js/43328/jquery.tabs.min.js*/
$(function(){
	tabs.init();
});	
tabs = {
	init : function(){
		$('.tabs').each(function(){
			$(this).find('.tab-content').hide();
			$($(this).find('ul.nav .selected a').attr('href')).fadeIn(300);
			$(this).find('ul.nav a').click(function(){
				$(this).parents('.tabs').find('.tab-content').hide();
				$($(this).attr('href')).fadeIn(300);
				$(this).parent().addClass('selected').siblings().removeClass('selected');
				//Cufon.refresh();
				return false;
			});
		});
	}
}
/* End */
;; /* /bitrix/templates/.default/components/bitrix/menu/menu-main2/script.js*/
; /* /js/43328/jquery.tabs.min.js*/
