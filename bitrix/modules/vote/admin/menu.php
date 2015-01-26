<?
IncludeModuleLangFile(__FILE__);

if($APPLICATION->GetGroupRight("vote")!="D")
{
/*
	$__rsChannel = CVoteChannel::GetList($xby="s_name", $xorder="asc", Array(), $is_filtered);
	while($__arChannel = $__rsChannel -> Fetch())
	{
		$channels[] = Array(
			"text" => $__arChannel["TITLE"],
			"url" => "vote_list.php?lang=".LANGUAGE_ID."&find_channel_id=".$__arChannel["ID"]."&set_filter=Y",
			"more_url" => Array(),
			"title" => GetMessage("VOTE_GROUP_LST").$__arChannel["TITLE"]
		);
	}
*/

	CModule::IncludeModule('vote');
	$menuResults = array();
	if (method_exists($this, "IsSectionActive") && $this->IsSectionActive("menu_vote_channels") || defined('BX_ADMIN_FORM_MENU_OPEN') && BX_ADMIN_FORM_MENU_OPEN == 1)
	{
		$by = "s_c_sort";
		$order = "asc";
		$rChannels = CVoteChannel::GetList($by, $order, $arFilter, $is_filtered);
		while ($arChannel = $rChannels->Fetch())
		{
			if (intval($arChannel["VOTES"]) > 0)
			{
				$menuChannel = array(
					"text" => htmlspecialcharsEx($arChannel["TITLE"]),
					"url" => "vote_user_votes_table.php?lang=".LANGUAGE_ID."&CHANNEL_ID=".$arChannel['ID'],
					"module_id" => "vote",
					"page_icon" => "vote_page_icon",
					"items_id" => "vote_channel_".$arChannel["ID"],
					"items" => array()
				);
				$obVote = CVote::GetList($by , $order, array("CHANNEL_ID"=>$arChannel["ID"]), $is_filtered);
				while ($arVote = $obVote->GetNext())
				{
					$menuVote = array(
						"items_id" => "vote_channel_".$arChannel["ID"],
						"text" => $arVote["TITLE"],
						"title" => GetMessage("VOTE_MENU_POLL_DESCRIPTION").'\''.htmlspecialcharsEx($arVote["TITLE"]).'\'',
						"module_id" => "vote",
						"url" => "vote_user_votes_table.php?lang=".LANGUAGE_ID."&VOTE_ID=".$arVote['ID'],
					);
					$menuChannel["items"][] = $menuVote;
				}
				$menuResults[] = $menuChannel;
			}
		}
	}
	$aMenu = array(
		"parent_menu" => "global_menu_services",
		"section" => "vote",
		"sort" => 100,
		"module_id" => "vote",
		"text" => GetMessage("VOTE_MENU_MAIN"),
		"title" => GetMessage("VOTE_MENU_MAIN_TITLE"),
		"icon" => "vote_menu_icon",
		"page_icon" => "vote_page_icon",
		"items_id" => "menu_vote",
		"items" => array(
			array(
				"text" => GetMessage("VOTE_MENU_CHANNEL"),
				"url" => "vote_channel_list.php?lang=".LANGUAGE_ID,
				"title" => GetMessage("VOTE_MENU_CHANNEL_ALT"),
//				"items_id" => "menu_vote_groups",
//				"items" => $channels,
				"more_url" => Array(
					"vote_channel_edit.php"
				)
			),
			array(
				"text" => GetMessage("VOTE_MENU_VOTE"),
				"url" => "vote_list.php?lang=".LANGUAGE_ID,
				"more_url" => Array(
					"vote_edit.php",
					"vote_question_list.php",
					"vote_question_edit.php",
					"vote_results.php",
					"vote_preview.php",
				),
				"title" => GetMessage("VOTE_MENU_VOTE_ALT"),
			),
			array(
				"text" => GetMessage("VOTE_MENU_USER"),
				"url" => "vote_user_list.php?lang=".LANGUAGE_ID,
				"more_url" => Array(),
				"title" => GetMessage("VOTE_MENU_USER_ALT")
			),
			array(
				"text" => GetMessage("VOTE_MENU_RESULT"),
				"items_id" => "menu_vote_channels",
				"module_id" => "vote",
				"url" => "vote_user_votes.php?lang=".LANGUAGE_ID,
				"dynamic" => true,
				"more_url" => Array("vote_user_results.php", "vote_user_results_table.php"),
				"title" => GetMessage("VOTE_MENU_RESULT_ALT"),
				"items" => $menuResults
			)
		)
	);
	return $aMenu;
}
return false;
?>
