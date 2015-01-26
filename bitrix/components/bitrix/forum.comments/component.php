<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
if (!CModule::IncludeModule("forum")):
	ShowError(GetMessage("F_NO_MODULE"));
	return 0;
elseif (intVal($arParams["FORUM_ID"]) <= 0):
	ShowError(GetMessage("F_ERR_FID_EMPTY"));
	return 0;
elseif (empty($arParams["ENTITY_TYPE"])):
	ShowError(GetMessage("F_ERR_ENT_EMPTY"));
	return 0;
elseif (strlen(trim($arParams["ENTITY_TYPE"])) !== 2 ):
	ShowError(GetMessage("F_ERR_ENT_INVALID"));
	return 0;
elseif (empty($arParams["ENTITY_XML_ID"]) || (intval($arParams['ENTITY_ID']) <= 0 && $arParams['ENTITY_ID'] !== 0)):
	ShowError(GetMessage("F_ERR_EID_EMPTY"));
	return 0;
endif;
$arResult["FORUM"] = CForumNew::GetByIDEx($arParams["FORUM_ID"], SITE_ID);
if (empty($arResult["FORUM"]))
{
	ShowError(str_replace("#FORUM_ID#", $arParams["FORUM_ID"], GetMessage("F_ERR_FID_IS_NOT_EXIST")));
	return false;
}
/********************************************************************
				Input params
********************************************************************/

/***************** BASE ********************************************/

$arParams["FORUM_ID"] = intVal($arParams["FORUM_ID"]);

/***************** URL *********************************************/

$URL_NAME_DEFAULT = array(
		"profile_view" => "PAGE_NAME=profile_view&UID=#UID#",
	);
foreach ($URL_NAME_DEFAULT as $URL => $URL_VALUE)
{
	if (empty($arParams["URL_TEMPLATES_".strToUpper($URL)]))
		continue;
	$arParams["~URL_TEMPLATES_".strToUpper($URL)] = $arParams["URL_TEMPLATES_".strToUpper($URL)];
	$arParams["URL_TEMPLATES_".strToUpper($URL)] = htmlspecialcharsbx($arParams["~URL_TEMPLATES_".strToUpper($URL)]);
}

/***************** ADDITIONAL **************************************/

$arParams["EDITOR_CODE_DEFAULT"] = ($arParams["EDITOR_CODE_DEFAULT"] == "Y" ? "Y" : "N");
$arParams["SHOW_MINIMIZED"] = ($arParams["SHOW_MINIMIZED"] == "Y" ? "Y" : "N");
$arParams["SUBSCRIBE_AUTHOR_ELEMENT"] = ($arParams["SUBSCRIBE_AUTHOR_ELEMENT"] == "Y" ? "Y" : "N");
$arParams["IMAGE_SIZE"] = (intVal($arParams["IMAGE_SIZE"]) > 0 ? $arParams["IMAGE_SIZE"] : 600);
$arParams["IMAGE_HTML_SIZE"] = intval($arParams["IMAGE_HTML_SIZE"]);
$arParams["IMAGE_HTML_SIZE"] = ($arParams["IMAGE_SIZE"] > $arParams["IMAGE_HTML_SIZE"] && $arParams["IMAGE_HTML_SIZE"] > 0 ? $arParams["IMAGE_HTML_SIZE"] : 0);
$arParams["MESSAGES_PER_PAGE"] = intVal($arParams["MESSAGES_PER_PAGE"] > 0 ? $arParams["MESSAGES_PER_PAGE"] : COption::GetOptionString("forum", "MESSAGES_PER_PAGE", "10"));
$arParams["DATE_TIME_FORMAT"] = trim(empty($arParams["DATE_TIME_FORMAT"]) ? $DB->DateFormatToPHP(CSite::GetDateFormat("FULL")) : $arParams["DATE_TIME_FORMAT"]);
$arParams["NAME_TEMPLATE"] = empty($arParams["NAME_TEMPLATE"]) ? "" : str_replace(array("#NOBR#","#/NOBR#"), array("",""), $arParams["NAME_TEMPLATE"]);
$arParams["USE_CAPTCHA"] = ($arParams["USE_CAPTCHA"] == "Y" ? "Y" : "N");
$arParams["PREORDER"] = ($arParams["PREORDER"] == "Y" ? "Y" : "N");
$arParams["PERMISSION"] = (isset($arParams['PERMISSION']) ? $arParams['PERMISSION'] : null);
$arParams["SHOW_RATING"] = ($arParams["SHOW_RATING"] == "Y" ? "Y" : "N");
$arParams["PAGE_NAVIGATION_TEMPLATE"] = trim($arParams["PAGE_NAVIGATION_TEMPLATE"]);
$arParams["PAGE_NAVIGATION_TEMPLATE"] = (!empty($arParams["PAGE_NAVIGATION_TEMPLATE"]) ? $arParams["PAGE_NAVIGATION_TEMPLATE"] : "modern");
if ($arParams['AUTOSAVE'] !== false)
	$arParams["AUTOSAVE"] = CForumAutosave::GetInstance();

