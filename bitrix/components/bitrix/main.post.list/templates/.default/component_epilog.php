<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if ($_REQUEST["AJAX_POST"] == "Y" &&
	$_REQUEST["ENTITY_XML_ID"] == $arParams["ENTITY_XML_ID"] &&
	in_array($_REQUEST["MODE"], array("LIST", "RECORD"))) {
	include_once(__DIR__."/html_parser.php");
	AddEventHandler('main.post.list', 'OnCommentsDisplayTemplate', __MPLParseRecordsHTML);
}
if (check_bitrix_sessid() &&
	$GLOBALS["USER"]->IsAuthorized() &&
	!!$_REQUEST["ENTITY_XML_ID"] && $_REQUEST["ENTITY_XML_ID"] == $arParams["ENTITY_XML_ID"] &&
	is_array($arParams["PUSH&PULL"]) && $arParams["PUSH&PULL"]["ACTION"] == "REPLY" &&
	CModule::IncludeModule("pull") && CPullOptions::GetNginxStatus())
{
	$_SESSION["UC"][$_REQUEST["ENTITY_XML_ID"]]["RECORDS"][] = $arParams["PUSH&PULL"]["ID"];
	$res = $arParams["RECORDS"][$arParams["PUSH&PULL"]["ID"]];

	if ($res["APPROVED"] != "Y")
	{
		$res = array(
			"ID" => $res["ID"],
			"URL" => $res["URL"],
			"APPROVED" => "N",
			"ENTITY_XML_ID" => $res["ENTITY_XML_ID"], // string
		);
	}
	else
	{
		$res["PANELS"] = array( "EDIT" => "N", "MODERATE" => "N", "DELETE" => "N" );
	}
	CPullWatch::AddToStack('UNICOMMENTS'.$arParams["ENTITY_XML_ID"],
		Array(
			'module_id' => 'unicomments',
			'command' => 'comment',
			'params' => array_merge(
				$res,
				array("ACTION" => "REPLY")
			)
		)
	);
}

if ($GLOBALS["USER"]->IsAuthorized() && CModule::IncludeModule("pull") && CPullOptions::GetNginxStatus())
{
	CPullWatch::Add($GLOBALS["USER"]->GetId(), 'UNICOMMENTS'.$arParams["ENTITY_XML_ID"]);
?>
<script>
	BX.ready(function(){BX.PULL.extendWatch('UNICOMMENTS<?=CUtil::JSEscape($arParams["ENTITY_XML_ID"])?>');});
</script>
<?
}
?>