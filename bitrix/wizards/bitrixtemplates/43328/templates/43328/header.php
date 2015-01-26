<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
IncludeTemplateLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/templates/".SITE_TEMPLATE_ID."/header.php");
$wizTemplateId = COption::GetOptionString("main", "wizard_template_id", "eshop_adapt_horizontal", SITE_ID);
CUtil::InitJSCore();
CJSCore::Init(array("fx"));
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?=LANGUAGE_ID?>" lang="<?=LANGUAGE_ID?>">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="user-scalable=no, initial-scale=1.0, maximum-scale=1.0, width=device-width">
		<link rel="shortcut icon" type="image/x-icon" href="<?=SITE_DIR?>favicon.ico" />
		<link href='http://fonts.googleapis.com/css?family=Andika&subset=latin,cyrillic' rel='stylesheet' type='text/css'>
		<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/reset.css");?>
		<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/skeleton.css");?>
		<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/superfish.css");?>
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.js"></script>
	    <script type="text/javascript" src="<?=SITE_DIR?>js/43328/superfish.js"></script>
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.responsivemenu.js"></script>
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.mobilemenu.js"></script>
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/script.js"></script>
		<?$APPLICATION->ShowHead();
		/*$APPLICATION->SetAdditionalCSS(SITE_TEMPLATE_PATH.'/colors.css');*/
		/*$APPLICATION->AddHeadScript(SITE_TEMPLATE_PATH."/script.js");*/?>
		<title><?$APPLICATION->ShowTitle()?></title>
		<script type="text/javascript">
			$(document).ready(function(){
				$('.sf-menu').mobileMenu({
					'topOptionText': '<?=GetMessage("MENU_SMALL_TEXT")?>',
				});
			});
		</script>
		<!--[if lt IE 8]>
			<div style=' clear: both; text-align:center; position: relative;'>
				<a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home?ocid=ie6_countdown_bannercode">
					<img src="http://storage.ie6countdown.com/assets/100/images/banners/warning_bar_0000_us.jpg" border="0" height="42" width="820" alt="You are using an outdated browser. For a faster, safer browsing experience, upgrade for free today." />
				</a>
			</div>
		<![endif]-->
    	<!--[if lt IE 9]>
   			<script type="text/javascript" src="<?=SITE_DIR?>js/43328/html5.js"></script>
    			<link rel="stylesheet" type="text/css" media="screen" href="<?=SITE_DIR?>css/43328/ie.css">
    	<![endif]-->
	</head>
	<body>
		<div id="panel"><?$APPLICATION->ShowPanel();?></div>
		<div class="main" id="pages">
			<div class="container_12">
				<!--==============================header=================================-->
				<header>
					<div class="logo">
						<?$APPLICATION->IncludeFile(
							$APPLICATION->GetTemplatePath("include_areas/logo.php"),
							Array(),
							Array("MODE"=>"html")
						);?>
					</div>
					<div class="search-nav wrapper-after">
						<div class="div-search">
							<?$APPLICATION->IncludeComponent("bitrix:search.form", "search", Array(
								),
								false
							);?>
						</div>
						<div class="clear"></div>
					    <nav>
					    	<?$APPLICATION->IncludeComponent("bitrix:menu", "menu-main", array(
								"ROOT_MENU_TYPE" => "top",
								"MENU_CACHE_TYPE" => "N",
								"MENU_CACHE_TIME" => "3600",
								"MENU_CACHE_USE_GROUPS" => "Y",
								"MENU_CACHE_GET_VARS" => array(
								),
								"MAX_LEVEL" => "3",
								"CHILD_MENU_TYPE" => "left",
								"USE_EXT" => "Y",
								"DELAY" => "N",
								"ALLOW_MULTI_SELECT" => "N",
								"MENU_COUNT" => "6"
								),
								false
							);?>
						    <div class="clear"></div>
					    </nav>
					</div>
					<div class="clear"></div>
				</header>
				<?$APPLICATION->IncludeComponent(
					"bitrix:main.include",
					"",
					Array(
						"AREA_FILE_SHOW" => "sect",
						"AREA_FILE_SUFFIX" => "slider",
						"AREA_FILE_RECURSIVE" => "Y",
						"EDIT_MODE" => "html",
						"EDIT_TEMPLATE" => "sect_slider.php"
					)
				);?>
<!--==============================content================================-->
				<section id="content">
					<?$APPLICATION->IncludeComponent("bitrix:main.include", "tabs", Array(
						"AREA_FILE_SHOW" => "sect",	// Показывать включаемую область
						"AREA_FILE_SUFFIX" => "top_1",	// Суффикс имени файла включаемой области
						"AREA_FILE_RECURSIVE" => "Y",	// Рекурсивное подключение включаемых областей разделов
						"EDIT_MODE" => "html",
						"EDIT_TEMPLATE" => "sect_top_1.php",	// Шаблон области по умолчанию
						),
						false
					);?>
					<div class="wrapper">
						<?$APPLICATION->IncludeComponent("bitrix:main.include", "grid4", Array(
							"AREA_FILE_SHOW" => "sect",	// Показывать включаемую область
							"AREA_FILE_SUFFIX" => "left_1",	// Суффикс имени файла включаемой области
							"AREA_FILE_RECURSIVE" => "Y",	// Рекурсивное подключение включаемых областей разделов
							"EDIT_MODE" => "html",
							"EDIT_TEMPLATE" => "sect_left_1.php",	// Шаблон области по умолчанию
							),
							false
						);?>
					   	<article class="grid_4">
					   	 	<div class="inner-indent">
								<h1 class="indenth2"><?$APPLICATION->ShowTitle(false);?></h1>
								<?$APPLICATION->IncludeComponent("bitrix:breadcrumb", "nav", Array(
									"START_FROM" => "0",	// Номер пункта, начиная с которого будет построена навигационная цепочка
									"PATH" => "",	// Путь, для которого будет построена навигационная цепочка (по умолчанию, текущий путь)
									"SITE_ID" => "-",	// Cайт (устанавливается в случае многосайтовой версии, когда DOCUMENT_ROOT у сайтов разный)
									),
									false
								);?>