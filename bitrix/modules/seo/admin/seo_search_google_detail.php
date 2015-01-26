<?
require_once($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/main/include/prolog_admin_before.php");

define('ADMIN_MODULE_NAME', 'seo');

use Bitrix\Main;
use Bitrix\Main\Text\Converter;
use Bitrix\Main\Localization\Loc;
use Bitrix\Seo\Engine;

Loc::loadMessages(dirname(__FILE__).'/../../main/tools.php');
Loc::loadMessages(dirname(__FILE__).'/seo_search.php');

if (!$USER->CanDoOperation('seo_tools'))
{
	$APPLICATION->AuthForm(Loc::getMessage("ACCESS_DENIED"));
}

if(!Main\Loader::includeModule('seo'))
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	ShowError(Loc::getMessage("SEO_ERROR_NO_MODULE"));
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
}

if(!Main\Loader::includeModule('socialservices'))
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	ShowError(Loc::getMessage("SEO_ERROR_NO_MODULE_SOCSERV"));
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
}

$domain = $_REQUEST['domain'];

if($domain)
{
	$bFound = false;
	$arDomains = \CSeoUtils::getDomainsList();
	foreach ($arDomains as $arDomain)
	{
		if($domain == $arDomain['DOMAIN'])
		{
			$bFound = true;
			break;
		}
	}

	if(!$bFound)
		$domain = false;
}

if(!$domain)
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	ShowError(Loc::getMessage("SEO_ERROR_NO_DOMAIN"));
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
}

$APPLICATION->SetAdditionalCSS('/bitrix/panel/seo/seo.css');

$engine = new Engine\Google();

$siteDomainEnc = Converter::getHtmlConverter()->encode($arDomain['DOMAIN']);
$siteDomainEncView = Converter::getHtmlConverter()->encode(\CBXPunycode::ToUnicode($arDomain['DOMAIN'], $e = null));
$siteDirEnc = Converter::getHtmlConverter()->encode($arDomain['SITE_DIR']);

try
{
	$arSiteInfo = $engine->getSiteInfo($arDomain['DOMAIN'], $arDomain['SITE_DIR']);
}
catch(Exception $e)
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	ShowError($e->getMessage());
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
}

$bSiteVerified = $arSiteInfo[$domain]['verified'] == 'true';

$aTabs = array(
	array("DIV" => "seo_info1", "TAB" => Loc::getMessage('SEO_DETAIL_INFO'), "ICON" => "main_settings", "TITLE" => Loc::getMessage('SEO_DETAIL_INFO_TITLE', array('#DOMAIN#' => $siteDomainEncView))),
	array("DIV" => "seo_info2", "TAB" => Loc::getMessage('SEO_DETAIL_KEYWORDS'), "ICON" => "main_settings", "TITLE" => Loc::getMessage('SEO_DETAIL_KEYWORDS_TITLE', array('#DOMAIN#' => $siteDomainEncView)), 'ONSELECT' => 'window.BXLoadInfo(\'keywords\')'),
	array("DIV" => "seo_info3", "TAB" => Loc::getMessage('SEO_DETAIL_CRAWL_ISSUES'), "ICON" => "main_settings", "TITLE" => Loc::getMessage('SEO_DETAIL_CRAWL_ISSUES_TITLE', array('#DOMAIN#' => $siteDomainEncView)), 'ONSELECT' => 'window.BXLoadInfo(\'crawlissues\')'),
);

$tabControl = new CAdminTabControl("seoGoogleTabControl", $aTabs, true, true);

