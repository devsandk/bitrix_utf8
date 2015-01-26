<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
	die();

/**
 * Bitrix vars
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @param array $arParams
 * @param array $arResult
 * @param CBitrixComponent $this
 */

if(!$USER->CanDoOperation('view_event_log'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

/** @var CEventMain[] $arModuleObjects */
$arModuleObjects = array();
$arAllFilter = array();

foreach(GetModuleEvents("main", "OnEventLogGetAuditHandlers", true) as $arEvent)
{
	$ModuleEvent = ExecuteModuleEventEx($arEvent);
	$arModuleObjects[] = $ModuleEvent;
	$arAllFilter = $arAllFilter + $ModuleEvent->GetFilter();
}
if (is_array($arParams["FILTER"]))
{
	foreach($arParams["FILTER"] as $key => $val)
	{
		$arResult["ActiveFeatures"][$val] = $arAllFilter[$val];
	}
}
if (is_array($arResult["ActiveFeatures"]) && count($arResult["ActiveFeatures"]) > 0)
{
	$arResult["NO_ACTIVE_FEATURES"] = false;
	if (!isset($_REQUEST["flt_event_id"]))
	{
		$arParams["EVENT_ID"] = CUserOptions::GetOption("main", "~event_list");
		$flt_event_id = (empty($arParams["EVENT_ID"])) ? $arParams["FILTER"] : $arParams["EVENT_ID"];
	}
	else
	{
		$arResult["flt_event_id"] = $_REQUEST["flt_event_id"];
		if (array_key_exists("flt_event_id_all", $_REQUEST) && $_REQUEST["flt_event_id_all"] == "Y")
		{
			$arParams["EVENT_ID"] = "";
			$flt_event_id = $arParams["FILTER"];
			if($USER->IsAuthorized() && check_bitrix_sessid())
				CUserOptions::DeleteOption("main", "~event_list");
		}
		else
		{
			$flt_event_id = $_REQUEST["flt_event_id"];    // checked events
			foreach($flt_event_id as $key => $val)
				$flt_event_id[$key] = htmlspecialcharsbx($val);
			$arParams["EVENT_ID"] = $flt_event_id;
			if($USER->IsAuthorized() && check_bitrix_sessid())
				CUserOptions::SetOption("main", "~event_list", $arParams["EVENT_ID"]);
		}
	}
	$arObjectTypes = array();
	$arFilter["MODULE_ITEM"] = array();           //filter for GetList
	foreach($arModuleObjects as $key => $val)
	{
		$arObjectTypes[$key] = $val->GetAuditTypes();

		$ar = $val->GetFilter();
		$filters = array_keys($ar);
		$var = array_intersect($filters, $flt_event_id);
		if ($var)
		{
			if(isset($ar["IBLOCK"]))
			{
				//iblock has more complex structure because logs are kept for individual blocks
				$var = $filters;
			}
			$arFilter["MODULE_ITEM"] = array_merge($arFilter["MODULE_ITEM"], $val->GetFilterSQL($var));
		}
	}

	//USER
	if (is_array($_REQUEST["flt_created_by_id"]))
		$_REQUEST["flt_created_by_id"] = $_REQUEST["flt_created_by_id"][0];

	$find_user_id = "";
	if (intval($_REQUEST["flt_created_by_id"]) > 0)
	{
		$find_user_id = $_REQUEST["flt_created_by_id"];
	}
	else
	{
		if (CModule::IncludeModule("socialnetwork"))
		{
			$arFoundUsers = CSocNetUser::SearchUser($_REQUEST["flt_created_by_id"], false);
			if (is_array($arFoundUsers) && count($arFoundUsers) > 0)
				$find_user_id = key($arFoundUsers);
		}
	}
	// for date
	if (
		array_key_exists("flt_date_datesel", $_REQUEST)
		&& strlen($_REQUEST["flt_date_datesel"]) > 0
	)
	{
		$_REQUEST["flt_date_datesel"] = htmlspecialcharsbx($_REQUEST["flt_date_datesel"]);
		switch($_REQUEST["flt_date_datesel"])
		{
			case "today":
				$arParams["LOG_DATE_FROM"] = $arParams["LOG_DATE_TO"] = ConvertTimeStamp();
				break;
			case "yesterday":
				$arParams["LOG_DATE_FROM"] = $arParams["LOG_DATE_TO"] = ConvertTimeStamp(time()-86400);
				break;
			case "week":
				$day = date("w");
				if($day == 0)
					$day = 7;
				$arParams["LOG_DATE_FROM"] = ConvertTimeStamp(time()-($day-1)*86400);
				$arParams["LOG_DATE_TO"] = ConvertTimeStamp(time()+(7-$day)*86400);
				break;
			case "week_ago":
				$day = date("w");
				if($day == 0)
				$day = 7;
				$arParams["LOG_DATE_FROM"] = ConvertTimeStamp(time()-($day-1+7)*86400);
				$arParams["LOG_DATE_TO"] = ConvertTimeStamp(time()-($day)*86400);
				break;
			case "month":
				$arParams["LOG_DATE_FROM"] = ConvertTimeStamp(mktime(0, 0, 0, date("n"), 1));
				$arParams["LOG_DATE_TO"] = ConvertTimeStamp(mktime(0, 0, 0, date("n")+1, 0));
				break;
			case "month_ago":
				$arParams["LOG_DATE_FROM"] = ConvertTimeStamp(mktime(0, 0, 0, date("n")-1, 1));
				$arParams["LOG_DATE_TO"] = ConvertTimeStamp(mktime(0, 0, 0, date("n"), 0));
				break;
			case "days":
				$arParams["LOG_DATE_FROM"] = ConvertTimeStamp(time() - intval($_REQUEST["flt_date_days"])*86400);
				$arParams["LOG_DATE_TO"] = "";
				break;
			case "exact":
				$arParams["LOG_DATE_FROM"] = $arParams["LOG_DATE_TO"] = $_REQUEST["flt_date_from"];
				break;
			case "after":
				$arParams["LOG_DATE_FROM"] = $_REQUEST["flt_date_from"];
				$arParams["LOG_DATE_TO"] = "";
				break;
			case "before":
				$arParams["LOG_DATE_FROM"] = "";
				$arParams["LOG_DATE_TO"] = $_REQUEST["flt_date_to"];
				break;
			case "interval":
				$arParams["LOG_DATE_FROM"] = $_REQUEST["flt_date_from"];
				$arParams["LOG_DATE_TO"] = $_REQUEST["flt_date_to"];
				break;
		}
	}
	elseif (array_key_exists("flt_date_datesel", $_REQUEST))
	{
		$arParams["LOG_DATE_FROM"] = "";
		$arParams["LOG_DATE_TO"] = "";
	}
	else
	{
		if (array_key_exists("flt_date_from", $_REQUEST))
		{
			$_REQUEST["flt_date_from"] = htmlspecialcharsbx($_REQUEST["flt_date_from"]);
			$arParams["LOG_DATE_FROM"] = trim($_REQUEST["flt_date_from"]);
		}
		if (array_key_exists("flt_date_to", $_REQUEST))
		{
			$_REQUEST["flt_date_to"] = htmlspecialcharsbx($_REQUEST["flt_date_to"]);
			$arParams["LOG_DATE_TO"] = trim($_REQUEST["flt_date_to"]);
		}
	}
	//=============End date

	function CheckFilter()
	{
		if(strlen($_REQUEST["flt_date_from"])>0)
		{
			if(!CheckDateTime($_REQUEST["flt_date_from"], CSite::GetDateFormat("FULL")))
				return false;
		}
		if(strlen($_REQUEST["flt_date_to"])>0)
		{
			if(!CheckDateTime($_REQUEST["flt_date_to"], CSite::GetDateFormat("FULL")))
				return false;
		}
		return true;
	}

	if(CheckFilter())
	{
		if ($arFilter["MODULE_ITEM"] != "")
			$arEventFilter["=MODULE_ITEM"] = $arFilter["MODULE_ITEM"];
		if ($arParams["LOG_DATE_FROM"] != "")
			$arEventFilter["TIMESTAMP_X_1"] = $arParams["LOG_DATE_FROM"]." 00.00.00";
		if ($arParams["LOG_DATE_TO"] != "")
			$arEventFilter["TIMESTAMP_X_2"] = $arParams["LOG_DATE_TO"]." 23.59.59";
		$arEventFilter["USER_ID"] =  ($find != '' && $find_type == "user_id" ? $find : $find_user_id);

		$nameFormat = CSite::GetNameFormat(false);
		$dateFormat = CSite::GetDateFormat('SHORT');
		$timeFormat = CSite::GetTimeFormat();

		$arUsersTmp = array();

		$arNavParams = array("nPageSize"=>$arParams["PAGE_NUM"], "bShowAll"=>false);
		$results = CEventLog::GetList(array('TIMESTAMP_X' => 'DESC'), $arEventFilter, $arNavParams);
		$results->NavStart($arNavParams);  //page navigation
		$arResult["NAV"] = $results;
		while($row = $results->NavNext())
		{
			if (!isset($arUsersTmp[$row['USER_ID']]))
			{
				$arUserInfo = array();
				$rsUser = CUser::GetList(($by=""), ($ord=""),
					array("ID_EQUAL_EXACT" => intval($row['USER_ID'])),
					array("FIELDS" => array('ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'LOGIN', 'EMAIL', 'PERSONAL_PHOTO'))
				);
				if($arUser = $rsUser->GetNext())
				{
					$arUserInfo["ID"] = $row['USER_ID'];
					$arUserInfo["FULL_NAME"] = CUser::FormatName($nameFormat, $arUser, true, false);
					$arUserInfo['avatar'] = CFile::ResizeImageGet(
						$arUser["PERSONAL_PHOTO"],
						array("width"=>30, "height"=>30),
						BX_RESIZE_IMAGE_EXACT,
						false
					);
					$arUsersTmp[$row['USER_ID']] = $arUserInfo;
				}
			}
			else
			{
				$arUserInfo = $arUsersTmp[$row['USER_ID']];
			}

			$dateFormated = FormatDateFromDB($row["TIMESTAMP_X"], $dateFormat);
			$time = FormatDateFromDB($row["TIMESTAMP_X"], $timeFormat);
			foreach($arModuleObjects as $key => $val)
			{
				if (isset($arObjectTypes[$key][$row['AUDIT_TYPE_ID']]))
				{
					$res = $val->GetEventInfo($row, $arParams, $arUserInfo, $arResult["ActiveFeatures"]);
					$res['time'] = $time;
					$res['user'] = array(
						"name" => $arUserInfo["FULL_NAME"],
						"id" => $arUserInfo["ID"],
						"avatar" => $arUserInfo["avatar"]["src"]);
					$arResult['EVENT'][$dateFormated][] = $res;
					break;
				}
			}
		}
	}
}
else
{
	$arResult["NO_ACTIVE_FEATURES"] = true;
}

$this->IncludeComponentTemplate();