$arEditParams = array("ALLOW_HTML", "ALLOW_ANCHOR", "ALLOW_BIU", "ALLOW_IMG",
	"ALLOW_VIDEO", "ALLOW_LIST", "ALLOW_QUOTE", "ALLOW_CODE", "ALLOW_FONT",
	"ALLOW_SMILES", "ALLOW_NL2BR", "ALLOW_TABLE", "ALLOW_MENTION", "ALLOW_ALIGN");
$arParams["ALLOW"] = array_intersect_key($arParams, array_flip($arEditParams));
foreach ($arEditParams as $sName)
{
	$sVal = ($arParams[$sName] === "Y" || $arParams[$sName] === "N" ? $arParams[$sName] : $arResult['FORUM'][$sName]);
	$arParams[$sName] = $arParams["ALLOW"][$sName] = ($sName == "ALLOW_HTML" ? ($paramVal === "Y" ? "Y" : "N") : ($paramVal === "N" ? "N" : "Y"));
}
if (!!$arParams["ALLOW_UPLOAD"] && in_array($arParams["ALLOW_UPLOAD"], array("A", "Y", "F", "N", "I")))
{
	$arParams["ALLOW_UPLOAD"] = ($arParams["ALLOW_UPLOAD"] == "I" ? "Y" : $arParams["ALLOW_UPLOAD"]);
	$arParams["ALLOW"]["ALLOW_UPLOAD"] = $arParams["ALLOW_UPLOAD"];
	$arParams["ALLOW_UPLOAD_EXT"] = $arParams["ALLOW"]["ALLOW_UPLOAD_EXT"] = trim($arParams["ALLOW_UPLOAD_EXT"]);
}
else
{
	$arParams["ALLOW"]["ALLOW_UPLOAD"] = $arParams["ALLOW_UPLOAD"] = $arResult["FORUM"]["ALLOW_UPLOAD"];
	$arParams["ALLOW_UPLOAD_EXT"] = $arParams["ALLOW"]["ALLOW_UPLOAD_EXT"] = trim($arResult["FORUM"]["ALLOW_UPLOAD_EXT"]);
}
$arParams["ALLOW_EDIT_OWN_MESSAGE"] = ($arParams["ALLOW_EDIT_OWN_MESSAGE"] === "ALL" ||
	$arParams["ALLOW_EDIT_OWN_MESSAGE"] === "LAST"? $arParams["ALLOW_EDIT_OWN_MESSAGE"] : "N");

$arParams["ALLOW_EDIT_OWN_MESSAGE"] = "LAST";

$arMessages = array(
	"MINIMIZED_EXPAND_TEXT" => GetMessage('F_EXPAND_TEXT'),
	"MINIMIZED_MINIMIZE_TEXT" => GetMessage('F_MINIMIZE_TEXT'),
	"MESSAGE_TITLE" => GetMessage('F_MESSAGE_TEXT')
);
foreach($arMessages as $paramName => $paramValue)
	$arParams[$paramName] = (($arParams[$paramName]) ? $arParams[$paramName] : $paramValue);
