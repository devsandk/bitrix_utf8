<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/prolog.php");
define("HELP_FILE", "settings/composite.php");
require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/classes/general/cache_html.php");
/** @var CUser $USER */
/** @var CMain $APPLICATION */

IncludeModuleLangFile(__FILE__);

$isAdmin = $USER->CanDoOperation('cache_control');
if(!$USER->CanDoOperation('cache_control') && !$USER->CanDoOperation('view_other_settings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$APPLICATION->SetAdditionalCSS("/bitrix/panel/main/composite.css");
$APPLICATION->AddHeadString("<style type=\"text/css\">".\Bitrix\Main\Page\Frame::getInjectedCSS()."</style>");

$aTabs = array(
	array(
		"DIV" => "edit1",
		"TAB" => GetMessage("MAIN_COMPOSITE_TAB"),
		"ICON" => "main_settings",
		"TITLE" => GetMessage("MAIN_COMPOSITE_TAB_TITLE"),
	),
	array(
		"DIV" => "edit2",
		"TAB" => GetMessage("MAIN_COMPOSITE_TAB_GROUPS"),
		"ICON" => "main_settings",
		"TITLE" => GetMessage("MAIN_COMPOSITE_TAB_GROUPS_TITLE"),
	),
	array(
		"DIV" => "edit3",
		"TAB" => GetMessage("MAIN_COMPOSITE_BANNER_SEP"),
		"ICON" => "main_banner",
		"TITLE" => GetMessage("MAIN_COMPOSITE_BANNER_SEP")." &quot;".GetMessage("COMPOSITE_BANNER_TEXT")."&quot;",
	),
);
$tabControl = new CAdminTabControl("tabControl", $aTabs, true, true);

if (
	$_SERVER["REQUEST_METHOD"] == "POST"
	&& check_bitrix_sessid()
	&& $isAdmin
	&& (
		(isset($_REQUEST["composite_save_opt"]) && strlen($_REQUEST["composite_save_opt"]) > 0)
		|| (isset($_REQUEST["composite_siteb"]) && strlen($_REQUEST["composite_siteb"]) > 0)
	)
)
{
	$arHTMLCacheOptions = CHTMLPagesCache::getOptions();
	$arHTMLCacheOptions["INCLUDE_MASK"] = $_REQUEST["composite_include_mask"];
	$arHTMLCacheOptions["EXCLUDE_MASK"] = $_REQUEST["composite_exclude_mask"];
	$arHTMLCacheOptions["NO_PARAMETERS"] = $_REQUEST["composite_no_parameters"];
	$arHTMLCacheOptions["ONLY_PARAMETERS"] = $_REQUEST["composite_only_parameters"];
	$arHTMLCacheOptions["FILE_QUOTA"] = $_REQUEST["composite_quota"];
	$arHTMLCacheOptions["BANNER_BGCOLOR"] = $_REQUEST["composite_banner_bgcolor"];
	$arHTMLCacheOptions["BANNER_STYLE"] = $_REQUEST["composite_banner_style"];
	$arHTMLCacheOptions["ALLOW_HTTPS"] = $_REQUEST["composite_allow_https"];

	if (isset($arHTMLCacheOptions["STORAGE"])
		&& isset($_REQUEST["composite_storage"])
		&& $arHTMLCacheOptions["STORAGE"] !== $_REQUEST["composite_storage"]
	)
	{
		CHTMLPagesCache::writeStatistic(false, false, false, false, false);
	}

	$storage = $_REQUEST["composite_storage"];
	if ( ($storage === "memcached" || $storage === "memcached_cluster") && extension_loaded("memcache"))
	{
		$arHTMLCacheOptions["MEMCACHED_HOST"] = $_REQUEST["composite_memcached_host"];
		$arHTMLCacheOptions["MEMCACHED_PORT"] = $_REQUEST["composite_memcached_port"];

		if (defined("BX_CLUSTER_GROUP"))
		{
			$arHTMLCacheOptions["MEMCACHED_CLUSTER_GROUP"] = BX_CLUSTER_GROUP;
		}
	}
	else
	{
		$storage = "files";
	}

	$arHTMLCacheOptions["STORAGE"] = $storage;

	if (isset($_REQUEST["group"]) && is_array($_REQUEST["group"]))
	{
		$arHTMLCacheOptions["GROUPS"] = array();
		$b = "";
		$o = "";
		$rsGroups = CGroup::GetList($b, $o, array());
		while ($arGroup = $rsGroups->Fetch())
		{
			if ($arGroup["ID"] > 2)
			{
				if (in_array($arGroup["ID"], $_REQUEST["group"]))
				{
					$arHTMLCacheOptions["GROUPS"][] = $arGroup["ID"];
				}
			}
		}
	}

	if (isset($_REQUEST["composite_domains"]) && strlen($_REQUEST["composite_domains"]) > 0)
	{
		$arHTMLCacheOptions["DOMAINS"] = array();
		foreach(explode("\n", $_REQUEST["composite_domains"]) as $domain)
		{
			$domain = trim($domain, " \t\n\r");
			if ($domain != "")
			{
				$arHTMLCacheOptions["DOMAINS"][$domain] = $domain;
			}
		}
	}

	if (isset($_REQUEST["composite_siteb"]) && isset($_REQUEST["composite_on"]))
	{
		if ($_REQUEST["composite_on"] == "N")
		{
			$arHTMLCacheOptions["COMPOSITE"] = "N";
			CHTMLPagesCache::setEnabled(false);
		}
		elseif ($_REQUEST["composite_on"] == "Y")
		{
			$arHTMLCacheOptions["COMPOSITE"] = "Y";
			CHTMLPagesCache::setEnabled(true);
		}
	}

	CHTMLPagesCache::setOptions($arHTMLCacheOptions);
	bx_accelerator_reset();
	LocalRedirect("/bitrix/admin/composite.php?lang=".LANGUAGE_ID."&".$tabControl->ActiveTabParam());
}

if (
	$_SERVER["REQUEST_METHOD"] == "POST"
	&& isset($_REQUEST["welcome_screen"])
	&& strlen($_REQUEST["welcome_screen"]) > 0
	&& check_bitrix_sessid()
	&& $isAdmin
)
{
	COption::SetOptionString("main", "composite_welcome_screen", "N");
	LocalRedirect("/bitrix/admin/composite.php?lang=".LANGUAGE_ID."&".$tabControl->ActiveTabParam());
}

if (
	$_SERVER["REQUEST_METHOD"] == "POST"
	&& isset($_REQUEST["check_connection"])
	&& $_REQUEST["check_connection"] === "Y"
	&& check_bitrix_sessid()
	&& $isAdmin
)
{
	$host = isset($_REQUEST["host"]) ? $_REQUEST["host"] : "";
	$port = isset($_REQUEST["port"]) ? $_REQUEST["port"] : "";

	$status = "";
	$text = "";
	if (!extension_loaded("memcache"))
	{
		$text = GetMessage("MAIN_COMPOSITE_CHECK_CONNECTION_ERR1");
		$status = "error";
	}
	elseif (strlen($host) > 0 && strlen($port) > 0 && ($memcached = new \Memcache()) && @$memcached->connect($host, $port))
	{
		$text = GetMessage("MAIN_COMPOSITE_CHECK_CONNECTION_OK");
		$status = "success";
	}
	else
	{
		$text = GetMessage("MAIN_COMPOSITE_CHECK_CONNECTION_ERR2");
		$status = "error";
	}

	header("Content-Type: application/x-javascript; charset=".LANG_CHARSET);
	die("{ status : '".$status."', text : '".$text."' }");
}

$APPLICATION->SetTitle(GetMessage("MAIN_COMPOSITE_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$arHTMLCacheOptions = CHTMLPagesCache::getOptions();
if (COption::GetOptionString("main", "composite_welcome_screen", "Y") === "Y"):
	$APPLICATION->SetTitle(GetMessage("MAIN_COMPOSITE_TITLE"));
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	?>
<div class="comp-container">
	<div class="comp-wrap">
		<div class="comp-title"><?=GetMessage("MAIN_COMPOSITE_TITLE")?></div>
		<div class="comp-left-block"><?=GetMessage("MAIN_COMPOSITE_ACCELERATION")?></div>
		<div class="comp-right-block">
			<div class="comp-right-item comp-right-item-green">HTML</div>
			<div class="comp-right-item comp-right-item-blue">CSS</div>
			<div class="comp-right-item comp-right-item-red">JavaScript</div>
			<div class="comp-right-item comp-right-item-orange"><?=GetMessage("MAIN_COMPOSITE_IMAGES")?></div>
			<div class="comp-right-item comp-right-item-yellow"><?=GetMessage("MAIN_COMPOSITE_DYNAMIC_DATA")?></div>
		</div>
		<div class="comp-img-wrap"><img class="comp-img" src="/bitrix/panel/main/images/composite/composite-img.png" alt=""/></div>

		<? if ($isAdmin):?>
		<div class="comp-btn-wrap">
			<form method="POST" name="composite_form" action="<?echo $APPLICATION->GetCurPage()?>">
				<input type="hidden" name="welcome_screen" value="N">
				<?echo bitrix_sessid_post()?>
				<input type="hidden" name="lang" value="<?echo LANGUAGE_ID?>">
			</form>
			<span class="comp-btn" onclick="document.forms['composite_form'].submit();">
				<span class="comp-btn-inner"><?=GetMessage("MAIN_COMPOSITE_LETS_GET_STARTED")?></span>
			</span>
		</div>
		<?endif?>

		<div class="comp-second-title"><?=GetMessage("MAIN_COMPOSITE_SLOGAN")?></div>
		<div class="comp-text"><?=GetMessage("MAIN_COMPOSITE_DESCRIPTION")?></div>
		<div class="comp-icons-block-wrap">
			<span class="comp-icon-block comp-icon-speed">
				<span class="comp-icon"></span>
				<span class="comp-icon-text"><?=GetMessage("MAIN_COMPOSITE_X100_FEATURE")?></span>
			</span><span class="comp-icon-block comp-icon-search">
			<span class="comp-icon"></span>
			<span class="comp-icon-text"><?=GetMessage("MAIN_COMPOSITE_X100_RANKING")?></span>
		</span><span class="comp-icon-block comp-icon-money">
			<span class="comp-icon"></span>
			<span class="comp-icon-text"><?=GetMessage("MAIN_COMPOSITE_X100_CONVERSION")?></span>
		</span>
		</div>
	</div>
</div>

	<?
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
endif;

$warning = GetMessage("MAIN_COMPOSITE_WARNING_EDUCATION");
if (!empty($warning) && $warning != "-")
{
	echo BeginNote();
	echo $warning;
	echo EndNote();
}

?>
<form method="POST" name="composite_form" action="<?echo $APPLICATION->GetCurPage()?>">
<?
$tabControl->Begin();
$tabControl->BeginNextTab();
?>
<tr>
	<td valign="top" colspan="2" align="left">
		<?
		if(ini_get_bool("session.use_trans_sid")):?>
			<div style="color:red;"><b><?echo GetMessage("MAIN_COMPOSITE_WARNING_TRANSID")?></b></div><br>
		<?endif?>

		<?if(CHTMLPagesCache::IsOn() && $arHTMLCacheOptions["COMPOSITE"] === "Y"):?>
			<div style="color:green;"><b><?echo GetMessage("MAIN_COMPOSITE_ON")?>.</b></div><br>
			<input type="hidden" name="composite_on" value="N">
			<input type="submit" name="composite_siteb" value="<?echo GetMessage("MAIN_COMPOSITE_BUTTON_OFF")?>"<?if(!$isAdmin || (defined("FIRST_EDITION") && FIRST_EDITION=="Y")) echo " disabled"?>>
		<?else:?>
			<div style="color:red;"><b><?echo GetMessage("MAIN_COMPOSITE_OFF")?>.</b></div><br>
			<input type="hidden" name="composite_on" value="Y">
			<input type="submit" name="composite_siteb" value="<?echo GetMessage("MAIN_COMPOSITE_BUTTON_ON")?>"<?if(!$isAdmin) echo " disabled"?> class="adm-btn-save">
		<?endif?>

	</td>
</tr>

<tr class="heading">
	<td colspan="2"><?echo GetMessage("MAIN_COMPOSITE_STORAGE_TITLE");?></td>
</tr>
<?
$storages = array(
	"files" => array(
		"name" => GetMessage("MAIN_COMPOSITE_STORAGE_FILES")
	),

	"memcached" => array(
		"name" => "memcached",
		"extension" => "memcache"
	),

	"memcached_cluster" => array(
		"name" => "memcached cluster",
		"extension" => "memcache",
		"module" => "cluster"
	),
);

$currentStorage = "files";
if (isset($arHTMLCacheOptions["STORAGE"]) && array_key_exists($arHTMLCacheOptions["STORAGE"], $storages))
{
	$currentStorage = $arHTMLCacheOptions["STORAGE"];
}

//Defaults for memcached
if (!isset($arHTMLCacheOptions["MEMCACHED_HOST"]))
{
	$arHTMLCacheOptions["MEMCACHED_HOST"] = "localhost";
}

if (!isset($arHTMLCacheOptions["MEMCACHED_PORT"]))
{
	$arHTMLCacheOptions["MEMCACHED_PORT"] = "11211";
}
?>
<tr>
	<td><?echo GetMessage("MAIN_COMPOSITE_STORAGE");?>:</td>
	<td>
		<script type="text/javascript">
			function onStorageSelect(select)
			{
				var hostRow = BX("composite_memcached_host_row", true);
				var portRow = BX("composite_memcached_port_row", true);
				var hintRow = BX("composite_memcached_hint_row", true);
				var clusterRow = BX("composite_cluster_hint_row", true);
				var quotaRow = BX("composite_quota_row", true);
				var quotaStatRow = BX("composite_quota_stat_row", true);
				var quotaSizeRow = BX("composite_quota_size_row", true);
				if (select.value === "memcached")
				{
					hostRow.style.cssText = "";
					portRow.style.cssText = "";
					hintRow.style.cssText = "";
				}
				else
				{
					hostRow.style.display = "none";
					portRow.style.display = "none";
					hintRow.style.display = "none";
				}

				if (select.value === "memcached_cluster")
				{
					clusterRow.style.cssText = "";
				}
				else
				{
					clusterRow.style.display = "none";
				}

				if (select.value !== "files")
				{
					quotaRow.style.display = "none";
					quotaStatRow && (quotaStatRow.style.display = "none");
					quotaSizeRow && (quotaSizeRow.style.display = "none");
				}
				else
				{
					quotaRow.style.cssText = "";
					quotaStatRow && (quotaStatRow.style.cssText = "");
					quotaSizeRow && (quotaSizeRow.style.cssText = "");
				}
			}
		</script>
		<select name="composite_storage" id="composite_storage" style="width:300px;" onchange="onStorageSelect(this)">
			<?
			foreach ($storages as $storageId => $storage):
				$disabled = "";
				$nameDesc = "";
				$selected = $currentStorage == $storageId ? " selected" : "";
				if (isset($storage["module"]) && !\Bitrix\Main\ModuleManager::isModuleInstalled($storage["module"]))
				{
					$disabled = " disabled";
					$nameDesc = " (".GetMessage("MAIN_COMPOSITE_MODULE_ERROR", array("#MODULE#" => $storage["module"])).")";
				}
				elseif (isset($storage["extension"]) && strlen($storage["extension"]) > 0 && !extension_loaded($storage["extension"]))
				{
					$disabled = " disabled";
					$nameDesc = " (".GetMessage("MAIN_COMPOSITE_EXT_ERROR", array("#EXTENSION#" => $storage["extension"])).")";
				}

				?>
				<option value="<?=htmlspecialcharsbx($storageId)?>"<?=$selected?><?=$disabled?>><?=htmlspecialcharsbx($storage["name"])?><?=$nameDesc?></option>
			<?endforeach?>
		</select>
	</td>
</tr>
<tr id="composite_memcached_host_row" <?if ($arHTMLCacheOptions["STORAGE"] !== "memcached") echo 'style="display:none"'?>>
	<td class="adm-required-field"><?echo GetMessage("MAIN_COMPOSITE_MEMCACHED_HOST");?>:</td>
	<td>
		<input type="text" size="45" style="width:300px" name="composite_memcached_host" value="<?echo htmlspecialcharsbx($arHTMLCacheOptions["MEMCACHED_HOST"])?>">
	</td>
</tr>

<tr id="composite_memcached_port_row" <?if ($arHTMLCacheOptions["STORAGE"] !== "memcached") echo 'style="display:none"'?>>
	<td class="adm-required-field"><?echo GetMessage("MAIN_COMPOSITE_MEMCACHED_PORT");?>:</td>
	<td>
		<input type="text" size="45" style="width:50px" name="composite_memcached_port" value="<?echo htmlspecialcharsbx($arHTMLCacheOptions["MEMCACHED_PORT"])?>">

	</td>
</tr>
<tr id="composite_memcached_hint_row" <?if ($arHTMLCacheOptions["STORAGE"] !== "memcached") echo 'style="display:none"'?>>
	<td class="adm-required-field"></td>
	<td>
		<script type="text/javascript">
			function checkConnection()
			{
				BX.ajax({
					method: "POST",
					dataType: 'json',
					url: window.location.href,
					data: {
						sessid : BX.bitrix_sessid(),
						check_connection : "Y",
						host : document.forms["composite_form"].elements["composite_memcached_host"].value,
						port : document.forms["composite_form"].elements["composite_memcached_port"].value
					},
					onsuccess: function(result) {
						var status = BX("check_connection_status");
						if (result && result.text)
						{
							var color = "green";
							if (result.status && result.status === "error")
							{
								color = "red";
							}

							status.style.color = color;
							status.innerHTML = result.text;
						}
					}
				});
			}
		</script>
		<input type="button" name="" value="<?=GetMessage("MAIN_COMPOSITE_CHECK_CONNECTION")?>" onclick="checkConnection()" />&nbsp;<span id="check_connection_status"></span><br><br><br>
		<?=GetMessage("MAIN_COMPOSITE_HOST_HINT");?>
	</td>
</tr>
<tr id="composite_cluster_hint_row" <?if ($arHTMLCacheOptions["STORAGE"] !== "memcached_cluster") echo 'style="display:none"'?>>
	<td class="adm-required-field"></td>
	<td><?=GetMessage("MAIN_COMPOSITE_CLUSTER_HINT", array(
			"#A_START#" => "<a href=\"/bitrix/admin/cluster_memcache_list.php?lang=".LANGUAGE_ID."&group_id=".(defined("BX_CLUSTER_GROUP") ? BX_CLUSTER_GROUP : 1)."\">",
			"#A_END#" => "</a>"
		));?></td>
</tr>

<tr class="heading">
	<td colspan="2"><?echo GetMessage("MAIN_COMPOSITE_OPT");?></td>
</tr>
<?
if (!is_array($arHTMLCacheOptions["DOMAINS"]) || count($arHTMLCacheOptions["DOMAINS"]) < 1)
{
	$arHTMLCacheOptions["DOMAINS"] = array(CHTMLPagesCache::getHttpHost());
}
?>
<tr class="adm-detail-valign-top">
	<td width="40%" class="adm-required-field"><?echo GetMessage("MAIN_COMPOSITE_DOMAINS");?>:</td>
	<td width="60%">
		<textarea name="composite_domains" rows="5" style="width:100%"><?echo htmlspecialcharsEx(implode("\n",$arHTMLCacheOptions["DOMAINS"]))?></textarea><br>
		<input type="checkbox" name="composite_allow_https" id="composite_allow_https" value="Y" <?if ($arHTMLCacheOptions["ALLOW_HTTPS"] === "Y") echo 'checked="checked"'?>>&nbsp;<label for="composite_allow_https"><?echo GetMessage("MAIN_COMPOSITE_ALLOW_HTTPS");?></label>
	</td>
</tr>
<tr class="adm-detail-valign-top">
	<td width="40%"><?echo GetMessage("MAIN_COMPOSITE_INC_MASK");?>:</td>
	<td width="60%">
		<textarea name="composite_include_mask" rows="5" style="width:100%"><?echo htmlspecialcharsEx($arHTMLCacheOptions["INCLUDE_MASK"])?></textarea>
	</td>
</tr>
<tr class="adm-detail-valign-top">
	<td><?echo GetMessage("MAIN_COMPOSITE_EXC_MASK");?>:</td>
	<td>
		<textarea name="composite_exclude_mask" rows="5" style="width:100%"><?echo htmlspecialcharsEx($arHTMLCacheOptions["EXCLUDE_MASK"])?></textarea>
	</td>
</tr>
<tr>
	<td><label for="composite_no_parameters"><?echo GetMessage("MAIN_COMPOSITE_NO_PARAMETERS");?>:</label></td>
	<td>
		<input type="hidden" name="composite_no_parameters" value="N">
		<input type="checkbox" name="composite_no_parameters" onclick="onParamsCheckboxClick(this.checked)" id="composite_no_parameters" value="Y" <?if ($arHTMLCacheOptions["NO_PARAMETERS"] === "Y") echo 'checked="checked"'?>>
	</td>
</tr>
<tr id="composite_only_parameters" <?if ($arHTMLCacheOptions["NO_PARAMETERS"] !== "Y") echo 'style="display:none"'?>>
	<td><?echo GetMessage("MAIN_COMPOSITE_ONLY_PARAMETERS");?>:</td>
	<td>
		<input type="text" size="45" style="width:100%" name="composite_only_parameters" value="<?echo htmlspecialcharsbx($arHTMLCacheOptions["ONLY_PARAMETERS"])?>">
	</td>
</tr>
<tr id="composite_quota_row" <?if ($arHTMLCacheOptions["STORAGE"] !== "files") echo 'style="display:none"'?>>
	<td><?echo GetMessage("MAIN_COMPOSITE_QUOTA");?>:</td>
	<td>
		<input type="text" size="8" name="composite_quota" value="<?echo intval($arHTMLCacheOptions["FILE_QUOTA"])?>">
	</td>
</tr>
<?
if(CHTMLPagesCache::IsOn())
{
	$arStatistic = CHTMLPagesCache::readStatistic();?>
	<tr id="composite_quota_stat_row" <?if ($arHTMLCacheOptions["STORAGE"] !== "files") echo 'style="display:none"'?>>
		<td><?echo GetMessage("MAIN_COMPOSITE_HITS_WITHOUT_CACHE")?></td>
		<td><?echo $arStatistic["QUOTA"]?></td>
	</tr>
	<tr id="composite_quota_size_row" <?if ($arHTMLCacheOptions["STORAGE"] !== "files") echo 'style="display:none"'?>>
		<td><?echo GetMessage("MAIN_COMPOSITE_STAT_FILE_SIZE")?></td>
		<td><?echo CFile::FormatSize($arStatistic["FILE_SIZE"])?></td>
	</tr>
	<?
}
?>
<tr>
	<td></td>
	<td>
		<a href="/bitrix/admin/cache.php?lang=<?=LANGUAGE_ID?>&cachetype=html&tabControl_active_tab=fedit2"><?=GetMessage("MAIN_COMPOSITE_CLEAR_CACHE")?></a>
	</td>
</tr>

<?
$tabControl->BeginNextTab();
$arUsedGroups = array();
$groups = $arHTMLCacheOptions["GROUPS"];
$arGROUPS = array();
$b = "";
$o = "";
$rsGroups = CGroup::GetList($b, $o, array("ACTIVE"=>"Y", "ADMIN"=>"N", "ANONYMOUS"=>"N"));
while ($arGroup = $rsGroups->Fetch())
{
	$arGROUPS[] = $arGroup;
}

if(is_array($groups))
{
	foreach($groups as $group)
	{
		?>
		<tr>
			<td>
				<select name="group[]">
					<option value=""><? echo GetMessage("MAIN_NO") ?></option>
					<?
					foreach ($arGROUPS as $arGroup)
					{
						?>
						<option
							value="<? echo htmlspecialcharsbx($arGroup["ID"]) ?>"
							<? echo $group == $arGroup["ID"] ? 'selected="selected"' : '' ?>
							><? echo htmlspecialcharsEx($arGroup["NAME"] . " [" . $arGroup["ID"] . "]") ?></option>
					<?
					}
					?>
				</select>
			</td>
		</tr>
	<?
	}
}
?>
	<tr id="groups-select">
		<td>
			<select name="group[]">
				<option value=""><? echo GetMessage("MAIN_NO") ?></option>
				<?
				foreach ($arGROUPS as $arGroup)
				{
					?>
					<option
						value="<? echo htmlspecialcharsbx($arGroup["ID"]) ?>"
						><? echo htmlspecialcharsEx($arGroup["NAME"] . " [" . $arGroup["ID"] . "]") ?></option>
				<?
				}
				?>
			</select>
		</td>
	</tr>
	<tr id="groups-add">
		<td>
			<br><a class="bx-action-href" href="javascript:addGroups()"><?echo GetMessage("MAIN_ADD")?></a>
			<script>
				function addGroups()
				{
					var groupsSelect = BX('groups-select');
					var row = BX.clone(groupsSelect);
					groupsSelect.parentNode.insertBefore(row, BX('groups-add'));
				}
			</script>
		</td>
	</tr>
	<?
$tabControl->BeginNextTab();?>

<tr>
	<td colspan="2">
		<?=BeginNote()?><?=GetMessage("MAIN_COMPOSITE_BANNER_DISCLAIMER")?><?=EndNote()?>
	</td>
</tr>

<tr class="adm-detail-valign-top">
	<td><?=GetMessage("MAIN_COMPOSITE_BANNER_SELECT_STYLE")?>:</td>
	<td>
		<div class="adm-composite-btn-wrap">
			<div class="adm-composite-btn-select-wrap">
			<span class="adm-composite-btn-select" onclick="showPopup(this)">
				<span id="composite-banner" class="bx-composite-btn bx-btn-white"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
				<span class="adm-composite-btn-select-icon"></span>
			</span>
			<span class="adm-composite-btn-checkbox-wrap">
				<input type="checkbox" id="composite_white_bgcolor" class="adm-composite-btn-checkbox" onclick="setWhiteBgColor(this.checked)"/><label class="adm-composite-btn-label-bg" for="composite_white_bgcolor"><?=GetMessage("MAIN_COMPOSITE_BANNER_STYLE_WHITE")?></label>
			</span>

			</div>
			<div class="adm-composite-btn-color">
				<div class="adm-composite-btn-label"><?=GetMessage("MAIN_COMPOSITE_BANNER_BGCOLOR")?></div>
				<input type="text" name="composite_banner_bgcolor" id="composite_banner_bgcolor" value="" class="adm-composite-btn-color-inp"/>
			</div>
			<div class="adm-composite-btn-logo-block">
				<div class="adm-composite-btn-label"><?=GetMessage("MAIN_COMPOSITE_BANNER_STYLE")?></div>
				<div class="adm-composite-btn-logo-list">
				<span class="adm-composite-btn-logo">
					<label class="adm-composite-btn-logo-img adm-composite-btn-logo-white" for="composite_banner_style_white"></label><input id="composite_banner_style_white" class="adm-composite-btn-logo-radio" type="radio" name="composite_banner_style" value="white" onclick="changeBannerType(null, 'white')" />
				</span><span class="adm-composite-btn-logo">
					<label class="adm-composite-btn-logo-img adm-composite-btn-logo-grey" for="composite_banner_style_grey"></label><input id="composite_banner_style_grey" class="adm-composite-btn-logo-radio" type="radio" name="composite_banner_style" value="grey" onclick="changeBannerType(null, 'grey')"/>
				</span><span class="adm-composite-btn-logo">
					<label class="adm-composite-btn-logo-img adm-composite-btn-logo-red" for="composite_banner_style_red"></label><input id="composite_banner_style_red" class="adm-composite-btn-logo-radio" type="radio" name="composite_banner_style" value="red" onclick="changeBannerType(null, 'red')" />
				</span><span class="adm-composite-btn-logo">
					<label class="adm-composite-btn-logo-img adm-composite-btn-logo-black" for="composite_banner_style_black"></label><input id="composite_banner_style_black" class="adm-composite-btn-logo-radio" type="radio" name="composite_banner_style" value="black" onclick="changeBannerType(null, 'black')"/>
				</span>
				</div>
			</div>
		</div>

		<div id="btn-popup" class="adm-composite-btn-popup" style="display: none;">
			<span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #000000;" href="#" onclick="selectPreset('#000000', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #e94524;" href="#" onclick="selectPreset('#E94524', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #3a424d;" href="#" onclick="selectPreset('#3A424D', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #d37222;" href="#" onclick="selectPreset('#D37222', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-grey" style="background-color: #dae1e5;" href="#" onclick="selectPreset('#DAE1E5', 'grey')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-grey bx-btn-border" style="background-color: #ffffff;" href="#" onclick="selectPreset('#FFFFFF', 'grey' , true)"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #59b7cf;" href="#" onclick="selectPreset('#59B7CF', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #2f6e73;" href="#" onclick="selectPreset('#2F6E73', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-red bx-btn-border" style="background-color: #ffffff;" href="#" onclick="selectPreset('#FFFFFF', 'red', true)"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #51626b;" href="#" onclick="selectPreset('#51626B', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #83a61a;" href="#" onclick="selectPreset('#83A61A', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-black bx-btn-border" style="background-color: #ffffff;" href="#" onclick="selectPreset('#FFFFFF', 'black', true)"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #b39c85;" href="#" onclick="selectPreset('#B39C85', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #ff8534;" href="#" onclick="selectPreset('#FF8534', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span><span class="adm-composite-btn-popup-wrap">
				<span class="bx-composite-btn bx-btn-white" style="background-color: #51c1ef;" href="#" onclick="selectPreset('#51C1EF', 'white')"><?=GetMessage("COMPOSITE_BANNER_TEXT")?></span>
			</span>
		</div>
		<script type="text/javascript">

			BX.ready(function() {

				var banner = BX("composite-banner");
				var bgcolorInput = BX("composite_banner_bgcolor");
				var whiteRadio = BX("composite_banner_style_white");
				var whiteBgCheckbox = BX("composite_white_bgcolor");
				var radio = document.forms["composite_form"].elements["composite_banner_style"];
				var lastStyle = "";
				var bgColorBeforeBorder = "";
				var styleBeforeBorder = "";

				window.changeBannerType = function(bgcolor, style, border)
				{
					if (border === true)
					{
						styleBeforeBorder = radio.value;
						bgColorBeforeBorder = bgcolorInput.value;

						bgcolorInput.disabled = true;
						whiteRadio.disabled = true;
						whiteBgCheckbox.checked = true;
						BX.addClass(banner, "bx-btn-border");
					}
					else if (border === false)
					{
						bgcolorInput.disabled = false;
						whiteRadio.disabled = false;
						whiteBgCheckbox.checked = false;
						BX.removeClass(banner, "bx-btn-border");
					}

					if (BX.type.isNotEmptyString(bgcolor))
					{
						banner.style.backgroundColor = bgcolor;
						bgcolorInput.value = bgcolor;
					}

					if (BX.type.isNotEmptyString(style))
					{
						BX.removeClass(banner, lastStyle);
						lastStyle = "bx-btn-" + style;
						BX.addClass(banner, lastStyle);
						BX("composite_banner_style_" + style, true).checked = true;
					}
				};

				window.selectPreset = function(bgcolor, style, border)
				{
					changeBannerType(bgcolor, style, border === true);
					window.bannerPopup.close();
				};

				window.onBgColorChanged = function()
				{
					banner.style.backgroundColor = bgcolorInput.value;
				};

				window.setWhiteBgColor = function(border)
				{
					if (border)
					{
						changeBannerType(
							"#FFFFFF",
							lastStyle == "bx-btn-white" || lastStyle == "" ? "red" : null,
							true
						);
					}
					else
					{
						if (bgColorBeforeBorder == "")
						{
							bgColorBeforeBorder = "#E94524";
						}

						if (styleBeforeBorder == "")
						{
							styleBeforeBorder = "white";
						}
						changeBannerType(bgColorBeforeBorder, styleBeforeBorder, false);
					}
				};

				window.showPopup = function(btn)
				{
					window.bannerPopup = BX.PopupWindowManager.create("adm-composite-btn-popup", btn, {
						content: BX("btn-popup"),
						lightShadow: true,
						closeByEsc : true,
						autoHide : true,
						offsetTop : 5
					});
					window.bannerPopup.show();
				};

				window.onParamsCheckboxClick = function(show)
				{
					var tr = BX("composite_only_parameters", true);
					if (show)
					{
						tr.style.cssText = "";
					}
					else
					{
						tr.style.display = "none";
					}
				};

				var bgcolor = "<?=CUtil::JSEscape($arHTMLCacheOptions["BANNER_BGCOLOR"])?>";
				var style = "<?=CUtil::JSEscape($arHTMLCacheOptions["BANNER_STYLE"])?>";
				if (!BX.type.isNotEmptyString(bgcolor))
				{
					bgcolor = "#E94524";
				}

				if (!BX.type.isNotEmptyString(style))
				{
					style = "white";
				}

				changeBannerType(bgcolor, style, BX.util.in_array(bgcolor.toUpperCase(), ["#FFF", "#FFFFFF", "WHITE"]));

				BX.bind(bgcolorInput, "change", onBgColorChanged);
				BX.bind(bgcolorInput, "cut", onBgColorChanged);
				BX.bind(bgcolorInput, "paste", onBgColorChanged);
				BX.bind(bgcolorInput, "drop", onBgColorChanged);
				BX.bind(bgcolorInput, "keyup", onBgColorChanged);
				BX.bind(document.forms["composite_form"], "submit", function() {  bgcolorInput.disabled = false; })
			});

		</script>
	</td>
</tr>

<?$tabControl->Buttons(array(
	"disabled" => !$isAdmin,
	"btnSave" => false,
	"btnApply" => false,
	"btnCancel" => false,
));
?>
	<input type="submit" name="composite_save_opt" class="adm-btn-save" value="<?echo GetMessage("MAIN_COMPOSITE_SAVE");?>"<?if(!$isAdmin) echo " disabled"?>>
<?
$tabControl->End();
?>
<?echo bitrix_sessid_post()?>
	<input type="hidden" name="lang" value="<?echo LANGUAGE_ID?>">
</form>

<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>