<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2013 Bitrix
 */

/**
 * Bitrix vars
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CAdminPage $adminPage
 */

require_once(dirname(__FILE__)."/../include/prolog_admin_before.php");
define("HELP_FILE", "settings/settings/settings.php");

if(!$USER->CanDoOperation('view_other_settings') && !$USER->CanDoOperation('edit_other_settings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

if(strpos($_REQUEST["back_url_settings"], '/') !== 0)
	$_REQUEST["back_url_settings"] = '';

IncludeModuleLangFile(__FILE__);

$arModules = array(
	"main"=>array(
		"PAGE"=>$_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/options.php",
		"NAME"=>GetMessage("MAIN_KERNEL"),
		"SORT"=>-1,
	)
);
$adminPage->Init();
foreach($adminPage->aModules as $module)
{
	if($APPLICATION->GetGroupRight($module) < "R")
		continue;
	if($module == "main")
		continue;
	$ifile = getLocalPath("modules/".$module."/install/index.php");
	$ofile = getLocalPath("modules/".$module."/options.php");
	if($ifile !== false && $ofile !== false)
	{
		$info = CModule::CreateModuleObject($module);
		$arModules[$module]["PAGE"] = $_SERVER["DOCUMENT_ROOT"].$ofile;
		$arModules[$module]["NAME"] = $info->MODULE_NAME;
		$arModules[$module]["SORT"] = $info->MODULE_SORT;
	}
}
uasort($arModules, create_function('$a, $b', 'if($a["SORT"] == $b["SORT"]) return strcasecmp($a["NAME"], $b["NAME"]); return ($a["SORT"] < $b["SORT"])? -1 : 1;'));

$mid = $_REQUEST["mid"];
if($mid == "" || !isset($arModules[$mid]) || !file_exists($arModules[$mid]["PAGE"]))
	$mid = "main";

ob_start();
include($arModules[$mid]["PAGE"]);
$strModuleSettingsTabs = ob_get_contents();
ob_end_clean();

$APPLICATION->SetTitle(GetMessage("MAIN_TITLE"));
require_once ($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");
?>

<form action="">
<select name="mid" onchange="window.location='settings.php?lang=<?=LANGUAGE_ID.($_REQUEST["mid_menu"]<>""? "&amp;mid_menu=1":"")?>&amp;mid='+this[this.selectedIndex].value;">
<?foreach($arModules as $k=>$m):?>
	<option value="<?echo htmlspecialcharsbx($k)?>"<?if($mid == $k) echo " selected"?>><?echo htmlspecialcharsbx($m["NAME"])?></option>
<?endforeach;?>
</select>
</form>
<br />

<?
function __AdmSettingsSaveOptions($module_id, $arOptions)
{
	foreach($arOptions as $arOption)
	{
		__AdmSettingsSaveOption($module_id, $arOption);
	}
}

function __AdmSettingsSaveOption($module_id, $arOption)
{
	if(!is_array($arOption) || isset($arOption["note"]))
		return false;

	if($arOption[3][0] == "statictext" || $arOption[3][0] == "statichtml")
		return false;

	$arControllerOption = CControllerClient::GetInstalledOptions($module_id);

	if(isset($arControllerOption[$arOption[0]]))
		return false;

	$name = $arOption[0];
	$val = $_REQUEST[$name];

	//disabled
	if(!isset($_REQUEST[$name]))
	{
		if($arOption[3][0] == 'checkbox')
			$val = 'N';
		else
			return false;
	}

	if($arOption[3][0] == "checkbox" && $val != "Y")
		$val = "N";
	if($arOption[3][0] == "multiselectbox")
		$val = @implode(",", $val);

	COption::SetOptionString($module_id, $name, $val, $arOption[1]);

	return null;
}

function __AdmSettingsDrawRow($module_id, $Option)
{
	$arControllerOption = CControllerClient::GetInstalledOptions($module_id);
	if(!is_array($Option)):
	?>
		<tr class="heading">
			<td colspan="2"><?=$Option?></td>
		</tr>
	<?
	elseif(isset($Option["note"])):
	?>
		<tr>
			<td colspan="2" align="center">
				<?echo BeginNote('align="center"');?>
				<?=$Option["note"]?>
				<?echo EndNote();?>
			</td>
		</tr>
	<?
	else:
		if ($Option[0] != "")
		{
			$val = COption::GetOptionString($module_id, $Option[0], $Option[2]);
		}
		else
		{
			$val = $Option[2];
		}
		$type = $Option[3];
		$disabled = array_key_exists(4, $Option) && $Option[4] == 'Y' ? ' disabled' : '';
		$sup_text = array_key_exists(5, $Option) ? $Option[5] : '';
	?>
		<tr>
			<td<?if($type[0]=="multiselectbox" || $type[0]=="textarea" || $type[0]=="statictext" || $type[0]=="statichtml") echo ' class="adm-detail-valign-top"'?> width="50%"><?
				if($type[0]=="checkbox")
					echo "<label for='".htmlspecialcharsbx($Option[0])."'>".$Option[1]."</label>";
				else
					echo $Option[1];
				if (strlen($sup_text) > 0)
				{
					?><span class="required"><sup><?=$sup_text?></sup></span><?
				}
					?></td>
			<td width="50%"><?
			if($type[0]=="checkbox"):
				?><input type="checkbox" <?if(isset($arControllerOption[$Option[0]]))echo ' disabled title="'.GetMessage("MAIN_ADMIN_SET_CONTROLLER_ALT").'"';?> id="<?echo htmlspecialcharsbx($Option[0])?>" name="<?echo htmlspecialcharsbx($Option[0])?>" value="Y"<?if($val=="Y")echo" checked";?><?=$disabled?><?if($type[2]<>'') echo " ".$type[2]?>><?
			elseif($type[0]=="text" || $type[0]=="password"):
				?><input type="<?echo $type[0]?>"<?if(isset($arControllerOption[$Option[0]]))echo ' disabled title="'.GetMessage("MAIN_ADMIN_SET_CONTROLLER_ALT").'"';?> size="<?echo $type[1]?>" maxlength="255" value="<?echo htmlspecialcharsbx($val)?>" name="<?echo htmlspecialcharsbx($Option[0])?>"<?=$disabled?><?=($type[0]=="password" || $type["noautocomplete"]? ' autocomplete="off"':'')?>><?
			elseif($type[0]=="selectbox"):
				$arr = $type[1];
				if(!is_array($arr))
					$arr = array();
				?><select name="<?echo htmlspecialcharsbx($Option[0])?>" <?if(isset($arControllerOption[$Option[0]]))echo ' disabled title="'.GetMessage("MAIN_ADMIN_SET_CONTROLLER_ALT").'"';?> <?=$disabled?>><?
					foreach($arr as $key => $v):
						?><option value="<?echo $key?>"<?if($val==$key)echo" selected"?>><?echo htmlspecialcharsbx($v)?></option><?
					endforeach;
					?></select><?
			elseif($type[0]=="multiselectbox"):
				$arr = $type[1];
				if(!is_array($arr))
					$arr = array();
				$arr_val = explode(",",$val);
				?><select size="5" <?if(isset($arControllerOption[$Option[0]]))echo ' disabled title="'.GetMessage("MAIN_ADMIN_SET_CONTROLLER_ALT").'"';?> multiple name="<?echo htmlspecialcharsbx($Option[0])?>[]"<?=$disabled?>><?
					foreach($arr as $key => $v):
						?><option value="<?echo $key?>"<?if(in_array($key, $arr_val)) echo " selected"?>><?echo htmlspecialcharsbx($v)?></option><?
					endforeach;
				?></select><?
			elseif($type[0]=="textarea"):
				?><textarea <?if(isset($arControllerOption[$Option[0]]))echo ' disabled title="'.GetMessage("MAIN_ADMIN_SET_CONTROLLER_ALT").'"';?> rows="<?echo $type[1]?>" cols="<?echo $type[2]?>" name="<?echo htmlspecialcharsbx($Option[0])?>"<?=$disabled?>><?echo htmlspecialcharsbx($val)?></textarea><?
			elseif($type[0]=="statictext"):
				echo htmlspecialcharsbx($val);
			elseif($type[0]=="statichtml"):
				echo $val;
			endif;
			?></td>
		</tr>
	<?
	endif;
}

function __AdmSettingsDrawList($module_id, $arParams)
{
	foreach($arParams as $Option)
	{
		__AdmSettingsDrawRow($module_id, $Option);
	}
}

echo $strModuleSettingsTabs;
require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
