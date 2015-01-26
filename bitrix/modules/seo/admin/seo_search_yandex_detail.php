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

$domain = ToLower($_REQUEST['domain']);

if($domain)
{
	$bFound = false;
	$arDomains = \CSeoUtils::getDomainsList();
	foreach ($arDomains as $arDomain)
	{
		$arDomain['DOMAIN'] = ToLower($arDomain['DOMAIN']);
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

$engine = new Engine\Yandex();

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

$bSiteVerified = $arSiteInfo[$domain]['verification'] == Engine\Yandex::VERIFIED_STATE_VERIFIED;

$aTabs = array(
	array("DIV" => "seo_info1", "TAB" => Loc::getMessage('SEO_DETAIL_INFO'), "ICON" => "main_settings", "TITLE" => Loc::getMessage('SEO_DETAIL_INFO_TITLE', array('#DOMAIN#' => $siteDomainEncView))),
	array("DIV" => "seo_info2", "TAB" => Loc::getMessage('SEO_DETAIL_TOP_QUERIES'), "ICON" => "main_settings", "TITLE" => Loc::getMessage('SEO_DETAIL_TOP_QUERIES_TITLE', array('#DOMAIN#' => $siteDomainEncView)), 'ONSELECT' => 'window.BXLoadInfo(\'top-queries\')'),
	array("DIV" => "seo_info3", "TAB" => Loc::getMessage('SEO_DETAIL_CRAWLING'), "ICON" => "main_settings", "TITLE" => Loc::getMessage('SEO_DETAIL_CRAWLING_TITLE', array('#DOMAIN#' => $siteDomainEncView)), 'ONSELECT' => 'window.BXLoadInfo(\'crawling\')'),
	array("DIV" => "seo_info4", "TAB" => Loc::getMessage('SEO_DETAIL_ORIGINAL'), "ICON" => "main_settings", "TITLE" => Loc::getMessage('SEO_DETAIL_ORIGINAL_TITLE', array('#DOMAIN#' => $siteDomainEncView)), 'ONSELECT' => 'window.BXLoadInfo(\'original_texts\')'),
);

$tabControl = new CAdminTabControl("seoYandexTabControl", $aTabs, true, true);

$APPLICATION->SetTitle(Loc::getMessage("SEO_YANDEX_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$aMenu = array();

$aMenu[] = array(
	"TEXT"	=> Loc::getMessage("SEO_DOMAIN_LIST"),
	"LINK"	=> "/bitrix/admin/seo_search_yandex.php?lang=".LANGUAGE_ID,
	"ICON"	=> "btn_list",
);

$context = new CAdminContextMenu($aMenu);
$context->Show();

$tabControl->Begin();
$tabControl->BeginNextTab();

$siteIdEnc = Converter::getHtmlConverter()->encode($arDomain['LID']);
$siteNameEnc = Converter::getHtmlConverter()->encode($arDomain['SITE_NAME']);
?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?=Loc::getMessage('SEO_DOMAIN')?>:</td>
		<td width="60%"><?=$siteDomainEncView?></td>
	</tr>
	<tr>
		<td><?=Loc::getMessage('SEO_SITE')?>:</td>
		<td>[<a href="site_edit.php?lang=<?=LANGUAGE_ID?>&amp;LID=<?=urlencode($siteIdEnc)?>"><?=$siteIdEnc?></a>] <?=$siteNameEnc?></td>
	</tr>
<?
if(is_array($arSiteInfo[$domain]))
{
	if(isset($arSiteInfo[$domain]['tcy']))
	{
?>
	<tr>
		<td><?=Loc::getMessage('SEO_YANDEX_TCY')?>:</td>
		<td><b><?=$arSiteInfo[$domain]['tcy']?></b></td>
	</tr>
<?
	}
?>
	<tr>
		<td valign="top"><?=Loc::getMessage('SEO_YANDEX_VERIFIED')?>:</td>
		<td><?=Loc::getMessage('SEO_YANDEX_VERIFIED_'.$arSiteInfo[$domain]['verification'])?><?
	if(isset($arSiteInfo[$domain]['verification-details']))
	{
?>
	<br />
	<small><?=Loc::getMessage('SEO_YANDEX_VERIFIED_DETAILS_'.$arSiteInfo[$domain]['verification-details'])?></small>
<?
	}
?></td>
	</tr>
	<tr>
		<td valign="top"><?=Loc::getMessage('SEO_YANDEX_CRAWLING')?>:</td>
		<td><?=Loc::getMessage('SEO_YANDEX_CRAWLING_'.$arSiteInfo[$domain]['crawling'])?><?
	if(isset($arSiteInfo[$domain]['crawling-details']))
	{
?>
	<br />
	<small><?=Loc::getMessage('SEO_YANDEX_CRAWLING_DETAILS_'.$arSiteInfo[$domain]['crawling-details'])?></small>
<?
	}
?></td>
	</tr>
	<tr>
		<td valign="top"><?=Loc::getMessage('SEO_YANDEX_VIRUSED')?>:</td>
		<td><b><?=$arSiteInfo[$domain]['virused'] ? '<span style="color:red">'.Loc::getMessage('MAIN_YES').'</span>' : '<span style="color:green">'.Loc::getMessage('MAIN_NO').'</span>'?></b></td>
	</tr>
<?
	if(isset($arSiteInfo[$domain]['url-count']))
	{
?>
	<tr>
		<td><?=Loc::getMessage('SEO_YANDEX_URL_COUNT')?>:</td>
		<td><?=$arSiteInfo[$domain]['url-count']?></td>
	</tr>
<?
	}
	if(isset($arSiteInfo[$domain]['url-errors']))
	{
?>
	<tr>
		<td><?=Loc::getMessage('SEO_YANDEX_URL_ERRORS')?>:</td>
		<td><?=$arSiteInfo[$domain]['url-errors']?></td>
	</tr>
<?
	}
	if(isset($arSiteInfo[$domain]['index-count']))
	{
?>
	<tr>
		<td><?=Loc::getMessage('SEO_YANDEX_INDEX_COUNT')?>:</td>
		<td><?=$arSiteInfo[$domain]['index-count']?></td>
	</tr>
<?
	}
	if(isset($arSiteInfo[$domain]['internal-links-count']))
	{
?>
	<tr>
		<td><?=Loc::getMessage('SEO_YANDEX_INTERNAL_LINKS_COUNT')?>:</td>
		<td><?=$arSiteInfo[$domain]['internal-links-count']?></td>
	</tr>
<?
	}
	if(isset($arSiteInfo[$domain]['links-count']))
	{
?>
	<tr>
		<td><?=Loc::getMessage('SEO_YANDEX_LINKS_COUNT')?>:</td>
		<td><?=$arSiteInfo[$domain]['links-count']?></td>
	</tr>
<?
	}
?>
	<tr>
		<td colspan="2" align="center"><?=BeginNote()?><a href="http://webmaster.yandex.ru/" target="_blank"><?=Loc::getMessage('SEO_YANDEX_WEBMASTER_TOOLS_LINK')?></a><?=EndNote()?></td>
	</tr>
<?
}
else
{
?>
<tr>
	<td></td><td><?=BeginNote(),Loc::getMessage('SEO_ERROR_NO_INFO', array("#DOMAIN#" => $siteDomainEncView)),EndNote()?></td>
</tr>
<?
}

$tabControl->BeginNextTab();
?>
<tr>
	<td><div id="seo_yandex_top-queries" align="center"><?=BeginNote(),Loc::getMessage('SEO_LOADING'),EndNote();?></div></td>
</tr>
<?
$tabControl->BeginNextTab();
?>
<tr>
	<td><div id="seo_yandex_crawling" align="center"><?=BeginNote(),Loc::getMessage('SEO_LOADING'),EndNote();?></div></td>
</tr>
<?
$tabControl->BeginNextTab();
?>
<tr>
	<td><div id="seo_yandex_original_texts" align="center"><?=BeginNote(),Loc::getMessage('SEO_LOADING'),EndNote();?></div></td>
</tr><tr>
	<td align="center"><?=BeginNote(),Loc::getMessage('SEO_DETAIL_ORIGINAL_HINT'),EndNote();?></td>
</tr>
<?
$tabControl->End();
?>
<script type="text/javascript">
function BXLoadInfo(action)
{
	BX.ajax.loadJSON(
		'/bitrix/tools/seo_yandex.php?action='+action+'&domain=<?=urlencode($arDomain['DOMAIN'])?>&dir=<?=urlencode($arDomain['SITE_DIR'])?>&<?=bitrix_sessid_get()?>',
		function(res)
		{
			var node = BX('seo_yandex_' + action);
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
						case 'original_texts':
							if(res.total > 0)
							{
								s += '<table class="internal" width="70%"><tr><td width="50%" align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_ORIGINAL_TOTAL'))?>:</td><td width="50%"><b>'+res.total+'</b></td></tr><tr><td align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_ORIGINAL_CAN_ADD'))?>:</td><td><b>'+(res['can-add'] == 'true' ? '<?=CUtil::JSEscape(Loc::getMessage('MAIN_YES'))?>' : '<?=CUtil::JSEscape(Loc::getMessage('MAIN_NO'))?>')+'</b></td></tr><tr><td valign="top" colspan="2"><ol>';

								for(i = 0; i < res.text.length; i++)
								{
									s += '<li>'+BX.util.htmlspecialchars(res.text[i].content)+'</li>';
								}

								s += '</ol></td></tr></table>';
							}
							else
							{
								s += '<b><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_ORIGINAL_EMPTY'))?></b>';
							}
						break;
						case 'top-queries':

							s += '<table class="internal" width="70%"><tr><td width="50%" align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOTAL_SHOWS_COUNT'))?>:</td><td width="50%"><b>'+res['total-shows-count']+'</b></td></tr><tr><td align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_SHOWS_PERCENT'))?>:</td><td><b>'+res['top-shows-percent']+'%</b></td></tr><tr><td align="right" valign="top"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_SHOWS'))?>:</td><td>';

							if(res['top-shows'].length > 0)
							{
								s += '<ol style="margin:0">';
								for(i = 0; i < res['top-shows'].length; i++)
								{
									s += '<li><b>'+BX.util.htmlspecialchars(res['top-shows'][i].query)+'</b> (<?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_SHOWS_COUNT'))?>: '+BX.util.htmlspecialchars(res['top-shows'][i].count)+', <?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_POSITION'))?>: '+BX.util.htmlspecialchars(res['top-shows'][i].position)+')</li>';
								}
								s += '</ol>';
							}
							else
							{
								s += '<b><?=CUtil::JSEscape(Loc::getMessage('MAIN_NO'))?></b>';
							}

							s += '</td></tr></table><br /><br />';



							s += '<table class="internal" width="70%"><tr><td width="50%" align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOTAL_CLICKS_COUNT'))?>:</td><td width="50%"><b>'+res['total-clicks-count']+'</b></td></tr><tr><td align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_CLICKS_PERCENT'))?>:</td><td><b>'+res['top-clicks-percent']+'%</b></td></tr><tr><td align="right" valign="top"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_CLICKS'))?>:</td><td>';

							if(res['top-clicks'].length > 0)
							{
								s += '<ol style="margin:0">';
								for(i = 0; i < res['top-clicks'].length; i++)
								{
									s += '<li><b>'+BX.util.htmlspecialchars(res['top-clicks'][i].query)+'</b> (<?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_CLICKS_COUNT'))?>: '+BX.util.htmlspecialchars(res['top-clicks'][i].count)+', <?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_TOP_POSITION'))?>: '+BX.util.htmlspecialchars(res['top-clicks'][i].position)+')</li>';
								}
								s += '</ol>';
							}
							else
							{
								s += '<b><?=CUtil::JSEscape(Loc::getMessage('MAIN_NO'))?></b>';
							}


							s += '</td></tr></table>';

						break;
						case 'crawling':

							if(res.excluded.count > 0)
							{
								s += '<table class="internal" width="70%">';
								s += '<tr><td width="50%" align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_CRAWL_ISSUES'))?>:</td><td width="50%">'+BX.util.htmlspecialchars(res.excluded['count'])+'</td></tr><tr><td colspan="2" align="center"><table class="internal"><tr><td align="right"><b><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_CRAWL_ISSUES_CODE'))?></b></td><td><b><?=CUtil::JSEscape(Loc::getMessage('SEO_DETAIL_CRAWL_ISSUES_COUNT'))?></b></td></tr>';

								for(i = 0; i < res.excluded.errors.length; i++)
								{
									s += '<tr><td align="right">'+BX.util.htmlspecialchars(res.excluded.errors[i].code)+'</td><td>'+BX.util.htmlspecialchars(res.excluded.errors[i].count)+'</td></tr>';
								}

								s += '</table></td></tr></table><br /><br />';
							}

							s += '<table class="internal" width="70%">';
							s += '<tr><td width="50%" align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_YANDEX_INDEX_COUNT'))?>:</td><td width="50%">'+BX.util.htmlspecialchars(res.indexed['index-count'])+'</td></tr>';

							s += '<tr><td valign="top" align="right"><?=CUtil::JSEscape(Loc::getMessage('SEO_YANDEX_LAST_WEEK_INDEX'))?>:</td><td>';

							if(res.indexed['last-week-index-urls'].length > 0)
							{
								s += '<ol style="margin: 0">';
								for(i = 0; i < res.indexed['last-week-index-urls'].length; i++)
								{
									var q = BX.util.htmlspecialchars(res.indexed['last-week-index-urls'][i]);
									s += '<li><a href="'+q+'">'+q+'</a></li>';
								}
								s += '</ol>';
							}
							else
							{
								s += '<b><?=CUtil::JSEscape(Loc::getMessage('MAIN_NO'))?></b>';
							}

							s += '</td></tr></table>';

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