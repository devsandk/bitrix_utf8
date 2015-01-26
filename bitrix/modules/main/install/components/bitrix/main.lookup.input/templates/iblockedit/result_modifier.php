<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$arParams['BAN_SYM'] = trim($arParams['BAN_SYM']);
$arParams['REP_SYM'] = substr($arParams['REP_SYM'],0,1);
$arParams['FILTER'] = (isset($arParams['FILTER']) && 'Y' == $arParams['FILTER'] ? 'Y' : 'N');
$arParams['TYPE'] = (isset($arParams['TYPE']) && 'SECTION' == $arParams['TYPE'] ? 'SECTION' : 'ELEMENT');
?>