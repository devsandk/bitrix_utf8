function sendFForm(node)
{
	if (!BX.type.isDomNode(node))
		return false;
	BX.ajax({
		method: 'GET',
		processData: false,
		scriptsRunFirst: false,
		'url': (node.href+'&sessid='+BX.bitrix_sessid()),
		'data': '',
		'onsuccess': function(){
			BX.reload();
		}
	});
	return false;
}
function fRefreshCaptcha(form)
{
	var captchaIMAGE = null,
		captchaHIDDEN = BX.findChild(form, {attr : {'name': 'captcha_code'}}, true),
		captchaINPUT = BX.findChild(form, {attr: {'name':'captcha_word'}}, true),
		captchaDIV = BX.findChild(form, {'className':'comments-reply-field-captcha-image'}, true);
	if (captchaDIV)
		captchaIMAGE = BX.findChild(captchaDIV, {'tag':'img'});
	if (captchaHIDDEN && captchaINPUT && captchaIMAGE)
	{
		captchaINPUT.value = '';
		BX.ajax.getCaptcha(function(result) {
			captchaHIDDEN.value = result.captcha_sid;
			captchaIMAGE.src = '/bitrix/tools/captcha.php?captcha_code='+result.captcha_sid;
		});
	}
}


function ValidateForm(form)
{
	if (typeof form != "object" || typeof form.REVIEW_TEXT != "object")
		return false;

	var btnSubmit = BX.findChild(form, {'attribute':{'name':'send_button'}}, true);
	if (btnSubmit) btnSubmit.disabled = true;
	var btnPreview = BX.findChild(form, {'attribute':{'name':'view_button'}}, true);
	if (btnPreview) btnPreview.disabled = true;

	return true;
}

function fToggleCommentsForm(link, forceOpen)
{
	if (forceOpen === null) forceOpen = false;
	forceOpen = !!forceOpen;
	var form = BX.findChild(link.parentNode.parentNode, {'class':'comments-reply-form'}, true);
	var bHidden = (form.style.display != 'block') || forceOpen;
	form.style.display = (bHidden ? 'block' : 'none');
	if (bHidden)
		BX.removeClass(form, 'comments-reply-form-hidden');
	else
		BX.addClass(form, 'comments-reply-form-hidden');
	link.innerHTML = (bHidden ? BX.message('MINIMIZED_MINIMIZE_TEXT') : BX.message('MINIMIZED_EXPAND_TEXT'));
	var classAdd = (bHidden ? 'comments-expanded' : 'comments-minimized');
	var classRemove = (bHidden ? 'comments-minimized' : 'comments-expanded');
	BX.removeClass(BX.addClass(link.parentNode, classAdd), classRemove);
	BX.scrollToNode(BX.findChild(form, {'attribute': { 'name' : 'send_button' }}, true));
	if (window.oLHE)
		setTimeout(function() {
				if (!BX.browser.IsIE())
					window.oLHE.SetFocusToEnd();
				else
					window.oLHE.SetFocus();
			}, 100);
}

function AttachFile(iNumber, iCount, sIndex, oObj)
{
	var element = null;
	var bFined = false;
	iNumber = parseInt(iNumber);
	iCount = parseInt(iCount);

	document.getElementById('upload_files_info_' + sIndex).style.display = 'block';
	for (var ii = iNumber; ii < (iNumber + iCount); ii++)
	{
		element = document.getElementById('upload_files_' + ii + '_' + sIndex);
		if (!element || typeof(element) === null)
			break;
		if (element.style.display == 'none')
		{
			bFined = true;
			element.style.display = 'block';
			break;
		}
	}
	var bHide = (!bFined ? true : (ii >= (iNumber + iCount - 1)));
	if (bHide === true)
		oObj.style.display = 'none';
}

var GetSelection = function()
{
	var t = '';
	if (typeof window.getSelection == 'function')
	{
		try
		{
			var sel = window.getSelection().getRangeAt(0).cloneContents();
			var e = BX.create('div');
			e.appendChild(sel);
			t = e.innerHTML;
		}
		catch (e)
		{

		}
	}
	else if (document.selection && document.selection.createRange)
		t = document.selection.createRange().htmlText;
	return t;
}

