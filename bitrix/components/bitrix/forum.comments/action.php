<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
if (isset($_REQUEST["ENTITY_XML_ID"]) && isset($_REQUEST["ENTITY_TYPE"]) && isset($_REQUEST["ENTITY_ID"]))
{
	if ($_REQUEST["ENTITY_XML_ID"] != $arParams["ENTITY_XML_ID"] ||
		$_REQUEST["ENTITY_TYPE"] != $arParams["ENTITY_TYPE"] ||
		$_REQUEST["ENTITY_ID"] != $arParams["ENTITY_ID"])
	{
		return false;
	}
}
if (!CModule::IncludeModule("forum")):
	return false;
elseif (!($_REQUEST["comment_review"] == "Y" || in_array($_REQUEST['REVIEW_ACTION'], array('DEL', 'HIDE', 'SHOW', 'EDIT')))):
	return false;
elseif ($_REQUEST['REVIEW_ACTION'] == "EDIT" && $_REQUEST["MID"] > 0 &&
	(
		!$arResult["TOPIC"] ||
		$arResult["USER"]["RIGHTS"]["MODERATE"] !== "Y" &&
		$arParams["ALLOW_EDIT_OWN_MESSAGE"] == "N"
	)
):
	return false;
endif;
$this->IncludeComponentLang("action.php");
// Check gross errors message data

$APPLICATION->RestartBuffer();

/** @var $request \Bitrix\Main\HttpRequest */
$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$post = array_merge($request->getQueryList()->toArray(), $request->getPostList()->toArray());

if ($post["AJAX_POST"] == "Y")
	CUtil::decodeURIComponent($post);

