<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
if ($GLOBALS["USER"]->IsAuthorized() && CModule::IncludeModule("pull"))
{
	CPullWatch::Add($GLOBALS["USER"]->GetID(), 'VOTE_'.$arResult["VOTE_ID"]);
	?><script>BX.ready(function(){BX.PULL.extendWatch('VOTE_<?=$arResult["VOTE_ID"]?>');});</script><?
}

if ($this->__page == "result")
{
	?><div class="bx-vote-block bx-vote-block-result"><?
}
else
{
	?><div class="bx-vote-block"><?
}
if(isset($_REQUEST["AUTH_FORM"]) && $_REQUEST["AUTH_FORM"] <> '')
{
	$_REQUEST["AJAX_POST"] = "N";
}
if ($_REQUEST["VOTE_ID"] == $arParams["VOTE_ID"] && $_REQUEST["AJAX_POST"] == "Y" && check_bitrix_sessid())
{
	ob_start();
}
?>