$APPLICATION->SetTitle(Loc::getMessage("SEO_GOOGLE_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");


$aMenu = array();

$aMenu[] = array(
	"TEXT"	=> Loc::getMessage("SEO_DOMAIN_LIST"),
	"LINK"	=> "/bitrix/admin/seo_search_google.php?lang=".LANGUAGE_ID,
	"ICON"	=> "btn_list",
);

$context = new CAdminContextMenu($aMenu);
$context->Show();

$tabControl->Begin();
$tabControl->BeginNextTab();

$siteIdEnc = Converter::getHtmlConverter()->encode($arDomain['LID']);
$siteNameEnc = Converter::getHtmlConverter()->encode($arDomain['SITE_NAME']);
?>
<script type="text/javascript">
function saveParam(field)
{
	var input = BX(field + '_edit');
	var inputRow = BX(field + '_row');

	if(input && inputRow)
	{
		var value = input.type == 'select-one' ? input.options[input.selectedIndex].value : input.value;

		BX.addClass(inputRow, 'seo-loading');
		callService('save', {name:field,value:value}, function(res)
		{
			if(!res.error)
			{
				res = res['<?=CUtil::JSEscape($arDomain['DOMAIN'])?>'];

				input.value = res[field];
				BX(field + '_view').innerHTML = res[field];

				BX.removeClass(inputRow, 'seo-edit');
			}
			else
			{
				alert(res.error);
			}

			BX.removeClass(inputRow, 'seo-loading');
		}, function()
		{
			BX.removeClass(inputRow, 'seo-loading');
		});
	}
}

function callService(action, params, callback, callback_error)
{
	BX.ajax.loadJSON('/bitrix/tools/seo_google.php?action='+action+'&domain=<?=CUtil::JSEscape(urlencode($arDomain['DOMAIN']))?>&dir=<?=CUtil::JSEscape(urlencode($arDomain['SITE_DIR']))?>&sessid=' + BX.bitrix_sessid(), params, function(res)
		{
			callback(res);
		});
}
</script>

	<tr class="adm-detail-required-field">
		<td width="40%"><?=Loc::getMessage('SEO_DOMAIN')?>:</td>
		<td width="60%"><?=$siteDomainEncView?></td>
	</tr>
	<tr>
		<td><?=Loc::getMessage('SEO_SITE')?>:</td>
		<td>[<a href="site_edit.php?lang=<?=LANGUAGE_ID?>&amp;LID=<?=urlencode($siteIdEnc)?>"><?=$siteIdEnc?></a>] <?=$siteNameEnc?></td>
	</tr>
<?
if(is_array($arSiteInfo))
{
?>
	<tr>
		<td><?=Loc::getMessage('SEO_VERIFIED')?>:</td>
		<td><?=$bSiteVerified ? Loc::getMessage('MAIN_YES') : Loc::getMessage('MAIN_NO')?></td>
	</tr>
	<tr>
		<td><?=Loc::getMessage('SEO_GOOGLE_GEOLOCATION')?>:</td>
		<td id="geolocation_row">
			<div class="seo-view-field">
				<span id="geolocation_view"><?=Converter::getHtmlConverter()->encode($arSiteInfo[$domain]['geolocation'])?></span>
				<span class="seo-edit-link" onclick="BX.addClass(this.parentNode.parentNode, 'seo-edit');"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE')?></span>
			</div>
			<div class="seo-edit-field"><input type="text" style="width: 22px" value="<?=Converter::getHtmlConverter()->encode($arSiteInfo[$domain]['geolocation'])?>" maxlength="2" id="geolocation_edit"><span class="seo-save-link"onclick="saveParam('geolocation')"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE_SAVE')?></span><span class="seo-cancel-link" onclick="BX.removeClass(this.parentNode.parentNode, 'seo-edit')"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE_CANCEL')?></span><span class="seo-loading-message"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE_LOADING')?></span></div>
		</td>
	</tr>
	<tr>
		<td><?=Loc::getMessage('SEO_GOOGLE_PREFERRED_DOMAIN')?>:</td>
		<td id="preferred-domain_row">
			<div class="seo-view-field">
				<span id="preferred-domain_view"><?=Loc::getMessage('SEO_GOOGLE_PREFERRED_DOMAIN_'.ToUpper($arSiteInfo[$domain]['preferred-domain']))?></span>
				<?/*<span class="seo-edit-link" onclick="BX.addClass(this.parentNode.parentNode, 'seo-edit');"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE')?></span>*/?>
			</div>
			<div class="seo-edit-field"><select id="preferred-domain_edit">
				<option value="none"<?=$arSiteInfo[$domain]['preferred-domain']=='none'?' selected="selected"':''?>><?=Loc::getMessage('SEO_GOOGLE_PREFERRED_DOMAIN_NONE');?></option>
				<option value="preferwww"<?=$arSiteInfo[$domain]['preferred-domain']=='preferwww'?' selected="selected"':''?>><?=Loc::getMessage('SEO_GOOGLE_PREFERRED_DOMAIN_PREFERWWW');?></option>
				<option value="prefernowww"<?=$arSiteInfo[$domain]['preferred-domain']=='prefernowww'?' selected="selected"':''?>><?=Loc::getMessage('SEO_GOOGLE_PREFERRED_DOMAIN_PREFERNOWWW');?></option>
			</select><span class="seo-save-link"onclick="saveParam('preferred-domain')"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE_SAVE')?></span><span class="seo-cancel-link" onclick="BX.removeClass(this.parentNode.parentNode, 'seo-edit')"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE_CANCEL')?></span><span class="seo-loading-message"><?=Loc::getMessage('SEO_EDIT_FIELD_VALUE_LOADING')?></span></div>
		</td>
	</tr>
	<tr>
		<td></td><td><?=BeginNote()?><a href="https://www.google.com/webmasters/tools/" target="_blank"><?=Loc::getMessage('SEO_GOOGLE_WEBMASTER_TOOLS_LINK')?></a><?=EndNote()?></td>
	</tr>