if (!check_bitrix_sessid())
{
	$arError[] = array(
		"code" => "session time is up",
		"title" => GetMessage("F_ERR_SESSION_TIME_IS_UP"));
}
// Check Permission
elseif ($arResult["USER"]['PERMISSION'] <= "E")
{
	$arError[] = array(
		"code" => "access denied",
		"title" => GetMessage("F_ERR_NOT_RIGHT_FOR_ADD"));
}
elseif ($post['REVIEW_ACTION'] == "EDIT" || $post['REVIEW_ACTION'] == "DEL")
{
	$arResult["MESSAGE"] = CForumMessage::GetById($post["MID"]);
	if ($arResult["MESSAGE"]["TOPIC_ID"] != $arResult["TOPIC"]["ID"] ||
		$arResult["USER"]["RIGHTS"]["EDIT"] !== "Y" && (
			($arResult["MESSAGE"]["AUTHOR_ID"] <= 0 ||
				$arResult["MESSAGE"]["AUTHOR_ID"] != $GLOBALS["USER"]->GetID() ||
				(
					$arParams["ALLOW_EDIT_OWN_MESSAGE"] == "LAST" &&
					$arResult["MESSAGE"]["ID"] != $arResult["TOPIC"]["ABS_LAST_MESSAGE_ID"]
				)
			)
		)
	)
	{
		$arError[] = array(
			"code" => "access denied",
			"title" => GetMessage("F_ERR_NOT_RIGHT_FOR_EDIT"));
	}
}
if (!empty($arError))
{}
elseif ((empty($_REQUEST["preview_comment"]) || $_REQUEST["preview_comment"] == "N") && ($_REQUEST["comment_review"] == "Y"))
{
	$arProperties = array();
	$needProperty = array();
	$strErrorMessage = "";

	// Check Captcha
	if (!$GLOBALS["USER"]->IsAuthorized() && ($arParams["USE_CAPTCHA"]=="Y" || $arResult["FORUM"]["USE_CAPTCHA"] == "Y"))
	{
		include_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/general/captcha.php");
		$captchaPass = COption::GetOptionString("main", "captcha_password", "");
		if ($arResult["FORUM"]["USE_CAPTCHA"] == "Y"):
			if (!class_exists("CForumTmpCaptcha")):
				class CForumTmpCaptcha extends CCaptcha
				{
					function CheckCaptchaCode($userCode, $sid, $bUpperCode = true)
					{
						global $DB;
						if (strlen($userCode)<=0 || strlen($sid)<=0)
							return false;
						if ($bUpperCode)
							$userCode = strtoupper($userCode);
						$res = $DB->Query("SELECT CODE FROM b_captcha WHERE ID = '".$DB->ForSQL($sid,32)."' ");
						if (!$ar = $res->Fetch())
							return false;
						if ($ar["CODE"] != $userCode)
							return false;
//						CCaptcha::Delete($sid);
						return true;
					}

					function CheckCode($userCode, $sid, $bUpperCode = True)
					{
						if (!defined("CAPTCHA_COMPATIBILITY"))
							return CForumTmpCaptcha::CheckCaptchaCode($userCode, $sid, $bUpperCode);
						if (!is_array($_SESSION["CAPTCHA_CODE"]) || count($_SESSION["CAPTCHA_CODE"]) <= 0)
							return False;
						if (!array_key_exists($sid, $_SESSION["CAPTCHA_CODE"]))
							return False;
						if ($bUpperCode)
							$userCode = strtoupper($userCode);
						if ($_SESSION["CAPTCHA_CODE"][$sid] != $userCode)
							return False;
//						unset($_SESSION["CAPTCHA_CODE"][$sid]);
						return True;
					}

					function CheckCodeCrypt($userCode, $codeCrypt, $password = "", $bUpperCode = True)
					{
						if (!defined("CAPTCHA_COMPATIBILITY"))
							return CForumTmpCaptcha::CheckCaptchaCode($userCode, $codeCrypt, $bUpperCode);

						if (strlen($codeCrypt) <= 0)
							return False;

						if (!array_key_exists("CAPTCHA_PASSWORD", $_SESSION) || strlen($_SESSION["CAPTCHA_PASSWORD"]) <= 0)
							return False;

						if ($bUpperCode)
							$userCode = strtoupper($userCode);

						$code = $this->CryptData($codeCrypt, "D", $_SESSION["CAPTCHA_PASSWORD"]);

						if ($code != $userCode)
							return False;

						return True;
					}
				}
			endif;
			$cpt = new CForumTmpCaptcha();
		else:
			$cpt = new CCaptcha();
		endif;
		if (strlen($post["captcha_code"]) <= 0):
			if (!$cpt->CheckCode($post["captcha_word"], 0)):
				$arError[] = array(
					"code" => "captcha is empty",
					"title" => GetMessage("POSTM_CAPTCHA"));
			endif;
		elseif (!$cpt->CheckCodeCrypt($post["captcha_word"], $post["captcha_code"], $captchaPass)):
			$arError[] = array(
				"code" => "bad captcha",
				"title" => GetMessage("POSTM_CAPTCHA"));
		endif;
	}

	$arPost = array(
		'MESSAGE' => trim($post["REVIEW_TEXT"])
	);

	foreach (GetModuleEvents('forum', 'OnCommentAdd', true) as $arEvent) // add custom data from $_REQUEST to arElement, validate here
	{
		$result = ExecuteModuleEventEx($arEvent, array($arParams['ENTITY_TYPE'], $arParams['ENTITY_ID'], &$arPost));
		if ($result === false)
			break;
	}

	if ($result === false && isset($arPost['ERROR'])) // validation failed
		$arError[] = array('title' => $arPost['ERROR']);

	// First exit point
	if (!empty($arError))
		return false;

	$_REQUEST['REVIEW_ACTION'] = ($_REQUEST['REVIEW_ACTION'] == "EDIT"  && $_REQUEST["MID"] > 0 ? "EDIT" : "REPLY");
	$MID = intval($_REQUEST['REVIEW_ACTION'] == "EDIT" ? $_REQUEST["MID"] : 0); $TID = intval($arResult['FORUM_TOPIC_ID']);
	if ($TID <= 0)
	{
		$MID = 0;
		$arTopic = array(
			'AUTHOR_ID' => 0,
			'TITLE' => '',
			'TAGS' => '',
			'MESSAGE' => ''
		);

		foreach (GetModuleEvents('forum', 'OnCommentTopicAdd', true) as $arEvent) // add first message POST text & required properties
		{
			if (ExecuteModuleEventEx($arEvent, array($arParams['ENTITY_TYPE'], $arParams['ENTITY_ID'], $arPost, &$arTopic)) === true)
				break;
		}

		if (strlen(trim($arTopic['TITLE'])) < 1)
			$arTopic['TITLE'] = $arParams['ENTITY_XML_ID'];

		if (strlen(trim($arTopic['MESSAGE'])) < 1)
			$arTopic['MESSAGE'] = $arParams['ENTITY_XML_ID'];

		$arUserStart = array(
			"ID" => $arTopic["AUTHOR_ID"],
			"NAME" => $GLOBALS["FORUM_STATUS_NAME"]["guest"]);
		if ($arUserStart["ID"] > 0)
		{
			$res = array();
			$db_res = CForumUser::GetListEx(array(), array("USER_ID" => $arUserStart["ID"]));
			if ($db_res && $res = $db_res->Fetch()):
				$res["FORUM_USER_ID"] = intVal($res["ID"]);
				$res["ID"] = $res["USER_ID"];
			else:
				$db_res = CUser::GetByID($arResult["ELEMENT"]["~CREATED_BY"]);
				if ($db_res && $res = $db_res->Fetch()):
					$res["SHOW_NAME"] = COption::GetOptionString("forum", "USER_SHOW_NAME", "Y");
					$res["USER_PROFILE"] = "N";
				endif;
			endif;
			if (!empty($res)):
				$arUserStart = $res;
				$sName = ($res["SHOW_NAME"] == "Y" ? trim(CUser::FormatName($arParams["NAME_TEMPLATE"], $res, true, false)) : "");
				$arUserStart["NAME"] = (empty($sName) ? trim($res["LOGIN"]) : $sName);
			endif;
		}
		$arUserStart["NAME"] = (empty($arUserStart["NAME"]) ? $GLOBALS["FORUM_STATUS_NAME"]["guest"] : $arUserStart["NAME"]);
	//  Add Topic
		$DB->StartTransaction();
		$arFields = Array(
			"TITLE"			=> $arTopic["TITLE"],
			"TAGS"			=> $arTopic["TAGS"],
			"FORUM_ID"		=> $arParams["FORUM_ID"],
			"USER_START_ID"	=> $arUserStart["ID"],
			"USER_START_NAME" => $arUserStart["NAME"],
			"LAST_POSTER_NAME" => $arUserStart["NAME"],
			"XML_ID"		=> $arParams["ENTITY_XML_ID"],
			"APPROVED" 		=> "Y",
			"PERMISSION_EXTERNAL" => $arResult['USER']["PERMISSION"],
			"PERMISSION" 	=> $arResult['USER']["PERMISSION"],
		);

		$TID = CForumTopic::Add($arFields);
		if (intVal($TID) <= 0)
		{
			$arError[] = array(
				"code" => "topic is not created",
				"title" => GetMessage("F_ERR_ADD_TOPIC"));
		}
		else
		{
			foreach (GetModuleEvents('forum', 'OnAfterCommentTopicAdd', true) as $arEvent)
				ExecuteModuleEventEx($arEvent, array($arParams['ENTITY_TYPE'], $arParams['ENTITY_ID'], $TID));

			if ($arAllow["HTML"] != "Y")
				$arTopic['MESSAGE'] = strip_tags($arTopic['MESSAGE']);

			$arFields = Array(
				"POST_MESSAGE" => $arTopic['MESSAGE'],
				"AUTHOR_ID" => $arUserStart["ID"],
				"AUTHOR_NAME" => $arUserStart["NAME"],
				"FORUM_ID" => $arParams["FORUM_ID"],
				"TOPIC_ID" => $TID,
				"APPROVED" => "Y",
				"NEW_TOPIC" => "Y",
				"PARAM1" => $arParams['ENTITY_TYPE'],
				"PARAM2" => intVal($arParams["ENTITY_ID"]),
				"PERMISSION_EXTERNAL" => $arResult['USER']["PERMISSION"],
				"PERMISSION"	=> $arResult['USER']["PERMISSION"],
			);
			$GLOBALS["USER_FIELD_MANAGER"]->EditFormAddFields("FORUM_MESSAGE", $arFields);
			$res = CForumMessage::Add($arFields, false, array("SKIP_INDEXING" => "Y", "SKIP_STATISTIC" => "N"));

			if (intVal($res) <= 0)
			{
				$arError[] = array(
					"code" => "message is not added 1",
					"title" => GetMessage("F_ERR_ADD_MESSAGE"));
				CForumTopic::Delete($TID);
				$TID = 0;
			}
			elseif ($arParams["SUBSCRIBE_AUTHOR_ELEMENT"] == "Y" && intVal($arResult["ELEMENT"]["~CREATED_BY"]) > 0)
			{
				if ($arUserStart["USER_PROFILE"] == "N")
					$arUserStart["FORUM_USER_ID"] = CForumUser::Add(array("USER_ID" => $arResult["ELEMENT"]["~CREATED_BY"]));

				if (intVal($arUserStart["FORUM_USER_ID"]) > 0)
				{
					CForumSubscribe::Add(array(
						"USER_ID" => $arUserStart["ID"],
						"FORUM_ID" => $arParams["FORUM_ID"],
						"SITE_ID" => SITE_ID,
						"TOPIC_ID" => $TID,
						"NEW_TOPIC_ONLY" => "N")
					);
					BXClearCache(true, "/bitrix/forum/user/".$arUserStart["ID"]."/subscribe/");
				}
			}
		}
	// Second exit point
		if (!empty($arError)):
			$DB->Rollback();
			return false;
		else:
			$DB->Commit();
			$arResult["FORUM_TOPIC_ID"] = $TID;
		endif;
	}
		// Add post comment
	$arFieldsG = array(
		"POST_MESSAGE" => $arPost["MESSAGE"],
		"AUTHOR_NAME" => trim($post["REVIEW_AUTHOR"]),
		"AUTHOR_EMAIL" => $post["REVIEW_EMAIL"],
		"USE_SMILES" => (isset($post["REVIEW_USE_SMILES"]) ? $post["REVIEW_USE_SMILES"] : "N"),
		"PARAM2" => $arParams["ENTITY_ID"],
		"PERMISSION_EXTERNAL" => $arResult['USER']["PERMISSION"],
		"PERMISSION" 	=> $arResult['USER']["PERMISSION"],
	);

	if (isset($arPost['FILES']) && !empty($arPost['FILES']))
		$arFieldsG['FILES'] = $arPost['FILES'];
	$GLOBALS["USER_FIELD_MANAGER"]->EditFormAddFields("FORUM_MESSAGE", $arFieldsG);
	if ($_REQUEST['REVIEW_ACTION'] == "EDIT")
	{
		if (empty($arFieldsG["AUTHOR_NAME"]))
			unset($arFieldsG["AUTHOR_NAME"]);
		if (empty($arFieldsG["AUTHOR_EMAIL"]))
			unset($arFieldsG["AUTHOR_EMAIL"]);
	}
	$MID = ForumAddMessage(($TID > 0 ? $_REQUEST['REVIEW_ACTION'] : "NEW"), $arParams["FORUM_ID"], $TID, $MID, $arFieldsG,
		$strErrorMessage, $strOKMessage, false, $post["captcha_word"], 0, $post["captcha_code"], $arParams["NAME_TEMPLATE"]);
	if ($MID <= 0 || !empty($strErrorMessage))
	{
		$arError[] = array(
			"code" => "message is not added 2",
			"title" => (empty($strErrorMessage) ? GetMessage("F_ERR_ADD_MESSAGE") : $strErrorMessage));
		$arResult['RESULT'] = false;
		$arResult["OK_MESSAGE"] = '';
	}
	else
	{
		if ($TID <= 0):
			$res = CForumMessage::GetByID($MID);
			$TID = $arResult['FORUM_TOPIC_ID'] = intVal($res["TOPIC_ID"]);
		endif;
		if ($_REQUEST['REVIEW_ACTION'] == "EDIT")
		{
			foreach (GetModuleEvents('forum', 'OnAfterCommentUpdate', true) as $arEvent)
				ExecuteModuleEventEx($arEvent, array($arParams['ENTITY_TYPE'], $arParams['ENTITY_ID'],
					array("TOPIC_ID" => $TID, "MESSAGE_ID" => $MID, "ACTION" => "EDIT", "PARAMS" => $arFieldsG)));
		}
		else
		{
			foreach (GetModuleEvents('forum', 'OnAfterCommentAdd', true) as $arEvent)
			{
				ExecuteModuleEventEx($arEvent, array($arParams['ENTITY_TYPE'], $arParams['ENTITY_ID'],
					array("TOPIC_ID" => $TID, "MESSAGE_ID" => $MID, "PARAMS" => $arFieldsG)));
			}
		}

		$strOKMessage = GetMessage("COMM_COMMENT_OK");
		$arResult["FORUM_TOPIC_ID"] = intVal($arResult['FORUM_TOPIC_ID']);

		$dbRes = CForumTopic::GetList(null, array("FORUM_ID"=>$arParams['FORUM_ID'], "ID"=>$arResult["FORUM_TOPIC_ID"]));
		$arResult["TOPIC"] = $dbRes->Fetch();
		if ($arParams["AUTOSAVE"])
			$arParams["AUTOSAVE"]->Reset();
		// SUBSCRIBE
		if ($_REQUEST["TOPIC_SUBSCRIBE"] == "Y")
		{
			if ($_REQUEST["TOPIC_SUBSCRIBE"] == "Y")
				ForumSubscribeNewMessagesEx($arParams["FORUM_ID"], $arResult['FORUM_TOPIC_ID'], "N", $strErrorMessage, $strOKMessage);
			BXClearCache(true, "/bitrix/forum/user/".$GLOBALS["USER"]->GetID()."/subscribe/");
		}

		$strURL = (!empty($_REQUEST["back_page"]) ? $_REQUEST["back_page"] : $APPLICATION->GetCurPageParam("",
			array("MID", "SEF_APPLICATION_CUR_PAGE_URL", BX_AJAX_PARAM_ID, "result", "sessid", "bxajaxid")));
		$bNotModerated =  ($arResult["FORUM"]["MODERATION"] != "Y" || CForumNew::CanUserModerateForum($arParams["FORUM_ID"], $USER->GetUserGroupArray()));
		$strURL = ForumAddPageParams($strURL, array("MID" => $MID, "result" => ($bNotModerated ? "reply" : "not_approved")));
		$strURL .= ($bNotModerated ? "#message".$MID : "#reviewnote");

		if ($_REQUEST["NOREDIRECT"] != "Y" && $arParams['AJAX_MODE'] != 'Y')
			LocalRedirect($strURL);
		else
		{
			$arResult['RESULT'] = $MID;
			$strOKMessage = ($bNotModerated ? GetMessage("COMM_COMMENT_OK") : GetMessage("COMM_COMMENT_OK_AND_NOT_APPROVED"));
		}
	}
}
elseif ($_REQUEST["comment_review"] == "Y") // preview
{
	$arResult['DO_NOT_CACHE'] = true;
	$arParams['SHOW_MINIMIZED'] = 'N';
	$arAllow["SMILES"] = ($post["REVIEW_USE_SMILES"] !="Y" ? "N" : $arResult["FORUM"]["ALLOW_SMILES"]);
	$arResult["MESSAGE_VIEW"] = array(
		"POST_MESSAGE_TEXT" => $parser->convert($post["REVIEW_TEXT"], $arAllow),
		"AUTHOR_NAME" => htmlspecialcharsEx($arResult["USER"]["SHOWED_NAME"]),
		"AUTHOR_ID" => intVal($USER->GetID()),
		"AUTHOR_URL" => CComponentEngine::MakePathFromTemplate($arParams["URL_TEMPLATES_PROFILE_VIEW"], array("UID" => $USER->GetID())),
		"POST_DATE" => CForumFormat::DateFormat($arParams["DATE_TIME_FORMAT"], time()+CTimeZone::GetOffset()),
		"FILES" => array());

	foreach (GetModuleEvents('forum', 'OnCommentPreview', true) as $arEvent)
		$result = ExecuteModuleEventEx($arEvent);

	if (isset($arResult['ERROR']))
		$arError = array_merge($arError, $arResult['ERROR']);
	else
		if ($arParams["AUTOSAVE"])
			$arParams["AUTOSAVE"]->Reset();

}
elseif (isset($_REQUEST['REVIEW_ACTION']) && $_REQUEST['MID'] > 0)
{
	$arFields = array("MID" => intval($_REQUEST['MID']));
	if (!empty($arParams["PERMISSION"]))
		$arFields["PERMISSION"] = $arParams["PERMISSION"];
	if ($_REQUEST['REVIEW_ACTION'] == "EDIT" || $_REQUEST['REVIEW_ACTION'] == "DEL")
		$arFields["PERMISSION"] = "U";
	if (ForumActions($_REQUEST['REVIEW_ACTION'], $arFields, $strErrorMessage, $strOKMessage))
	{
		foreach (GetModuleEvents('forum', 'OnAfterCommentUpdate', true) as $arEvent)
			ExecuteModuleEventEx($arEvent, array($arParams['ENTITY_TYPE'], $arParams['ENTITY_ID'],
				array("TOPIC_ID" => $TID, "MESSAGE_ID" => $_REQUEST['MID'], "ACTION" => $_REQUEST['REVIEW_ACTION'], "PARAMS" => $arFields)));

		if ($_REQUEST["NOREDIRECT"] != "Y" && $arParams['AJAX_MODE'] != 'Y')
			LocalRedirect($APPLICATION->GetCurPageParam("", array("REVIEW_ACTION", "sessid", "MID", "bxajaxid")));
		else
			$arResult['RESULT'] = $_REQUEST['MID'];
	}
	else
	{
		$arError[] = array(
			"code" => "message is changed",
			"title" => $strErrorMessage);

	}
}
?>
