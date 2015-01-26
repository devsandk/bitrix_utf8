<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$this->setFrameMode(true);
ob_start();
include($arResult['FILE']);
$content = ob_get_contents();
ob_end_clean();
if (!empty($content)) {
    echo'<article class="grid_4"><div class="inner-indent">';
    echo $content;
    echo'</div></article>';
}?>