$arParams["URL_TEMPLATES_PROFILE_VIEW"] = (str_replace(array("#USER_ID#", "#author_id#", "#AUTHOR_ID#", "#UID#", "#ID#"), "#user_id#", $arParams["URL_TEMPLATES_PROFILE_VIEW"]));
$arParams["PATH_TO_SMILE"] = (empty($arParams["PATH_TO_SMILE"]) ? "/bitrix/images/forum/smile/" : $arParams["PATH_TO_SMILE"]);
/***************** STANDART ****************************************/
if ($arParams["CACHE_TYPE"] == "Y" || ($arParams["CACHE_TYPE"] == "A" && COption::GetOptionString("main", "component_cache_on", "Y") == "Y"))
	$arParams["CACHE_TIME"] = intval($arParams["CACHE_TIME"]);
else
	$arParams["CACHE_TIME"] = 0;
global $CACHE_MANAGER;
/********************************************************************
				/Input params
********************************************************************/

/********************************************************************
				Default values
********************************************************************/
$arError = array();
$arNote = array();
$arResult["ERROR_MESSAGE"] = "";
$arResult["OK_MESSAGE"] = ($_REQUEST["result"] == "reply" ? GetMessage("COMM_COMMENT_OK") : (
	$_REQUEST["result"] == "not_approved" ? GetMessage("COMM_COMMENT_OK_AND_NOT_APPROVED") : ""));
unset($_GET["result"]); unset($GLOBALS["HTTP_GET_VARS"]["result"]);
DeleteParam(array("result"));

$arResult["MESSAGES"] = array();
$arResult["MESSAGE_VIEW"] = array();

// FORUM
CPageOption::SetOptionString("main", "nav_page_in_session", "N");

$arResult['FORUM_TOPIC_ID']=null;
$arResult["TOPIC"] = array();
$arFilter = array("FORUM_ID"=>$arParams['FORUM_ID'], "XML_ID"=>$arParams['ENTITY_XML_ID']);
$dbRes = CForumTopic::GetList(null, $arFilter);
if ($dbRes && $arResult["TOPIC"] = $dbRes->Fetch())
	$arResult['FORUM_TOPIC_ID'] = $arResult["TOPIC"]['ID'];

$arResult["ELEMENT"] = array();
$arResult["USER"] = array(
	"PERMISSION" => ($arParams['PERMISSION'] !== null ? $arParams['PERMISSION'] : ForumCurrUserPermissions($arParams["FORUM_ID"])),
	"SHOWED_NAME" => $GLOBALS["FORUM_STATUS_NAME"]["guest"],
	"SUBSCRIBE" => array(),
	"FORUM_SUBSCRIBE" => "N", "TOPIC_SUBSCRIBE" => "N");

// A - NO ACCESS		E - READ			I - ANSWER
// M - NEW TOPIC		Q - MODERATE	U - EDIT			Y - FULL_ACCESS

$userId = $USER->GetID();
$arUserGroups = $USER->GetUserGroupArray();
if ($arResult["USER"]["PERMISSION"] !== null && !CForumUser::IsAdmin())
{
	$arResult["USER"]["RIGHTS"] = array(
		"ADD_TOPIC" => ($arParams['PERMISSION'] >= 'M' ? "Y" : "N"),
		"MODERATE" => ($arParams['PERMISSION'] >= 'Q' ? "Y" : "N"),
		"EDIT" => ($arParams['PERMISSION'] >= 'U' ? "Y" : "N"),
		"ADD_MESSAGE" => ($arParams['PERMISSION'] >= 'I' ? "Y" : "N")
	);
}
else
{
	$arResult["USER"]["RIGHTS"] = array(
		"ADD_TOPIC" => CForumTopic::CanUserAddTopic($arParams["FORUM_ID"], $arUserGroups, $userId, $arResult["FORUM"]) ? "Y" : "N",
		"MODERATE" => (CForumNew::CanUserModerateForum($arParams["FORUM_ID"], $arUserGroups, $userId) == true ? "Y" : "N"),
		"EDIT" => CForumNew::CanUserEditForum($arParams["FORUM_ID"], $arUserGroups, $userId) ? "Y" : "N",
		"ADD_MESSAGE" => CForumMessage::CanUserAddMessage($arResult['FORUM_TOPIC_ID'], $arUserGroups, $userId) ? "Y" : "N"
	);
}