function quoteMessageEx(author, mid, link)
{
	var input = null;
	if (!!link)
	{
		var component = BX.findParent(link, {'className':'comments-component'});
		if (!!component)
			input = BX.findChild(component, {'className':'post_message'}, true);
	}

	window["replyForumFormOpen"]();
	var selection = "";
	var message_id = 0;
	selection = GetSelection();

	if (document.getSelection)
	{
		selection = selection.replace(/\r\n\r\n/gi, "_newstringhere_").replace(/\r\n/gi, " ");
		selection = selection.replace(/  /gi, "").replace(/_newstringhere_/gi, "\r\n\r\n");
	}

	if (selection === "" && mid)
	{
		message_id = parseInt(mid.replace(/message_text_/gi, ""));
		if (message_id > 0)
		{
			var message = document.getElementById(mid);
			if (typeof(message) == "object" && message)
			{
				selection = message.innerHTML;
			}
		}
		else if (mid.length > 0)
		{
			selection = mid;
		}
	}

	if (selection !== "")
	{
		selection = selection.replace(/[\n|\r]*<br(\s)*(\/)*>/gi, "\n");

		// Video
		var videoWMV = function(str, p1, offset, s)
		{
			var result = ' ';
			var rWmv = /showWMVPlayer.*?bx_wmv_player.*?file:[\s'"]*([^"']*).*?width:[\s'"]*([^"']*).*?height:[\s'"]*([^'"]*).*?/gi;
			var res = rWmv.exec(p1);
			if (res)
				result = "[VIDEO WIDTH="+res[2]+" HEIGHT="+res[3]+"]"+res[1]+"[/VIDEO]";
			if (result == ' ')
			{
				var rFlv = /bxPlayerOnload[\s\S]*?[\s'"]*file[\s'"]*:[\s'"]*([^"']*)[\s\S]*?[\s'"]*height[\s'"]*:[\s'"]*([^"']*)[\s\S]*?[\s'"]*width[\s'"]*:[\s'"]*([^"']*)/gi;
				res = rFlv.exec(p1);
				if (res)
					result = "[VIDEO WIDTH="+res[3]+" HEIGHT="+res[2]+"]"+res[1]+"[/VIDEO]";
			}
			return result;
		}
		
		selection = selection.replace(/<script[^>]*>/gi, '\001').replace(/<\/script[^>]*>/gi, '\002');
		selection = selection.replace(/\001([^\002]*)\002/gi, videoWMV)
		selection = selection.replace(/<noscript[^>]*>/gi, '\003').replace(/<\/noscript[^>]*>/gi, '\004');
		selection = selection.replace(/\003([^\004]*)\004/gi, " ");

		// Quote & Code & Table
		selection = selection.
			replace(/<table class\=[\"]*forum-quote[\"]*>[^<]*<thead>[^<]*<tr>[^<]*<th>([^<]+)<\/th><\/tr><\/thead>[^<]*<tbody>[^<]*<tr>[^<]*<td>/gi, "\001").
			replace(/<table class\=[\"]*forum-code[\"]*>[^<]*<thead>[^<]*<tr>[^<]*<th>([^<]+)<\/th><\/tr><\/thead>[^<]*<tbody>[^<]*<tr>[^<]*<td>/gi, "\002").
			replace(/<table class\=[\"]*data-table[\"]*>[^<]*<tbody>/gi, "\004").
			replace(/<\/td>[^<]*<\/tr>(<\/tbody>)*<\/table>/gi, "\003").
			replace(/[\r|\n]{2,}([\001|\002])/gi, "\n$1");

		var ii = 0;
		while(ii++ < 50 && (selection.search(/\002([^\002\003]*)\003/gi) >= 0 || selection.search(/\001([^\001\003]*)\003/gi) >= 0))
		{
			selection = selection.replace(/\002([^\002\003]*)\003/gi, "[CODE]$1[/CODE]").replace(/\001([^\001\003]*)\003/gi, "[QUOTE]$1[/QUOTE]");
		}


		var regexReplaceTableTag = function (s, tag, replacement)
		{
			var re_match = new RegExp("\004([^\004\003]*)("+tag+")([^\004\003]*)\003", "i");
			var re_replace = new RegExp("((?:\004)(?:[^\004\003]*))("+tag+")((?:[^\004\003]*)(?:\003))", "i");
			var ij = 0;
			while((ij++ < 300) && (s.search(re_match) >= 0))
				s = s.replace(re_replace, "$1"+replacement+"$3");
			return s;
		}

		ii = 0;
		while(ii++ < 10 && (selection.search(/\004([^\004\003]*)\003/gi) >= 0))
		{
			selection = regexReplaceTableTag(selection, "<tr>", "[TR]");
			selection = regexReplaceTableTag(selection, "<\/tr>", "[/TR]");
			selection = regexReplaceTableTag(selection, "<td>", "[TD]");
			selection = regexReplaceTableTag(selection, "<\/td>", "[/TD]");
			selection = selection.replace(/\004([^\004\003]*)\003/gi, "[TABLE]$1[/TD][/TR][/TABLE]");
		}

		// Smiles
		if (BX.browser.IsIE())
			selection = selection.replace(/<img(?:(?:\s+alt\s*=\s*\"?smile([^\"\s]+)\"?)|(?:\s+\w+\s*=\s*[^\s>]*))*>/gi, "$1");
		else
			selection = selection.replace(/<img.*?alt=[\"]*smile([^\"\s]+)[\"]*[^>]*>/gi, "$1");

		selection = selection.replace(/<img(.+?)data-code=\"(.+?)\"(.+?)>/gi, "$2");

		// Hrefs
		selection = selection.replace(/<a[^>]+href=[\"]([^\"]+)\"[^>]+>([^<]+)<\/a>/gi, "[URL=$1]$2[/URL]");
		selection = selection.replace(/<a[^>]+href=[\']([^\']+)\'[^>]+>([^<]+)<\/a>/gi, "[URL=$1]$2[/URL]");
		selection = selection.replace(/<[^>]+>/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"");

		selection = selection.replace(/(smile(?=[:;8]))/g, "");

		selection = selection.replace(/\&shy;/gi, "");
		selection = selection.replace(/\&nbsp;/gi, " ");
		if (author !== null && author)
			selection = author + BX.message('author') + selection;

		if (!!input)
		{
			input.value += selection;
		}
		else if (!!window.oLHE)
		{
			if (window.oLHE.sEditorMode == 'code' && window.oLHE.bBBCode) { // BB Codes
				window.oLHE.WrapWith("[QUOTE]", "[/QUOTE]", selection);
			} else if (window.oLHE.sEditorMode == 'html') { // WYSIWYG
				var strId = (!window.oLHE.bBBCode ? " id\"=" + window.oLHE.SetBxTag(false, {tag: "quote"}) + "\"" : '');
				window.oLHE.InsertHTML('<blockquote class="bx-quote"' + strId + ">" +
					window.oLHE.ParseContent(selection, true) + "</blockquote><br/>");
			}

			window.oLHE.SetFocus();
			BX.defer(window.oLHE.SetFocus, window.oLHE)();
		}
	}
	return false;
}
BX(function() {
	if (BX.browser.IsIE())
	{
		var posts = BX.findChildren(document, {'className':'comments-post-table'}, true), all, i, ii;
		if (!posts) return;
		for (ii = 0; ii < posts.length; ii++)
		{
			all = posts[ii].getElementsByTagName('*');
			i = all.length;
			while (i--) {
				if (all[i].scrollWidth > all[i].offsetWidth) {
					all[i].style['paddingBottom'] = '20px';
					all[i].style['overflowY'] = 'hidden';
				}
			}
		}
	}
});
