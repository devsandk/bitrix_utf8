<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$arWizardDescription = Array(
	"NAME" => GetMessage("WD_TITLE"), 
	"DESCRIPTION" => GetMessage("WD_TITLE_DESCR"), 
	"ICON" => "",
	"COPYRIGHT" => "Bitrixtemplates.ru",
	"VERSION" => "0.0.5",
	"DEPENDENCIES" => Array( 
		"main" => "9.5.0",
	),
	"STEPS" => Array("Step0", "Step1", "Step2", "FinalStep", "CancelStep"),
/*
	"TEMPLATES" => Array(
		Array("SCRIPT" => "wizard_template.php", "CLASS" => "DemoSiteTemplate"),
	),
*/
);

?>