if ($USER->IsAuthorized())
{
	$arResult["USER"]["ID"] = $GLOBALS["USER"]->GetID();
	$tmpName = empty($arParams["NAME_TEMPLATE"]) ? $GLOBALS["USER"]->GetFormattedName(false) : CUser::FormatName($arParams["NAME_TEMPLATE"], array(
			"NAME"			=>	$USER->GetFirstName(),
			"LAST_NAME"		=>	$USER->GetLastName(),
			"SECOND_NAME"	=>	$USER->GetSecondName(),
			"LOGIN"			=>	$USER->GetLogin()
			));
	$arResult["USER"]["SHOWED_NAME"] = trim($_SESSION["FORUM"]["SHOW_NAME"] == "Y" ? $tmpName :	$GLOBALS["USER"]->GetLogin());
	$arResult["USER"]["SHOWED_NAME"] = trim(!empty($arResult["USER"]["SHOWED_NAME"]) ? $arResult["USER"]["SHOWED_NAME"] : $GLOBALS["USER"]->GetLogin());
}

$arResult['DO_NOT_CACHE'] = true;

// PARSER
$parser = new forumTextParser(LANGUAGE_ID, $arParams["PATH_TO_SMILE"]);
$parser->imageWidth = $arParams["IMAGE_SIZE"];
$parser->imageHtmlWidth = $arParams["IMAGE_HTML_SIZE"];
$parser->userPath = $arParams["URL_TEMPLATES_PROFILE_VIEW"];
$parser->userNameTemplate = $arParams["NAME_TEMPLATE"];

$arResult["PARSER"] = $parser;
$arAllow = array(
	"HTML" => $arParams["ALLOW_HTML"],
	"ANCHOR" => $arParams["ALLOW_ANCHOR"],
	"BIU" => $arParams["ALLOW_BIU"],
	"IMG" => $arParams["ALLOW_IMG"],
	"VIDEO" => $arParams["ALLOW_VIDEO"],
	"LIST" => $arParams["ALLOW_LIST"],
	"QUOTE" => $arParams["ALLOW_QUOTE"],
	"CODE" => $arParams["ALLOW_CODE"],
	"FONT" => $arParams["ALLOW_FONT"],
	"SMILES" => $arParams["ALLOW_SMILES"],
	"NL2BR" => $arParams["ALLOW_NL2BR"],
	"TABLE" => $arParams["ALLOW_TABLE"],
	"UPLOAD" => $arParams["ALLOW_UPLOAD"],
	"ALIGN" => $arParams["ALLOW_ALIGN"]
);

/********************************************************************
				/Default values
********************************************************************/
if ($arResult["USER"]["PERMISSION"] <= "A")
{
	return false;
}

$path = dirname(__FILE__);

if (isset($arParams['UPLOAD_SIMPLE']) && $arParams['UPLOAD_SIMPLE'] === 'Y')
	include_once($path."/files.php");
else
	include_once($path."/files_input.php");
$arResult["objFiles"] = new CCommentFiles($this);
include_once($path."/ufs.php");
$arResult["objUFs"] = new CCommentUFs($this);
$arResult["objRating"] = false;
if ($arParams["SHOW_RATING"] == "Y")
{
	include_once($path."/ratings.php");
	$arResult["objRating"] = new CCommentRatings($this);
}

foreach (GetModuleEvents('forum', 'OnCommentsInit', true) as $arEvent)
	ExecuteModuleEventEx($arEvent, array(&$this));

/********************************************************************
				Actions
********************************************************************/
//ForumSetLastVisit($arParams["FORUM_ID"], $arResult['FORUM_TOPIC_ID'], array("nameTemplate" => $arParams["NAME_TEMPLATE"]));
include($path."/action.php");
$strErrorMessage = "";
foreach ($arError as $res)
	$strErrorMessage .= (empty($res["title"]) ? $res["code"] : $res["title"]);

$arResult["ERROR_MESSAGE"] = $strErrorMessage;
$arResult["OK_MESSAGE"] .= $strOKMessage;

if (strlen($arResult["ERROR_MESSAGE"]) > 0)
	$arParams["SHOW_MINIMIZED"] = "N";
/********************************************************************
				/Actions
********************************************************************/

$arResult["PANELS"] = array(
	"MODERATE" => $arResult["USER"]["RIGHTS"]["MODERATE"],
	"EDIT" => $arResult["USER"]["RIGHTS"]["EDIT"],
	"DELETE" => $arResult["USER"]["RIGHTS"]["EDIT"]
);

