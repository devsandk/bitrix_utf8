<?
$langs = CLanguage::GetList(($b=""), ($o=""));
while($lang = $langs->Fetch())
{
	$lid = $lang["LID"];
	IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/events.php", $lid);

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "NEW_BLOG_MESSAGE",
		"NAME" => GetMessage("NEW_BLOG_MESSAGE_NAME"),
		"DESCRIPTION" => GetMessage("NEW_BLOG_MESSAGE_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "NEW_BLOG_COMMENT",
		"NAME" => GetMessage("NEW_BLOG_COMMENT_NAME"),
		"DESCRIPTION" => GetMessage("NEW_BLOG_COMMENT_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "NEW_BLOG_COMMENT2COMMENT",
		"NAME" => GetMessage("NEW_BLOG_COMMENT2COMMENT_NAME"),
		"DESCRIPTION" => GetMessage("NEW_BLOG_COMMENT2COMMENT_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "NEW_BLOG_COMMENT_WITHOUT_TITLE",
		"NAME" => GetMessage("NEW_BLOG_COMMENT_WITHOUT_TITLE_NAME"),
		"DESCRIPTION" => GetMessage("NEW_BLOG_COMMENT_WITHOUT_TITLE_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "NEW_BLOG_COMMENT2COMMENT_WITHOUT_TITLE",
		"NAME" => GetMessage("NEW_BLOG_COMMENT2COMMENT_WITHOUT_TITLE_NAME"),
		"DESCRIPTION" => GetMessage("NEW_BLOG_COMMENT2COMMENT_WITHOUT_TITLE_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "BLOG_YOUR_BLOG_TO_USER",
		"NAME" => GetMessage("BLOG_YOUR_BLOG_TO_USER_NAME"),
		"DESCRIPTION" => GetMessage("BLOG_YOUR_BLOG_TO_USER_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "BLOG_YOU_TO_BLOG",
		"NAME" => GetMessage("BLOG_YOU_TO_BLOG_NAME"),
		"DESCRIPTION" => GetMessage("BLOG_YOU_TO_BLOG_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "BLOG_BLOG_TO_YOU",
		"NAME" => GetMessage("BLOG_BLOG_TO_YOU_NAME"),
		"DESCRIPTION" => GetMessage("BLOG_BLOG_TO_YOU_DESC"),
	));

	$et = new CEventType;
	$et->Add(array(
		"LID" => $lid,
		"EVENT_NAME" => "BLOG_USER_TO_YOUR_BLOG",
		"NAME" => GetMessage("BLOG_USER_TO_YOUR_BLOG_NAME"),
		"DESCRIPTION" => GetMessage("BLOG_USER_TO_YOUR_BLOG_DESC"),
	));

	$arSites = array();
	$sites = CSite::GetList(($b=""), ($o=""), Array("LANGUAGE_ID"=>$lid));
	while ($site = $sites->Fetch())
		$arSites[] = $site["LID"];

	if(count($arSites) > 0)
	{

		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "NEW_BLOG_MESSAGE",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("NEW_BLOG_MESSAGE_SUBJECT"),
			"MESSAGE" => GetMessage("NEW_BLOG_MESSAGE_MESSAGE"),
			"BODY_TYPE" => "text",
		));

		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "NEW_BLOG_COMMENT",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("NEW_BLOG_COMMENT_SUBJECT"),
			"MESSAGE" => GetMessage("NEW_BLOG_COMMENT_MESSAGE"),
			"BODY_TYPE" => "text",
		));

		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "NEW_BLOG_COMMENT2COMMENT",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("NEW_BLOG_COMMENT2COMMENT_SUBJECT"),
			"MESSAGE" => GetMessage("NEW_BLOG_COMMENT2COMMENT_MESSAGE"),
			"BODY_TYPE" => "text",
		));
	
		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "NEW_BLOG_COMMENT_WITHOUT_TITLE",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("NEW_BLOG_COMMENT_WITHOUT_TITLE_SUBJECT"),
			"MESSAGE" => GetMessage("NEW_BLOG_COMMENT_WITHOUT_TITLE_MESSAGE"),
			"BODY_TYPE" => "text",
		));
	
		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "NEW_BLOG_COMMENT2COMMENT_WITHOUT_TITLE",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("NEW_BLOG_COMMENT2COMMENT_WITHOUT_TITLE_SUBJECT"),
			"MESSAGE" => GetMessage("NEW_BLOG_COMMENT2COMMENT_WITHOUT_TITLE_MESSAGE"),
			"BODY_TYPE" => "text",
		));
		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "BLOG_YOUR_BLOG_TO_USER",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("BLOG_YOUR_BLOG_TO_USER_SUBJECT"),
			"MESSAGE" => GetMessage("BLOG_YOUR_BLOG_TO_USER_MESSAGE"),
			"BODY_TYPE" => "text",
		));		
		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "BLOG_YOU_TO_BLOG",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("BLOG_YOU_TO_BLOG_SUBJECT"),
			"MESSAGE" => GetMessage("BLOG_YOU_TO_BLOG_MESSAGE"),
			"BODY_TYPE" => "text",
		));
		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "BLOG_BLOG_TO_YOU",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("BLOG_BLOG_TO_YOU_SUBJECT"),
			"MESSAGE" => GetMessage("BLOG_BLOG_TO_YOU_MESSAGE"),
			"BODY_TYPE" => "text",
		));
		$emess = new CEventMessage;
		$emess->Add(array(
			"ACTIVE" => "Y",
			"EVENT_NAME" => "BLOG_USER_TO_YOUR_BLOG",
			"LID" => $arSites,
			"EMAIL_FROM" => "#EMAIL_FROM#",
			"EMAIL_TO" => "#EMAIL_TO#",
			"SUBJECT" => GetMessage("BLOG_USER_TO_YOUR_BLOG_SUBJECT"),
			"MESSAGE" => GetMessage("BLOG_USER_TO_YOUR_BLOG_MESSAGE"),
			"BODY_TYPE" => "text",
		));
	}
}
?>
