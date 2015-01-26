<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$requiredModules = array('highloadblock');

foreach ($requiredModules as $requiredModule)
{
	if (!CModule::IncludeModule($requiredModule))
	{
		ShowError(GetMessage("F_NO_MODULE"));
		return 0;
	}
}

use Bitrix\Highloadblock as HL;
use Bitrix\Main\Entity;

global $USER_FIELD_MANAGER;

// hlblock info
$hlblock_id = $arParams['BLOCK_ID'];

if (empty($hlblock_id))
{
	ShowError(GetMessage('HLBLOCK_VIEW_NO_ID'));
	return 0;
}

$hlblock = HL\HighloadBlockTable::getById($hlblock_id)->fetch();

if (empty($hlblock))
{
	ShowError('404');
	return 0;
}

$entity = HL\HighloadBlockTable::compileEntity($hlblock);

// row data
$main_query = new Entity\Query($entity);
$main_query->setSelect(array('*'));
$main_query->setFilter(array('=ID' => $arParams['ROW_ID']));

$result = $main_query->exec();
$result = new CDBResult($result);
$row = $result->Fetch();

$fields = $USER_FIELD_MANAGER->getUserFieldsWithReadyData('HLBLOCK_'.$hlblock['ID'], $row, LANGUAGE_ID);

if (empty($row))
{
	ShowError(sprintf(GetMessage('HLBLOCK_VIEW_NO_ROW'), $arParams['ROW_ID']));
	return 0;
}

$arResult['fields'] = $fields;
$arResult['row'] = $row;


$this->IncludeComponentTemplate();