/************** Show post form **********************************/
$arResult["SHOW_POST_FORM"] = ($arResult["USER"]["PERMISSION"] >= "I" ? "Y" : "N");

if ($arResult["SHOW_POST_FORM"] == "Y")
{
	// Author name
	$arResult["~REVIEW_AUTHOR"] = $arResult["USER"]["SHOWED_NAME"];
	$arResult["~REVIEW_USE_SMILES"] = ($arParams["ALLOW_SMILES"] == "Y" ? "Y" : "N");

	if (!empty($arError) || !empty($arResult["MESSAGE_VIEW"]))
	{
		if (!empty($_POST["REVIEW_AUTHOR"]))
			$arResult["~REVIEW_AUTHOR"] = $_POST["REVIEW_AUTHOR"];
		$arResult["~REVIEW_EMAIL"] = $_POST["REVIEW_EMAIL"];
		$arResult["~REVIEW_TEXT"] = $_POST["REVIEW_TEXT"];
		$arResult["~REVIEW_USE_SMILES"] = ($_POST["REVIEW_USE_SMILES"] == "Y" ? "Y" : "N");
	}
	$arResult["REVIEW_AUTHOR"] = htmlspecialcharsEx($arResult["~REVIEW_AUTHOR"]);
	$arResult["REVIEW_EMAIL"] = htmlspecialcharsEx($arResult["~REVIEW_EMAIL"]);
	$arResult["REVIEW_TEXT"] = htmlspecialcharsEx($arResult["~REVIEW_TEXT"]);
	$arResult["REVIEW_USE_SMILES"] = $arResult["~REVIEW_USE_SMILES"];

	// Form Info
	$arResult["SHOW_PANEL_ATTACH_IMG"] = (in_array($arParams["ALLOW_UPLOAD"], array("A", "F", "Y")) ? "Y" : "N");
	$arResult["TRANSLIT"] = (LANGUAGE_ID=="ru" ? "Y" : " N");
	if ($arParams["ALLOW_SMILES"] == "Y"):
		$arResult["ForumPrintSmilesList"] = ($arParams["ALLOW_SMILES"] == "Y" ?
			ForumPrintSmilesList(3, LANGUAGE_ID, $arParams["PATH_TO_SMILE"], $arParams["CACHE_TIME"]) : "");
		$arResult["SMILES"] = CForumSmile::GetByType("S", LANGUAGE_ID);
	endif;

	$arResult["CAPTCHA_CODE"] = "";
	if ($arParams["USE_CAPTCHA"] == "Y" && !$GLOBALS["USER"]->IsAuthorized())
	{
		include_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/general/captcha.php");
		$cpt = new CCaptcha();
		$captchaPass = COption::GetOptionString("main", "captcha_password", "");
		if (strLen($captchaPass) <= 0)
		{
			$captchaPass = randString(10);
			COption::SetOptionString("main", "captcha_password", $captchaPass);
		}
		$cpt->SetCodeCrypt($captchaPass);
		$arResult["CAPTCHA_CODE"] = htmlspecialcharsbx($cpt->GetCodeCrypt());
	}
}

/********************************************************************
				Input params II
********************************************************************/
/************** URL ************************************************/
if (empty($arParams["~URL_TEMPLATES_READ"]) && !empty($arResult["FORUM"]["PATH2FORUM_MESSAGE"]))
	$arParams["~URL_TEMPLATES_READ"] = $arResult["FORUM"]["PATH2FORUM_MESSAGE"];
elseif (empty($arParams["~URL_TEMPLATES_READ"]))
	$arParams["~URL_TEMPLATES_READ"] = $APPLICATION->GetCurPage()."?PAGE_NAME=read&FID=#FID#&TID=#TID#&MID=#MID#";
$arParams["~URL_TEMPLATES_READ"] = str_replace(array("#FORUM_ID#", "#TOPIC_ID#", "#MESSAGE_ID#"),
		array("#FID#", "#TID#", "#MID#"), $arParams["~URL_TEMPLATES_READ"]);
