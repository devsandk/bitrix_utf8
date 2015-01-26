<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$APPLICATION->AddHeadScript(SITE_TEMPLATE_PATH."/components/bitrix/rating.vote/mobile_comment_like/script_attached.js");

?><script>
BX.message({
	RVCSessID: '<?=CUtil::JSEscape(bitrix_sessid())?>',
	RVCPathToUserProfile: '<?=CUtil::JSEscape(htmlspecialcharsbx(str_replace("#", "(_)", $arResult['PATH_TO_USER_PROFILE'])))?>',
	RVCListBack: '<?=CUtil::JSEscape(GetMessage("RATING_COMMENT_LIST_BACK"))?>',
	RVCTextY: '<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['RATING_TEXT_LIKE_Y']))?>',
	RVCTextN: '<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['RATING_TEXT_LIKE_N']))?>'
});
</script><?
?><div class="post-comment-likes"><?
	if($arResult['VOTE_AVAILABLE'] == 'Y')
	{
		?><div class="post-comment-likes-text post-comment-state<?=($arResult['USER_HAS_VOTED'] == "N" ? "": "-active")?>" id="bx-ilike-button-<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['VOTE_ID']))?>">
			<?=($arResult['USER_HAS_VOTED'] == 'N'? CUtil::JSEscape(htmlspecialcharsbx($arResult['RATING_TEXT_LIKE_Y'])): CUtil::JSEscape(htmlspecialcharsbx($arResult['RATING_TEXT_LIKE_N'])))?><?
		?></div><?
	}
	?><div class="post-comment-likes-counter" id="bx-ilike-count-<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['VOTE_ID']))?>"<?=(intval($arResult['TOTAL_VOTES']) <= 0 ? ' style="display: none;"' : '')?>><?=htmlspecialcharsEx($arResult['TOTAL_VOTES'])?></div><?
?></div>
<script type="text/javascript">
BX.ready(function() {
	if (BX.message('MSLPageId'))
	{
		if (!window.RatingLikeComments && top.RatingLikeComments)
			RatingLikeComments = top.RatingLikeComments;
		RatingLikeComments.Set(
			'<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['VOTE_ID']))?>', 
			'<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['ENTITY_TYPE_ID']))?>', 
			'<?=IntVal($arResult['ENTITY_ID'])?>', 
			'<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['VOTE_AVAILABLE']))?>'
		);

		if (app.enableInVersion(2))
		{
			BX.bind(BX('bx-ilike-count-<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['VOTE_ID']))?>'), 'click', function() {
				RatingLikeComments.List('<?=CUtil::JSEscape(htmlspecialcharsbx($arResult['VOTE_ID']))?>');		
			});
		}
	}
});
</script>