<?
}
else
{
?>
<tr>
	<td colspan="2"><?=BeginNote(),Loc::getMessage('SEO_ERROR_NO_INFO', array("#DOMAIN#" => $siteDomainEncView)),EndNote()?></td>
</tr>
<?
}

$tabControl->BeginNextTab();
?>
<tr>
	<td><div id="seo_google_keywords" align="center"><?=BeginNote(),Loc::getMessage('SEO_LOADING'),EndNote();?></div></td>
</tr>
<?
$tabControl->BeginNextTab();
?>
<tr>
	<td><div id="seo_google_crawlissues" align="center"><?=BeginNote(),Loc::getMessage('SEO_LOADING'),EndNote();?></div></td>
</tr>
<?
$tabControl->End();
?>
<script type="text/javascript">
function BXLoadInfo(action)
{
	BX.ajax.loadJSON(
		'/bitrix/tools/seo_google.php?action='+action+'_feed&domain=<?=urlencode($arDomain['DOMAIN'])?>&dir=<?=urlencode($arDomain['SITE_DIR'])?>&<?=bitrix_sessid_get()?>',
		function(res)
		{
			var node = BX('seo_google_' + action);
			if(!!node)
			{
				node.innerHTML = '';
				if(res.error)
				{
					node.innerHTML = res.error;
				}
				else
				{
					var s = '', i = 0;
					switch(action)
					{
						case 'keywords':
							s += '<table class="internal" width="70%"><tr><td width="50%"><b><?=CUtil::JSEscape(Loc::getMessage('SEO_GOOGLE_KEYWORDS_INTERNAL'))?></b></td><td width="50%"><b><?=CUtil::JSEscape(Loc::getMessage('SEO_GOOGLE_KEYWORDS_EXTERNAL'))?></b></td></tr><tr><td valign="top"><ul>';

							if(res.keyword.internal.length > 0)
							{
								for(i = 0; i < res.keyword.internal.length; i++)
								{
									s += '<li>' + BX.util.htmlspecialchars(res.keyword.internal[i]) + '</li>';
								}
							}
							else
							{
								s += '<li> -- <?=CUtil::JSEscape(Loc::getMessage('SEO_KEYWORDS_EMPTY'))?> -- </li>';
							}

							s += '</ul></td><td valign="top"><ul>';

							if(res.keyword.external.length > 0)
							{
								for(i = 0; i < res.keyword.external.length; i++)
								{
									s += '<li>' + BX.util.htmlspecialchars(res.keyword.external[i]) + '</li>';
								}
							}
							else
							{
								s += '<li> -- <?=CUtil::JSEscape(Loc::getMessage('SEO_KEYWORDS_EMPTY'))?> -- </li>';
							}

							s += '</ul></td></tr></table>';
						break;
						case 'crawlissues':

							if(res.length > 0)
							{
								for(i = 0; i < res.length; i++)
								{
									s += '<table class="internal" width="70%">'

									s += '<tr><td width="20%"><?=CUtil::JSEscape(Loc::getMessage('SEO_CRAWLISSUES_DATE'))?></td><td width="80%">'+BX.formatDate(new Date(res[i]['date-detected']))+'</td></tr>';
									s += '<tr><td><?=CUtil::JSEscape(Loc::getMessage('SEO_CRAWLISSUES_TYPE'))?></td><td>'+res[i]['issue-type']+'</td></tr>';
									s += '<tr><td><?=CUtil::JSEscape(Loc::getMessage('SEO_CRAWLISSUES_TITLE'))?></td><td>'+res[i].title+'</td></tr>';
									s += '<tr><td><?=CUtil::JSEscape(Loc::getMessage('SEO_CRAWLISSUES_DETAIL'))?></td><td>'+res[i].detail+'</td></tr>';
									s += '<tr><td><?=CUtil::JSEscape(Loc::getMessage('SEO_CRAWLISSUES_URL'))?></td><td>'+res[i].url+'</td></tr>';

									if(!!res[i]['linked-from'])
									{
										s += '<tr><td><?=CUtil::JSEscape(Loc::getMessage('SEO_CRAWLISSUES_LINKEDFROM'))?></td><td>'+res[i]['linked-from']+'</td></tr>'

									}

									s += '</table><br /><br />';
								}
							}
							else
							{
								s += '<b><?=CUtil::JSEscape(Loc::getMessage('SEO_EDIT_NO_MESSAGES'))?></b>';
							}

						break;
					}

					node.innerHTML = s;
				}
			}
		}
	);
}
</script>
<?
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>