$arParams["URL_TEMPLATES_READ"] = htmlspecialcharsEx($arParams["~URL_TEMPLATES_READ"]);
//
// Link to forum
$arResult["read"] = CComponentEngine::MakePathFromTemplate($arParams["URL_TEMPLATES_READ"],
	array("FID" => $arParams["FORUM_ID"], "TID" => $arResult["FORUM_TOPIC_ID"], "TITLE_SEO" => $arResult["TOPIC"]["TITLE_SEO"],
		"MID" => "s", "PARAM1" => $arParams['ENTITY_TYPE'], "PARAM2" => $arParams["ENTITY_ID"]));
/********************************************************************
				/Input params
********************************************************************/

/********************************************************************
				Data
********************************************************************/
/************** 4. Get message list *******"*************************/
$pageNo = 0; $bShowAll = false;
$arResult["UNREAD_MID"] = 0;
if ($arResult["FORUM_TOPIC_ID"] > 0)
{
	$pager_number = $GLOBALS["NavNum"] + 1;
	$arResult["UNREAD_MID"] = intVal(ForumGetFirstUnreadMessage($arParams["FORUM_ID"], $arResult["FORUM_TOPIC_ID"]));

	$MID = intVal($_REQUEST["MID"]);
	unset($_GET["MID"]); unset($GLOBALS["MID"]);
	if (isset($arResult['RESULT']) && intval($arResult['RESULT']) > 0)
	{
		$MID = $arResult['RESULT'];
		if ($arResult["UNREAD_MID"] == $MID)
			$arResult["UNREAD_MID"]++;
	}
	elseif ($arResult["UNREAD_MID"] > 0 && ($MID > 0 && $MID > $arResult["UNREAD_MID"] || $MID <= 0))
		$MID = $arResult["UNREAD_MID"];
	ForumSetReadTopic($arParams["FORUM_ID"], $arResult["FORUM_TOPIC_ID"]);
	if (intVal($MID) > 0)
	{
		$pageNo = CForumMessage::GetMessagePage(
			$MID,
			$arParams["MESSAGES_PER_PAGE"],
			$GLOBALS["USER"]->GetUserGroupArray(),
			$arResult["FORUM_TOPIC_ID"],
			array(
				"ORDER_DIRECTION" => ($arParams["PREORDER"] == "N" ? "DESC" : "ASC"),
				"PERMISSION_EXTERNAL" => $arResult["USER"]["PERMISSION"],
				"FILTER" => array("!PARAM1" => $arParams['ENTITY_TYPE'])
			)
		);
		$bShowAll = ($pageNo > 1);
		$arResult['MID'] = $MID;
	}
	else
	{
		$pageNo = $_GET["PAGEN_".$pager_number];
		if (isset($arResult['RESULT']) && intval($arResult['RESULT']) > 0) $pageNo = $arResult['RESULT'];
	}

	if ($pageNo > 200) $pageNo = 0;
}

$ar_cache_id = array(
	$arParams["FORUM_ID"],
	$arParams["ENTITY_XML_ID"],
	$arResult["FORUM_TOPIC_ID"],
	$arResult["USER"]["RIGHTS"],
	$arResult["USER"]["PERMISSION"],
	$arResult["PANELS"],
	$arParams['SHOW_RATING'],
	$arParams["MESSAGES_PER_PAGE"],
	$arParams["DATE_TIME_FORMAT"],
	$arParams["PREORDER"],
	$pageNo
);

$cache_id = "forum_comment_".serialize($ar_cache_id);

ob_start();

