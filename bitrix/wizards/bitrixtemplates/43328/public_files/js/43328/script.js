$(function(){
// IPad/IPhone
	var viewportmeta = document.querySelector && document.querySelector('meta[name="viewport"]'),
	ua = navigator.userAgent,

	gestureStart = function () {viewportmeta.content = "width=device-width, minimum-scale=0.25, maximum-scale=1.6";},

	scaleFix = function () {
		if (viewportmeta && /iPhone|iPad/.test(ua) && !/Opera Mini/.test(ua)) {
			viewportmeta.content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";
			document.addEventListener("gesturestart", gestureStart, false);
		}
	};

	scaleFix();
	// Menu Android
	if(window.orientation!=undefined){
    var regM = /ipod|ipad|iphone/gi,
     result = ua.match(regM)
    if(!result) {
     $('.sf-menu li').each(function(){
      if($(">ul", this)[0]){
       $(">a", this).toggle(
        function(){
         return false;
        },
        function(){
         window.location.href = $(this).attr("href");
        }
       );
      }
     })
    }
   }
});
var ua=navigator.userAgent.toLocaleLowerCase(),
 regV = /ipod|ipad|iphone/gi,
 result = ua.match(regV),
 userScale="";
if(!result){
 userScale=",user-scalable=0"
}
document.write('<meta name="viewport" content="width=device-width,initial-scale=1.0'+userScale+'">');

$(document).ready(function() {
  $('.bx_catalog_list_home .bx_catalog_item').each(function() {
    if($(this).length > 0) {
      $(this).css('height', $(this).height());
    }
  });
  if($('h1.bx_catalog_text_category_title').length > 0) {
    $('body h1').each(function() {
      if(!$(this).hasClass('bx_catalog_text_category_title')) {
        $(this).remove();
      }
    })
  }
  if($('div.bx_item_detail h1').length > 0) {
    $('body h1').each(function() {
      if(!$(this).closest('div').hasClass('bx_item_detail')) {
        $(this).remove();
      }
    })
  }
})