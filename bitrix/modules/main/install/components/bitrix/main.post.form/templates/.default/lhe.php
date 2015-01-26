<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
if (!CModule::IncludeModule("fileman"))
	return;

$Editor = new CHTMLEditor;
$Editor->Show(array_merge(
	array("height" => 200),
	(is_array($arParams["LHE"]) ? $arParams["LHE"] : array()),
	array(
		'name' => $arParams["TEXT"]["NAME"],
		'id' => $arParams["LHE"]["id"],
		'siteId' => 's1',
		'width' => '100%',
		'content' => htmlspecialcharsBack($arParams["TEXT"]["VALUE"]),
		'bAllowPhp' => false,
		'limitPhpAccess' => false,
		'showTaskbars' => false,
		'showNodeNavi' => false,
		'askBeforeUnloadPage' => true,
		'arSmiles' => $arParams["SMILES"]["VALUE"],
		'bbCode' => true,
		'autoResize' => true,
		'autoResizeOffset' => 40,
		'saveOnBlur' => true,
		'iframeCss' => 'body{font-family: "Helvetica Neue",Helvetica,Arial,sans-serif; font-size: 13px;}'.
						'.bx-spoiler {border:1px solid #C0C0C0;background-color:#fff4ca;padding: 4px 4px 4px 24px;color:#373737;border-radius:2px;min-height:1em;margin: 0;}',
		'minBodyWidth' => 350,
		'normalBodyWidth' => 555,
		'controlsMap' => array(
			array('id' => 'Bold',  'compact' => true, 'sort' => 80),
			array('id' => 'Italic',  'compact' => true, 'sort' => 90),
			array('id' => 'Underline',  'compact' => true, 'sort' => 100),
			array('id' => 'Strikeout',  'compact' => true, 'sort' => 110),
			array('id' => 'RemoveFormat',  'compact' => true, 'sort' => 120),
			array('id' => 'Color',  'compact' => true, 'sort' => 130),
			array('id' => 'FontSelector',  'compact' => false, 'sort' => 135),
			array('id' => 'FontSize',  'compact' => false, 'sort' => 140),
			array('separator' => true, 'compact' => false, 'sort' => 145),
			array('id' => 'OrderedList',  'compact' => true, 'sort' => 150),
			array('id' => 'UnorderedList',  'compact' => true, 'sort' => 160),
			array('id' => 'AlignList', 'compact' => false, 'sort' => 190),
			array('separator' => true, 'compact' => false, 'sort' => 200),
			array('id' => 'InsertLink',  'compact' => true, 'sort' => 210, 'wrap' => 'bx-b-link-'.$arParams["FORM_ID"]),
			array('id' => 'InsertImage',  'compact' => false, 'sort' => 220),
			array('id' => 'InsertVideo',  'compact' => true, 'sort' => 230, 'wrap' => 'bx-b-video-'.$arParams["FORM_ID"]),
			array('id' => 'InsertTable',  'compact' => false, 'sort' => 250),
			array('id' => 'Code',  'compact' => true, 'sort' => 260),
			array('id' => 'Quote',  'compact' => true, 'sort' => 270, 'wrap' => 'bx-b-quote-'.$arParams["FORM_ID"]),
			array('id' => 'Smile',  'compact' => false, 'sort' => 280),
			array('separator' => true, 'compact' => false, 'sort' => 290),
			array('id' => 'Fullscreen',  'compact' => false, 'sort' => 310),
			array('id' => 'BbCode',  'compact' => true, 'sort' => 340),
			array('id' => 'More',  'compact' => true, 'sort' => 400)
		)
	)
));
?>