if ($arResult['DO_NOT_CACHE'] || $this->StartResultCache($arParams["CACHE_TIME"], $cache_id))
{
	if ($arResult["FORUM_TOPIC_ID"] > 0)
	{
		$arMessages = array();

		if (empty($arMessages))
		{
			$arOrder = array("ID" => ($arParams["PREORDER"] === "N" ? "DESC" : "ASC"));
			$arFields = array("bDescPageNumbering" => false, "nPageSize" => $arParams["MESSAGES_PER_PAGE"], "bShowAll" => $bShowAll);
			if (!empty($arParams["NAME_TEMPLATE"]))
				$arFields["sNameTemplate"] = $arParams["NAME_TEMPLATE"];

			if ((intVal($MID) > 0) && ($pageNo > 0))
				$arFields["iNumPage"] = intVal($pageNo);

			$arFilter = array("FORUM_ID"=>$arParams["FORUM_ID"], "TOPIC_ID"=>$arResult["FORUM_TOPIC_ID"], "!PARAM1" => $arParams['ENTITY_TYPE']);
			if ($arResult["USER"]["RIGHTS"]["MODERATE"] != "Y") $arFilter["APPROVED_AND_MINE"] = $GLOBALS["USER"]->GetId();
			if (!empty($_REQUEST["FILTER"]))
				$arFilter = array_merge($_REQUEST["FILTER"], $arFilter);
			if ($bShowAll)
				$GLOBALS["SHOWALL_".($GLOBALS["NavNum"]+1)] = true;

			$db_res = CForumMessage::GetListEx($arOrder, $arFilter, false, 0, $arFields);
			$db_res->NavStart($arParams["MESSAGES_PER_PAGE"], $bShowAll, ($arFields["iNumPage"] > 0 ? $arFields["iNumPage"] : false));
			$arResult["NAV_RESULT"] = $db_res;
			if ($db_res)
			{
				$arResult["NAV_STRING"] = $db_res->GetPageNavStringEx($navComponentObject, GetMessage("NAV_OPINIONS"), $arParams["PAGE_NAVIGATION_TEMPLATE"]);
				$arResult["NAV_STYLE"] = $APPLICATION->GetAdditionalCSS();
				$arResult["PAGE_COUNT"] = $db_res->NavPageCount;
				$arResult['PAGE_NUMBER'] = $db_res->NavPageNomer;
				$number = intVal($db_res->NavPageNomer-1)*$arParams["MESSAGES_PER_PAGE"] + 1;
				$GLOBALS['forumComponent'] = &$this;
				$FormatDate = (strpos($arParams["DATE_TIME_FORMAT"], 'a') !== false ? 'g:i a' :
					(strpos($arParams["DATE_TIME_FORMAT"], 'A') !== false ? 'g:i A' : 'G:i'));
				while ($res = $db_res->GetNext())
				{
					/************** Message info ***************************************/
					// number in topic
					$res["NUMBER"] = $number++;
					// data
					$res["POST_TIMESTAMP"] = MakeTimeStamp($res["POST_DATE"], CSite::GetDateFormat());
					$res["POST_TIME"] = FormatDate($FormatDate, $res["POST_TIMESTAMP"]);
					$res["POST_DATE"] = CForumFormat::DateFormat($arParams["DATE_TIME_FORMAT"], $res["POST_TIMESTAMP"]);
					$res["EDIT_DATE"] = CForumFormat::DateFormat($arParams["DATE_TIME_FORMAT"], MakeTimeStamp($res["EDIT_DATE"], CSite::GetDateFormat()));
					// text
					$res["ALLOW"] = array_merge($arAllow, array("ALLOW_SMILES" => ($res["USE_SMILES"] == "Y" ? $arParams["ALLOW_SMILES"] : "N")));
					$res["~POST_MESSAGE_TEXT"] = (COption::GetOptionString("forum", "FILTER", "Y")=="Y" ? $res["~POST_MESSAGE_FILTER"] : $res["~POST_MESSAGE"]);
					// links
					$res["PANELS"] = $arResult["PANELS"];
					$res["URL"] = array(
						"LINK" => $APPLICATION->GetCurPageParam("MID=".$res["ID"],
							array("MID", "sessid", "AJAX_POST", "ENTITY_XML_ID", "ENTITY_TYPE", "ENTITY_ID", "REVIEW_ACTION", "MODE", "FILTER", "result"))
					);
					$res["URL"]["MODERATE"] = ForumAddPageParams($res["URL"]["LINK"], array("REVIEW_ACTION" => ($res["APPROVED"]=="Y" ? "HIDE" : "SHOW")));
					$res["URL"]["EDIT"] = ForumAddPageParams($res["URL"]["LINK"], array("REVIEW_ACTION" => "GET"));
					$res["URL"]["DELETE"] = ForumAddPageParams($res["URL"]["LINK"], array("REVIEW_ACTION" => "DEL"));
					if ($res["PANELS"]["EDIT"] == "Y" || (
							$arParams["ALLOW_EDIT_OWN_MESSAGE"] === "LAST" &&
							$res["ID"] == $arResult["TOPIC"]["ABS_LAST_MESSAGE_ID"] &&
							$res["AUTHOR_ID"] > 0 &&
							$res["AUTHOR_ID"] == $GLOBALS["USER"]->GetId()) ||
						($arParams["ALLOW_EDIT_OWN_MESSAGE"] === "ALL" &&
							$res["AUTHOR_ID"] > 0 &&
							$res["AUTHOR_ID"] == $GLOBALS["USER"]->GetId())
					)
					{
						$res["PANELS"]["EDIT"] = "Y";
						$res["PANELS"]["DELETE"] = "Y";
					}
					/************** Message info/***************************************/
					/************** Author info ****************************************/
					if (!empty($arParams["NAME_TEMPLATE"]) && $res["SHOW_NAME"] != "Y")
					{
						$name = CUser::FormatName(
							$arParams["NAME_TEMPLATE"],
							array(
								"NAME"			=> $res["NAME"],
								"LAST_NAME"		=> $res["LAST_NAME"],
								"SECOND_NAME"	=> $res["SECOND_NAME"],
								"LOGIN"			=> $res["LOGIN"]
							),
							true,
							false
						);
						if (!!$name)
						{
							$res["~AUTHOR_NAME"] = $name;
							$res["AUTHOR_NAME"] = htmlspecialcharsbx($name);
						}
					}
					$res["AUTHOR_ID"] = intVal($res["AUTHOR_ID"]);
					$res["AUTHOR_URL"] = "";
					if (!empty($arParams["URL_TEMPLATES_PROFILE_VIEW"]))
					{
						$res["AUTHOR_URL"] = CComponentEngine::MakePathFromTemplate($arParams["URL_TEMPLATES_PROFILE_VIEW"], array("user_id" => $res["AUTHOR_ID"]));
					}
					$avatarId = (int)$res["PERSONAL_PHOTO"];
					if ($avatarId > 0)
					{
						$res["AVATAR"] = array(
							"ID" => $avatarId,
							"FILE" => CFile::ResizeImageGet(
								$avatarId,
								array("width" => 42, "height" => 42),
								BX_RESIZE_IMAGE_EXACT,
								false)
							);
						if ($res["AVATAR"]["FILE"] !== false)
							$res["AVATAR"]["HTML"] = CFile::ShowImage($res["AVATAR"]["FILE"]['src'], 30, 30, "border=0 align='right'");
					}
					// For quote JS
					$res["FOR_JS"]["AUTHOR_NAME"] = CUtil::JSEscape($res["AUTHOR_NAME"]);
					$res["FOR_JS"]["POST_MESSAGE_TEXT"] = CUtil::JSEscape(htmlspecialcharsbx($res["POST_MESSAGE_TEXT"]));

					$res["NEW"] = ($arResult["UNREAD_MID"] > 0 && $res["ID"] >= $arResult["UNREAD_MID"] ? "Y" : "N");
					$arMessages[$res["ID"]] = $res;
				}
			}
			$arResult["MESSAGES"] = $arMessages;
			unset($arMessages);

			foreach (GetModuleEvents('forum', 'OnPrepareComments', true) as $arEvent)
				$result = ExecuteModuleEventEx($arEvent);

			$parser->arFiles = $arResult["FILES"];
			foreach ($arResult["MESSAGES"] as $iID => $res):
				$parser->arUserfields = $arResult["MESSAGES"][$iID]["PROPS"] = (array_key_exists($res["ID"], $arResult["UFS"]) ?
					$arResult["UFS"][$res["ID"]] : array());
				$arResult["MESSAGES"][$iID]["POST_MESSAGE_TEXT"] = $parser->convert($res["~POST_MESSAGE_TEXT"], $res["ALLOW"]);
				$arResult["MESSAGES"][$iID]["FILES_PARSED"] = $parser->arFilesIDParsed;
			endforeach;

			if(defined("BX_COMP_MANAGED_CACHE"))
			{
				CForumCacheManager::SetTag($this->GetCachePath(), "forum_topic_".$arResult['FORUM_TOPIC_ID']);
			}
		}
		else
		{
			$GLOBALS["NavNum"]++;
		}
	}
	$this->IncludeComponentTemplate();
}

$output = ob_get_clean();

foreach (GetModuleEvents('forum', 'OnCommentsDisplayTemplate', true) as $arEvent)
	$result = ExecuteModuleEventEx($arEvent, array(&$output, $arParams, $arResult));

echo $output;
?>
