<?php

// admin initialization
define("ADMIN_MODULE_NAME", "highloadblock");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

IncludeModuleLangFile(__FILE__);
IncludeModuleLangFile(__DIR__.'/highloadblock_rows_list.php');

if (!$USER->IsAdmin())
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

if (!CModule::IncludeModule(ADMIN_MODULE_NAME))
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}



use Bitrix\Highloadblock as HL;

$hlblock = null;

// get entity info
if (isset($_REQUEST['ENTITY_ID']))
{
	$hlblock = HL\HighloadBlockTable::getById($_REQUEST['ENTITY_ID'])->fetch();
}

if (empty($hlblock))
{
	// 404
	if ($_REQUEST["mode"] == "list")
	{
		require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_js.php");
	}
	else
	{
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	}

	echo GetMessage('HLBLOCK_ADMIN_ROW_EDIT_NOT_FOUND');

	if ($_REQUEST["mode"] == "list")
	{
		require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin_js.php");
	}
	else
	{
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	}

	die();
}

$is_create_form = true;
$is_update_form = false;

$isEditMode = true;

$errors = array();

// get entity
$entity = HL\HighloadBlockTable::compileEntity($hlblock);

/** @var HL\DataManager $entity_data_class */
$entity_data_class = $entity->getDataClass();

// get row
$row = null;

if (isset($_REQUEST['ID']) && $_REQUEST['ID'] > 0)
{
	$row = $entity_data_class::getById($_REQUEST['ID'])->fetch();

	if (!empty($row))
	{
		$is_update_form = true;
		$is_create_form = false;
	}
	else
	{
		$row = null;
	}
}

if ($is_create_form)
{
	$APPLICATION->SetTitle(GetMessage('HLBLOCK_ADMIN_ENTITY_ROW_EDIT_PAGE_TITLE_NEW', array('#NAME#' => $hlblock['NAME'])));
}
else
{
	$APPLICATION->SetTitle(GetMessage('HLBLOCK_ADMIN_ENTITY_ROW_EDIT_PAGE_TITLE_EDIT',
		array('#NAME#' => $hlblock['NAME'], '#NUM#' => $row['ID']))
	);
}

// form
$aTabs = array(
	array("DIV" => "edit1", "TAB" => $hlblock['NAME'], "ICON"=>"ad_contract_edit", "TITLE"=> $hlblock['NAME'])
);

$tabControl = new CAdminForm("hlrow_edit_".$hlblock['ID'], $aTabs);

// delete action
if ($is_update_form && isset($_REQUEST['action']) && $_REQUEST['action'] === 'delete' && check_bitrix_sessid())
{
	$entity_data_class::delete($row['ID']);

	LocalRedirect("highloadblock_rows_list.php?ENTITY_ID=".$hlblock['ID']."&lang=".LANGUAGE_ID);
}

// save action
if ((strlen($save)>0 || strlen($apply)>0) && $REQUEST_METHOD=="POST" && check_bitrix_sessid())
{
	$data = array();

	$USER_FIELD_MANAGER->EditFormAddFields('HLBLOCK_'.$hlblock['ID'], $data);

	/** @param Bitrix\Main\Entity\AddResult $result */
	if ($is_update_form)
	{
		$ID = intval($_REQUEST['ID']);
		$result = $entity_data_class::update($ID, $data);
	}
	else
	{
		$result = $entity_data_class::add($data);
		$ID = $result->getId();
	}

	if($result->isSuccess())
	{
		if (strlen($save)>0)
		{
			LocalRedirect("highloadblock_rows_list.php?ENTITY_ID=".$hlblock['ID']."&lang=".LANGUAGE_ID);
		}
		else
		{
			LocalRedirect("highloadblock_row_edit.php?ENTITY_ID=".$hlblock['ID']."&ID=".intval($ID)."&lang=".LANGUAGE_ID."&".$tabControl->ActiveTabParam());
		}
	}
	else
	{
		$errors = $result->getErrorMessages();
	}
}

// menu
$aMenu = array(
	array(
		"TEXT"	=> GetMessage('HLBLOCK_ADMIN_ROWS_RETURN_TO_LIST_BUTTON'),
		"TITLE"	=> GetMessage('HLBLOCK_ADMIN_ROWS_RETURN_TO_LIST_BUTTON'),
		"LINK"	=> "highloadblock_rows_list.php?ENTITY_ID=".$hlblock['ID']."&lang=".LANGUAGE_ID,
		"ICON"	=> "btn_list",
	)
);

$context = new CAdminContextMenu($aMenu);


//view

if ($_REQUEST["mode"] == "list")
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_js.php");
}
else
{
	require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
}

$context->Show();


if (!empty($errors))
{
	CAdminMessage::ShowMessage(join("\n", $errors));
}

$tabControl->BeginPrologContent();

echo $USER_FIELD_MANAGER->ShowScript();

echo CAdminCalendar::ShowScript();

$tabControl->EndPrologContent();
$tabControl->BeginEpilogContent();
?>

	<?=bitrix_sessid_post()?>
	<input type="hidden" name="ID" value="<?=htmlspecialcharsbx(!empty($row)?$row['ID']:'')?>">
	<input type="hidden" name="ENTITY_ID" value="<?=htmlspecialcharsbx($hlblock['ID'])?>">
	<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">

	<?$tabControl->EndEpilogContent();?>

	<? $tabControl->Begin(array(
		"FORM_ACTION" => $APPLICATION->GetCurPage()."?ENTITY_ID=".$hlblock['ID']."&ID=".IntVal($ID)."&lang=".LANG
	));?>

	<? $tabControl->BeginNextFormTab(); ?>

	<? $tabControl->AddViewField("ID", "ID", !empty($row)?$row['ID']:''); ?>

	<?=$tabControl->ShowUserFieldsWithReadyData('HLBLOCK_'.$hlblock['ID'], $row, false, 'ID');?>

	<?
		$ufields = $USER_FIELD_MANAGER->GetUserFields('HLBLOCK_'.$hlblock['ID']);
		$hasSomeFields = !empty($ufields);
	?>

	<?
	$disable = true;
	if($isEditMode)
		$disable = false;

	if ($hasSomeFields)
	{
		$tabControl->Buttons(array("disabled" => $disable, "back_url"=>"highloadblock_rows_list.php?ENTITY_ID=".intval($hlblock['ID'])."&lang=".LANGUAGE_ID));
	}
	else
	{
		$tabControl->Buttons(false);
	}


	$tabControl->Show();
	?>
</form>



<?

if ($_REQUEST["mode"] == "list")
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin_js.php");
else
	require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");