<?
/** CMain $APPLICATION */
global $APPLICATION;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$GLOBALS['APPLICATION']->SetAdditionalCSS('/bitrix/js/report/css/report.css');
CJSCore::Init(array('date','popup'));

$GLOBALS['APPLICATION']->SetTitle(GetMessage('REPORT_LIST'));

$containerID = 'reports_list_table_'.$arResult['OWNER_ID'];

$bCrmViewTarget = defined('CRM_REPORT_UPDATE_14_5_2_MESSAGE') ? CRM_REPORT_UPDATE_14_5_2_MESSAGE === 'Y' : false;
if($arResult['NEED_DISPLAY_UPDATE_14_5_2_MESSAGE']):
	if ($bCrmViewTarget)
		$this->SetViewTarget('REPORT_UPDATE_14_5_2_MESSAGE');
	?><div style="font-size: 14px; color: #4A4A4A; background-color: #DBE7C4; border: 1px solid #D7D7D7; border-radius: 4px; padding: 12px; margin: 0 0 16px 0; clear: both;">
	<?=GetMessage('REPORT_UPDATE_14_5_2_MESSAGE')?>
	</div><?
	if ($bCrmViewTarget)
		$this->EndViewTarget();
endif;
unset($bCrmViewTarget);
?>
<? if (empty($arResult['list'])): ?>

<?=GetMessage('REPORT_EMPTY_LIST')?><br/><br/>

<form action="" method="POST">
	<?=bitrix_sessid_post();?>
	<input type="hidden" name="CREATE_DEFAULT" value="1" />
	<input type="hidden" name="HELPER_CLASS" value="<?=htmlspecialcharsbx($arResult['HELPER_CLASS'])?>" />
	<input type="submit" value="<?=GetMessage('REPORT_CREATE_DEFAULT')?>" />
</form>

<? else: ?>

<div class="reports-list-wrap">
	<div class="reports-list">
		<div class="reports-list-left-corner"></div>
		<div class="reports-list-right-corner"></div>
		<style>
			.reports-list-table th:hover {
				cursor: default;
			}
		</style>
		<table cellspacing="0" class="reports-list-table" id="<?=htmlspecialcharsbx($containerID)?>">
			<tr>
				<th class="reports-first-column reports-head-cell-top" colspan="2">
					<div class="reports-head-cell"><!--<span class="reports-table-arrow"></span>--><span class="reports-head-cell-title"><?=GetMessage('REPORT_TABLE_TITLE')?></span></div>
				</th>
				<th class="reports-last-column">
					<div class="reports-head-cell"><!--<span class="reports-table-arrow"></span>--><span class="reports-head-cell-title"><?=GetMessage('REPORT_TABLE_CREATE_DATE')?></span></div>
				</th>
			</tr>
			<? foreach($arResult['list'] as $listItem): ?>
			<?
				$defaultMark = '';
				if (isset($listItem['MARK_DEFAULT']))
				{
					$markNum = intval($listItem['MARK_DEFAULT']);
					if ($markNum > 0)
						$defaultMark = 'd'.$markNum;
					unset($markNum);
				}
			?>
			<tr class="reports-list-item">
				<td class="reports-first-column"><a title="<?=htmlspecialcharsbx(strip_tags($listItem['DESCRIPTION']))?>" href="<?=CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_REPORT_VIEW"], array("report_id" => $listItem['ID']));?>" class="reports-title-link"><?=htmlspecialcharsbx($listItem['TITLE'])?></a></td>
				<td class="reports-list-menu">
					<a id="rmb-<?=$listItem['ID'].$defaultMark?>" href="#" class="reports-menu-button"><i class="reports-menu-button-icon"></i></a>
				</td>
				<td  class="reports-date-column reports-last-column"><?= ($listItem['CREATED_DATE'] instanceof \Bitrix\Main\Type\DateTime || $listItem['CREATED_DATE'] instanceof \Bitrix\Main\Type\Date) ? FormatDate($arResult['dateFormat'], $listItem['CREATED_DATE']->getTimestamp()) : '' ?></td>
			</tr>
			<? endforeach; ?>
		</table>
	</div>
</div>

<script type="text/javascript">
	var menu_butons = BX.findChildren(BX('<?=CUtil::JSEscape($containerID)?>'), {tagName:'a', className:'reports-menu-button'}, true);
	for(var i=0; i<menu_butons.length; i++){
		BX.bind(menu_butons[i], 'click', show_menu)
	}

	function show_menu(e){
		BX.PreventDefault(e);

		var i;
		var sid = this.id.substr(4);
		var pos = sid.indexOf('d');
		var markDefault = (pos < 0) ? 0 : parseInt(sid.substr(pos+1));
		var RID = parseInt((pos > 0) ? sid.substr(0,pos) : sid);
		var edit_href = "<?=CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_REPORT_CONSTRUCT"], array("report_id" => "REPORT_ID", 'action' => 'edit'));?>".replace('REPORT_ID', RID);
		var delete_href = "<?=CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_REPORT_CONSTRUCT"], array("report_id" => "REPORT_ID", 'action' => 'delete'));?>".replace('REPORT_ID', RID);
		var copy_href = "<?=CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_REPORT_CONSTRUCT"], array("report_id" => "REPORT_ID", 'action' => 'copy'));?>".replace('REPORT_ID', RID);
		i = 0;
		var menuItems = [];
		menuItems[i++] = { text : "<?=GetMessage('REPORT_COPY_SHORT')?>", title : "<?=GetMessage('REPORT_COPY_FULL')?>", className : "reports-menu-popup-item-copy", href: copy_href };
		if (markDefault === 0)
		{
			menuItems[i++] = { text : "<?=GetMessage('REPORT_EDIT_SHORT')?>", title : "<?=GetMessage('REPORT_EDIT_FULL')?>", className : "reports-menu-popup-item-edit", href: edit_href };
		}
		menuItems[i++] = { text : "<?=GetMessage('REPORT_DELETE_SHORT')?>", title : "<?=GetMessage('REPORT_DELETE_FULL')?>", className : "reports-menu-popup-item-delete", href: delete_href, onclick: function(e){ConfirmReportDelete(RID); BX.PreventDefault(e);} };

		BX.PopupMenu.show(RID, this, menuItems, {});
	}

	BX.message({REPORT_DELETE_CONFIRM : "<?=  GetMessage('REPORT_DELETE_CONFIRM')?>"});

	function ConfirmReportDelete(id)
	{
		var href = "<?=CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_REPORT_CONSTRUCT"], array("report_id" => 'REPORT_ID', 'action' => 'delete_confirmed'));?>".replace('REPORT_ID', id);

		if(confirm(BX.message('REPORT_DELETE_CONFIRM')))
		{
			var form = BX.create('form', {attrs:{method:'post'}});
			form.action = href;
			form.appendChild(BX.create('input', {attrs:{type:'hidden', name:'csrf_token', value:BX.message('bitrix_sessid')}}));

			document.body.appendChild(form);
			BX.submit(form);
		}
	}

</script>

<? endif; ?>

<?php $this->SetViewTarget("pagetitle", 100);?>
<div class="reports-title-buttons">
	<a class="reports-title-button" href="<?=CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_REPORT_CONSTRUCT"], array("report_id" => 0, 'action' => 'create'));?>">
		<i class="reports-title-button-create-icon"></i><span class="reports-link"><?=GetMessage('REPORT_ADD')?></span>
	</a>
</div>
<?php $this->EndViewTarget();?>
