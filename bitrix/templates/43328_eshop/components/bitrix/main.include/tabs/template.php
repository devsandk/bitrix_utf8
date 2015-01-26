<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$this->setFrameMode(true);
ob_start();
include($arResult['FILE']);
$content = ob_get_contents();
ob_end_clean();
if (!empty($content)) {
    echo'<div class="tabs">';
    $APPLICATION->AddHeadScript(SITE_DIR.'js/43328/jquery.tabs.min.js');
    $APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/tabs-min.css");
    echo $content;
    echo'</div>';
}?>