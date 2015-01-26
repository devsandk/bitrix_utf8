;(function(window){
if (window.onForumImageLoad) return;
if (typeof window.oForumForm != "object")
	window.oForumForm = {};
if (!window.oForumForm['images_for_resize'])
	window.oForumForm['images_for_resize'] = [];

top.onForumImageLoad = window.onForumImageLoad = function(oImg, w, h, family, oImg1)
{
	if (typeof oImg == "string")
		oImg = BX(oImg);
	if (oImg == null || typeof oImg != "object")
		return false;

	family = (family && family.length > 0 ? family : "");
	w = parseInt(parseInt(w) > 0 ? w : 100);
	h = parseInt(h);
	var
		img = {width : oImg.width, height : oImg.height},
		k = 1;

	if (oImg.naturalWidth)
	{
		img['width'] = oImg.naturalWidth;
		img['height'] = oImg.naturalHeight;
	}

	if (img['width'] > 0 && img['height'] > 0)
		k = (h <= 0 ? w/img['width'] : Math.min(w/img['width'], h/img['height']));

	if (0 < k && k < 1)
	{
		oImg.style.cursor = 'pointer';
		oImg.setAttribute("data-bx-width", img['width']);
		oImg.setAttribute("data-bx-height", img['height']);
		oImg.width = parseInt(img['width'] * k);
		oImg.height = parseInt(img['height'] * k);
	}
};
top.onForumImageClick = window.onForumImageClick = function(oImg, w, h, family)
{
	if (oImg === null || typeof oImg != "object")
		return false;

	w = (w <= 0 ? 100 : w);
	h = (h <= 0 ? 100 : h);
	family = (family && family.length > 0 ? family : "");
	var
		id = 'div_image' + (family.length > 0 ? family : oImg.id),
		div = BX(id);
	if (div !== null && typeof div == "object")
		div.parentNode.removeChild(div);
	var pos = {},
		res = BX.pos(oImg),
		win = BX.GetWindowScrollPos(),
		win_size = BX.GetWindowInnerSize();

	pos['top'] = parseInt(res['top'] + oImg.offsetHeight/2 - h/2);
	if ((parseInt(pos['top']) + parseInt(h)) > (win['scrollTop'] + win_size['innerHeight']))
	{
		pos['top'] = (win['scrollTop'] + win_size['innerHeight'] - h - 10);
	}
	if (pos['top'] <= win['scrollTop'])
	{
		pos['top'] = win['scrollTop'] + 10;
	}
	pos['left'] = parseInt(res['left'] + oImg.offsetWidth/2 - w/2);
	pos['left'] = (pos['left'] <= 0 ? 10 : pos['left']);

	div = BX.create("DIV", {
			props: {
				id : id,
				className : 'forum-popup-image'
			},
			style : {
				position : 'absolute',
				width : w + 'px',
				height : h + 'px',
				zIndex : 80
			},
			events:{
				click : function(){
					jsFloatDiv.Close(this);
					this.parentNode.removeChild(this);}
			},
			children: [
				BX.create("DIV", {
					style: {
						position: "absolute",
						zIndex: 82,
						left:  (w - 14) + "px",
						top: "0px"
					},
					props: {
						className: 'empty'
					}
				}),
				BX.create("IMG", {
					style: {
						cursor: "pointer"
					},
					attr: {
						width: w,
						height: h
					},
					props: {
						src: oImg.src
					}
				})
			]
		}
	);
	document.body.appendChild(div);
	jsFloatDiv.Show(div, pos['left'], pos['top']);
};

top.onForumImagesLoad = window.onForumImagesLoad = function()
{
	if (window.oForumForm['images_for_resize'].length <= 0)
		return false;
	for (var ii = 0; ii < window.oForumForm['images_for_resize'].length; ii++)
	{
		if (window.oForumForm['images_for_resize'][ii] &&
			BX(window.oForumForm['images_for_resize'][ii]) &&
			!BX(window.oForumForm['images_for_resize'][ii]).hasAttribute("bx-forum-img-loaded"))
		{
			BX(window.oForumForm['images_for_resize'][ii]).onload();
			BX(window.oForumForm['images_for_resize'][ii]).setAttribute("bx-forum-img-loaded", true);
		}
	}

};

top.addForumImagesShow = window.addForumImagesShow = function(id)
{
	window.oForumForm['images_for_resize'].push(id);
	window.onForumImagesLoad();
};
window.onForumImagesLoad();
})(window);