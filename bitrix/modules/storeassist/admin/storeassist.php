<?
##############################################
# Bitrix: SiteManager                        #
# Copyright (c) 2002-2014 Bitrix             #
# http://www.bitrixsoft.com                  #
# mailto:admin@bitrixsoft.com                #
##############################################
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/storeassist/include.php");

IncludeModuleLangFile(__FILE__);
\Bitrix\Main\Loader::includeModule('storeassist');

if (!($APPLICATION->GetGroupRight("storeassist") >= "R"))
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/storeassist/prolog.php");

$APPLICATION->SetTitle(GetMessage("STOREAS_TITLE"));

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$APPLICATION->SetAdditionalCSS('/bitrix/panel/storeassist/storeassist.css');

CUtil::InitJSCore(array("fx", "storeassist"));

$catalogIblockId = "";
if (Bitrix\Main\Loader::includeModule("catalog"))
{
	$dbCatalog = CCatalog::getList(array(), array(
		"IBLOCK_ACTIVE" => "Y",
		"IBLOCK_TYPE_ID" => "catalog"
	));
	if ($arCatalog = $dbCatalog->Fetch())
	{
		$catalogIblockId = $arCatalog["IBLOCK_ID"];
	}
}

$arAssistSteps = array(
	"MAIN" => array(
		"BLOCKS" => array(
			"BLOCK_1" => array(
				"MAIN_ITEMS" => array(
					"currencies" => "/bitrix/admin/currencies.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask",
					"cat_group_admin" => "/bitrix/admin/cat_group_admin.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask",
					"cat_measure_list" => "/bitrix/admin/cat_measure_list.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask",
					"sale_report_edit" => "/bitrix/admin/sale_report_edit.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask",
					"sale_person_type" => "/bitrix/admin/sale_person_type.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask",
				//	"locations" => "/bitrix/admin/sale_location_admin.php?lang=".LANGUAGE_ID."#showtask", //TODO pageId
					"sale_buyers" => "/bitrix/admin/sale_buyers.php?lang=".LANGUAGE_ID."&pageid=sale_buyers&back=main_block_1#showtask",
					"sale_status" => "/bitrix/admin/sale_status.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask",
					"cat_store_list" => "/bitrix/admin/cat_store_list.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask",
					"storeassist_social" => "/bitrix/admin/storeassist_social.php?lang=".LANGUAGE_ID."&back=main_block_1#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_2" => array(
				"MAIN_ITEMS" => array(
					"cat_product_list" => (intval($catalogIblockId)) ? "/bitrix/admin/cat_product_list.php?lang=".LANGUAGE_ID."&IBLOCK_ID=".$catalogIblockId."&type=catalog&find_section_section=-1" : "/bitrix/admin/storeassist_new_items.php?lang=".LANGUAGE_ID."&pageid=cat_product_list&back=main_block_2#showtask",
					"quantity" => "/bitrix/admin/settings.php?lang=".LANGUAGE_ID."&mid=catalog&pageid=quantity&back=main_block_2#showtask",
					"cat_store_document_list" => "/bitrix/admin/cat_store_document_list.php?lang=".LANGUAGE_ID."&back=main_block_2#showtask",
					"order_setting" => "/bitrix/admin/settings.php?lang=".LANGUAGE_ID."&mid=sale&pageid=order_setting&back=main_block_2#showtask",
					"reserve_setting" => "/bitrix/admin/settings.php?lang=".LANGUAGE_ID."&mid=catalog&pageid=reserve_setting&back=main_block_2#showtask"
				),
				"ADDITIONAL_ITEMS" => array(),
				"TYPE" => "ONE"
			),
			"BLOCK_3" => array(
				"MAIN_ITEMS" => array(
					"storeassist_1c_catalog_fill" =>  "/bitrix/admin/storeassist_1c_catalog_fill.php?lang=".LANGUAGE_ID."&back=main_block_3#showtask",
					"1c_integration" => "/bitrix/admin/1c_admin.php?lang=".LANGUAGE_ID."&pageid=1c_integration&back=main_block_3#showtask",
					"storeassist_1c_unloading" => "/bitrix/admin/storeassist_1c_unloading.php?lang=".LANGUAGE_ID."&back=main_block_3#showtask",
					"1c_exchange" => "/bitrix/admin/1c_admin.php?lang=".LANGUAGE_ID."&pageid=1c_exchange&back=main_block_3#showtask",
					"storeassist_1c_exchange_realtime" => "/bitrix/admin/storeassist_1c_exchange_realtime.php?lang=".LANGUAGE_ID."&back=main_block_3#showtask",
					"storeassist_1c_small_firm" => "/bitrix/admin/storeassist_1c_small_firm.php?lang=".LANGUAGE_ID."&back=main_block_3#showtask"
				),
				"ADDITIONAL_ITEMS" => array(),
				"TYPE" => "TWO"
			),
			"BLOCK_4" => array(
				"MAIN_ITEMS" => array(
					"sale_pay_system" => "/bitrix/admin/sale_pay_system.php?lang=".LANGUAGE_ID."&back=main_block_4#showtask",
					"sale_delivery" => "/bitrix/admin/sale_delivery.php?lang=".LANGUAGE_ID."&back=main_block_4#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_5" => array(
				"MAIN_ITEMS" => array(
					"storeassist_seo_settings" => "/bitrix/admin/storeassist_seo_settings.php?lang=".LANGUAGE_ID."&back=main_block_5#showtask",
					"seo_robots" => "/bitrix/admin/seo_robots.php?lang=".LANGUAGE_ID."&back=main_block_5#showtask",
					"seo_sitemap" => "/bitrix/admin/seo_sitemap.php?lang=".LANGUAGE_ID."&back=main_block_5#showtask",
					"seo_search_yandex" => "/bitrix/admin/seo_search_yandex.php?lang=".LANGUAGE_ID."&back=main_block_5#showtask",
					"seo_search_google" => "/bitrix/admin/seo_search_google.php?lang=".LANGUAGE_ID."&back=main_block_5#showtask",
					"search_reindex" => "/bitrix/admin/search_reindex.php?lang=".LANGUAGE_ID."&back=main_block_5#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			)
		)
	),
	"WORK" => array(
		"BLOCKS" => array(
			"BLOCK_1" => array(
				"MAIN_ITEMS" => array(
					"storeassist_adaptive" => "/bitrix/admin/storeassist_adaptive.php?lang=".LANGUAGE_ID."&back=work_block_1#showtask",
					"opening" => "/bitrix/admin/settings.php?lang=".LANGUAGE_ID."&mid=main&pageid=opening&back=work_block_1#showtask",
					"checklist" => "/bitrix/admin/checklist.php?lang=".LANGUAGE_ID."&back=work_block_1#showtask",
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_2" => array(
				"MAIN_ITEMS" => array(
				//	"storeassist_context_adv" => "/bitrix/admin/storeassist_context_adv.php?lang=".LANGUAGE_ID."&back=work_block_2#showtask",
					"cat_discount_admin" => "/bitrix/admin/cat_discount_admin.php?lang=".LANGUAGE_ID."&back=work_block_2#showtask",
				//	"storeassist_marketing" => "/bitrix/admin/storeassist_marketing.php?lang=".LANGUAGE_ID."&back=work_block_2#showtask",
					"posting_admin" => "/bitrix/admin/posting_admin.php?lang=".LANGUAGE_ID."&back=work_block_2#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_3" => array(
				"MAIN_ITEMS" => array(
					"cat_export_setup" => "/bitrix/admin/cat_export_setup.php?lang=".LANGUAGE_ID."&back=work_block_3#showtask",
					"sale_ymarket" => "/bitrix/admin/sale_ymarket.php?lang=".LANGUAGE_ID."&back=work_block_3#showtask",
					//"ebay" => ""//TODO pageId
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_4" => array(
				"MAIN_ITEMS" => array(
					"sale_order" => "/bitrix/admin/sale_order.php?lang=".LANGUAGE_ID."&back=work_block_4#showtask",
					"sale_report" => "/bitrix/admin/sale_report.php?lang=".LANGUAGE_ID."&back=work_block_4#showtask",
					//"storeassist_print" => "/bitrix/admin/storeassist_print.php?lang=".LANGUAGE_ID."&back=work_block_4#showtask",
					"client" => "/bitrix/admin/sale_buyers.php?lang=".LANGUAGE_ID."&pageid=client&back=work_block_4",
					"sale_account_admin" => "/bitrix/admin/sale_account_admin.php?lang=".LANGUAGE_ID."&back=work_block_4#showtask",
					"sale_basket" => "/bitrix/admin/sale_basket.php?lang=".LANGUAGE_ID."&back=work_block_4#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			/*"BLOCK_5" => array(
				"MAIN_ITEMS" => array(
					"personalization" => ""//TODO pageId
				),
				"ADDITIONAL_ITEMS" => array()
			),*/
			"BLOCK_6" => array(
				"MAIN_ITEMS" => array(
					"blog_comment" => "/bitrix/admin/blog_comment.php?lang=".LANGUAGE_ID."&back=work_block_6#showtask",
					"ticket_desktop" => "/bitrix/admin/ticket_desktop.php?lang=".LANGUAGE_ID."&back=work_block_6#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_7" => array(
				"MAIN_ITEMS" => array(
					"sale_crm" => "/bitrix/admin/sale_crm.php?lang=".LANGUAGE_ID."&back=work_block_6#showtask",
					"storeassist_crm_client" => "/bitrix/admin/storeassist_crm_client.php?lang=".LANGUAGE_ID."&back=work_block_7#showtask",
					"storeassist_crm_calls" => "/bitrix/admin/storeassist_crm_calls.php?lang=".LANGUAGE_ID."&back=work_block_7#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			)
		)
	),
	"HEALTH" => array(
		"BLOCKS" => array(
			"BLOCK_1" => array(
				"MAIN_ITEMS" => array(
					"site_speed" => "/bitrix/admin/site_speed.php?lang=".LANGUAGE_ID."&back=health_block_1#showtask",
					"composite" => "/bitrix/admin/composite.php?lang=".LANGUAGE_ID."&back=health_block_1#showtask",
					"bitrixcloud_cdn" => "/bitrix/admin/bitrixcloud_cdn.php?lang=".LANGUAGE_ID."&back=health_block_1#showtask",
					"perfmon_panel" => "/bitrix/admin/perfmon_panel.php?lang=".LANGUAGE_ID."&back=health_block_1#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_2" => array(
				"MAIN_ITEMS" => array(
					"security_filter" => "/bitrix/admin/security_filter.php?lang=".LANGUAGE_ID."&back=health_block_2#showtask",
					"dump_auto" => "/bitrix/admin/dump_auto.php?lang=".LANGUAGE_ID."&back=health_block_2#showtask",
					"security_scanner" => "/bitrix/admin/security_scanner.php?lang=".LANGUAGE_ID."&back=health_block_2#showtask",
					"bitrixcloud_monitoring_admin" => "/bitrix/admin/bitrixcloud_monitoring_admin.php?lang=".LANGUAGE_ID."&back=health_block_2#showtask",
					"security_otp" => "/bitrix/admin/security_otp.php?lang=".LANGUAGE_ID."&back=health_block_2#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_3" => array(
				"MAIN_ITEMS" => array(
					"scale_graph" => "/bitrix/admin/scale_graph.php?lang=".LANGUAGE_ID."&back=health_block_3#showtask",
					"cluster_index" => "/bitrix/admin/cluster_index.php?lang=".LANGUAGE_ID."&back=health_block_3#showtask",
					"storeassist_virtual" => "/bitrix/admin/storeassist_virtual.php?lang=".LANGUAGE_ID."&back=health_block_3#showtask"
				),
				"ADDITIONAL_ITEMS" => array()
			),
			"BLOCK_4" => array(
				"MAIN_ITEMS" => array(
					"site_checker" => "/bitrix/admin/site_checker.php?lang=".LANGUAGE_ID."&back=health_block_4#showtask",
					"info_vk" => "https://vk.com/topic-23581648_24910930",
					"info_blog" => "http://dev.1c-bitrix.ru/community/blogs/product_features/",
					"info_forum_guest" =>  "http://dev.1c-bitrix.ru/community/forums/forum6/",
					"info_forum_client" => "http://dev.1c-bitrix.ru/community/forums/forum7/",
					"info_idea" => "http://idea.1c-bitrix.ru/category/bitrix/",
					"info_user_doc" => "http://dev.1c-bitrix.ru/user_help/",
					"info_api_doc" => "https://dev.1c-bitrix.ru/api_help/",
					"support_bitrix" => "https://www.1c-bitrix.ru/support/",
					"info_courses" =>  "http://dev.1c-bitrix.ru/learning/index.php",
				),
				"ADDITIONAL_ITEMS" => array()
			)
		)
	)
);

//add partner url link if exists
$partnerUrl = Bitrix\Main\Config\Option::get("storeassist", "partner_url", "");
if ($partnerUrl)
{
	$arAssistSteps["HEALTH"]["BLOCKS"]["BLOCK_4"]["MAIN_ITEMS"]["support_developer"] = htmlspecialcharsbx($partnerUrl);
}

//option of checked items
$arStoreAssistOption = CStoreAssist::getSettingOption();

//check Opening item
if (!in_array("opening", $arStoreAssistOption))
{
	if(Bitrix\Main\Config\Option::get("main", "site_stopped", "N")=="N")
	{
		CStoreAssist::setSettingOption("opening", "Y");
		$arStoreAssistOption[] = "opening";
	}
}

//count checked percent and number of items
$assistTotalCount = 0;
$assistDoneCount = 0;
foreach($arAssistSteps as $stepCode => $arStep)
{
	$curStepTotalCount = 0;
	$curStepDoneCount = 0;
	foreach($arStep["BLOCKS"] as $block => $arBlock)
	{
		$curBlockTotalCount = count($arBlock["MAIN_ITEMS"]);
		$arAssistSteps[$stepCode]["BLOCKS"][$block]["TOTAL_COUNT"] = $curBlockTotalCount;
		$curStepTotalCount+= $curBlockTotalCount;

		$curBlockDoneCount = 0;
		foreach($arBlock["MAIN_ITEMS"] as $itemCode => $itemPath)
		{
			if (in_array($itemCode, $arStoreAssistOption))
				$curBlockDoneCount++;
		}
		$arAssistSteps[$stepCode]["BLOCKS"][$block]["DONE_COUNT"] = $curBlockDoneCount;
		$arAssistSteps[$stepCode]["BLOCKS"][$block]["PERCENT"] = ($curBlockDoneCount > 0) ? round(($curBlockDoneCount*100)/$curBlockTotalCount) : 0;
		$curStepDoneCount+= $arAssistSteps[$stepCode]["BLOCKS"][$block]["DONE_COUNT"];
	}
	$arAssistSteps[$stepCode]["TOTAL_COUNT"] = $curStepTotalCount;
	$arAssistSteps[$stepCode]["DONE_COUNT"] = $curStepDoneCount;
	$arAssistSteps[$stepCode]["PERCENT"] = ($curStepDoneCount > 0) ? round(($curStepDoneCount*100)/$curStepTotalCount) : 0;

	$assistTotalCount += $curStepTotalCount;
	$assistDoneCount += $curStepDoneCount;
}

$assistPersent = ($assistTotalCount > 0) ? round(($assistDoneCount*90)/$assistTotalCount) : 0; //90% - maximum for tasks

//get order progress percent
$orderPercent = intval(CStoreAssist::getProgressPercent());

if ($orderPercent > 0)
	$assistPersent += $orderPercent;
?>

<!-- GLOBAL PROGRESS -->
<div class="adm-s-thermometer-container">
	<div class="adm-s-thermometer-title"><?=GetMessage("STOREAS_PROGRESS")?></div>
	<div class="adm-s-thermometer-block">
		<div class="adm-s-thermometer-block-status red <?if ($assistPersent <= 18):?>active<?endif?>"><div class="adm-s-thermometer-point-desc"><?=GetMessage("STOREAS_FIRST_SETTINGS")?></div></div>
		<div class="adm-s-thermometer-block-status orange <?if ($assistPersent > 18 && $assistPersent <= 36):?>active<?endif?>"><div class="adm-s-thermometer-point-desc"><?=GetMessage("STOREAS_SECOND_SETTINGS")?></div></div>
		<div class="adm-s-thermometer-block-status yellow <?if ($assistPersent > 36 && $assistPersent <= 54):?>active<?endif?>"><div class="adm-s-thermometer-point-desc"><?=GetMessage("STOREAS_THIRD_SETTINGS")?></div></div>
		<div class="adm-s-thermometer-block-status green <?if ($assistPersent > 54 && $assistPersent <= 72):?>active<?endif?>"><div class="adm-s-thermometer-point-desc"><?=GetMessage("STOREAS_FORTH_SETTINGS")?></div></div>
		<div class="adm-s-thermometer-block-status lightgreen <?if ($assistPersent > 72 && $assistPersent <= 90):?>active<?endif?>"><div class="adm-s-thermometer-point-desc"><?=GetMessage("STOREAS_FIFTH_SETTINGS")?></div></div>
		<div class="adm-s-thermometer-block-status blue <?if ($assistPersent > 90):?>active<?endif?>"><div class="adm-s-thermometer-point-desc"><?=GetMessage("STOREAS_SIXTH_SETTINGS")?></div></div>
		<div class="adm-s-thermometer-track">
			<div class="adm-s-thermometer-track-shadow">
				<div class="adm-s-thermometer-point" style="left: <?=$assistPersent?>%;" data-role="percentRuleSlider">
					<div class="adm-s-thermometer-point-tablet"><?=$assistPersent?>%</div>
				</div>
			</div>
		</div>
		<div class="adm-s-thermometer-block-shadow"></div>
	</div>
</div>

<?
//get option of toggled sections
$step_toggle = CUserOptions::GetOption("storeassist", "step_toggle", "");
if (!$step_toggle)
{
	if ($arAssistSteps["MAIN"]["PERCENT"] >= 80)
		$step_toggle["MAIN"] = "N";
	else
		$step_toggle["WORK"] = "N";

	$step_toggle["HEALTH"] = "N";
}

$i = 1;
$numSteps = count($arAssistSteps);
foreach($arAssistSteps as $stepCode => $arStep)
{
?>
	<div class="adm-s-setting-container <?=toLower($stepCode)?> <?=(isset($step_toggle[$stepCode]) && $step_toggle[$stepCode] == "N" ? "close" : "open")?> <?if ($i == $numSteps) echo "last"?>" data-role="step<?=$stepCode?>">
		<div class="adm-s-setting-title-container" onclick="BX.Storeassist.Admin.toggleStep('<?=CUtil::JSEscape($stepCode)?>')">
			<div class="adm-s-setting-action"><span data-role="toggle<?=$stepCode?>"><?=GetMessage("STOREAS_".(isset($step_toggle[$stepCode]) && $step_toggle[$stepCode] == "N" ? "SHOW" : "HIDE"))?></span><span class="arrow"></span></div>
			<div class="adm-s-setting-title-icon"></div>
			<div class="adm-s-setting-title-line"></div>
			<h2  class="adm-s-setting-title"><?=GetMessage("STOREAS_STEPS_".$stepCode)?></h2>
		</div>

		<div class="adm-s-setting-content-container" data-role="container<?=$stepCode?>">
			<!-- BLOCK CONTENT Progress  -->
			<div class="adm-s-setting-progress-block">
				<div class="adm-s-setting-progress-line-h"></div>
				<div class="adm-s-setting-progress-cyrcle-container"><?=$arStep["PERCENT"]?>%</div>
				<div class="adm-s-setting-progress-cyrcle-container-desc"><?=GetMessage("STOREAS_TASKS_READY")?></div>
			</div>
			<!--  -->

			<div class="adm-s-setting-content-container-line"><span></span></div>
			<?foreach($arStep["BLOCKS"] as $block => $arBlock):?>
				<?if (!empty($arBlock["TYPE"]) && $arBlock["TYPE"] == "ONE"):?>
				<div class="adm-s-setting-content-block">
					<div class="posr">
				<?endif?>
				<div class="adm-s-setting-content-block <?if (!empty($arBlock["TYPE"])) echo ($arBlock["TYPE"] == "ONE" ? "one" : "one two");?>" id="<?=toLower($stepCode."_".$block)?>">
					<!-- BLOCK CONTENT container title -->
					<div class="adm-s-setting-content-block-title-container">
						<div class="adm-s-setting-content-block-line"></div>
						<div class="adm-s-setting-content-block-point"></div>
						<div class="adm-s-setting-content-block-title"><?=GetMessage("STOREAS_STEPS_".$stepCode."_".toUpper($block))?></div>
						<!-- BLOCK CONTENT status -->
						<div class="adm-s-setting-content-block-status-container">
							<div class="adm-s-setting-content-block-status red"></div>
							<div class="adm-s-setting-content-block-status orange"></div>
							<div class="adm-s-setting-content-block-status yellow"></div>
							<div class="adm-s-setting-content-block-status green"></div>
							<div class="adm-s-setting-content-block-status lightgreen"></div>
							<div class="adm-s-setting-content-block-status-track">
								<div class="adm-s-setting-content-block-status-track-point" style="left: <?=$arBlock["PERCENT"]?>%;"><?=$arBlock["DONE_COUNT"]?>/<?=$arBlock["TOTAL_COUNT"]?></div>
							</div>
						</div>
						<!--  -->
					</div>
					<!--  -->
					<!-- BLOCK CONTENT container body -->
					<div class="adm-s-setting-content-block-body-container">
						<!--<p><?=GetMessage("STOREAS_STEPS_".$stepCode."_".$block."_DESCR")?></p>-->
						<ul class="adm-s-setting-tasklist">
							<?foreach($arBlock["MAIN_ITEMS"] as $itemCode => $itemPath):?>
								<li class="adm-s-setting-task <?if (in_array($itemCode, $arStoreAssistOption)):?>complited<?endif?>">
									<?
									switch ($itemCode)
									{
										case "support_developer":
											$partnerName = Bitrix\Main\Config\Option::get("storeassist", "partner_name", "");
											$message = htmlspecialcharsbx(GetMessage("STOREAS_ITEMS_".$itemCode, array("#NAME#" => ($partnerName ? "\"".$partnerName."\"" : ""))));
											?>
											<a href="<?=$itemPath?>" title="<?=$message?>" onclick="BX.Storeassist.Admin.setOption('<?=CUtil::JSEscape($itemCode)?>', 'Y')" target="_blank">
												<span><?=$message?></span>
											</a>
											<?
											break;
										case "support_bitrix":
										case "info_vk":
										case "info_blog":
										case "info_forum_guest":
										case "info_forum_client":
										case "info_idea":
										case "info_user_doc":
										case "info_api_doc":
										case "info_courses":
											?>
											<a href="<?=$itemPath?>" title="<?=GetMessage("STOREAS_ITEMS_".$itemCode)?>" onclick="BX.Storeassist.Admin.setOption('<?=CUtil::JSEscape($itemCode)?>', 'Y')" target="_blank">
												<span><?=GetMessage("STOREAS_ITEMS_".$itemCode)?></span>
											</a>
											<?
											break;
										default:
											?>
											<a href="<?=$itemPath?>" title="<?=GetMessage("STOREAS_ITEMS_".$itemCode)?>"><span><?=GetMessage("STOREAS_ITEMS_".$itemCode)?></span></a>
											<?
									}
									?>
								</li>
							<?endforeach?>

							<?if (!empty($arBlock["ADDITIONAL_ITEMS"])):?>
								<li class="adm-s-setting-task add "><span><?=GetMessage("STOREAS_ADDITIONAL_TASKS")?></span></li>
							<?endif?>
						</ul>
						<div class="clb"></div>
					</div>
					<!--  -->
				</div>
				<?if (!empty($arBlock["TYPE"]) && $arBlock["TYPE"] == "TWO"):?>

						<div class="clb"></div>

						<div class="adm-s-setting-content-block-body-line-two-h-t"></div>
						<div class="adm-s-setting-content-block-body-line-two-h-b"></div>
					</div>
				</div>
				<?endif?>
			<?endforeach?>

		</div>
	</div>
<?
	$i++;
}
?>
<script>
	BX.ready(function(){
		var percentRuleSlider = document.querySelector('[data-role="percentRuleSlider"]');
		BX.Storeassist.Admin.percentMoveInit(percentRuleSlider, '<?=CUtil::JSEscape($assistPersent)?>');
	});
</script>
<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>