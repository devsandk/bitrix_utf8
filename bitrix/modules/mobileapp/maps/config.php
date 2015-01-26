<?php

use Bitrix\MobileApp\Designer\ParameterType;

$map = array(
	"types"=>array(
		//Group parameters
		'controller_settings/main_background' => ParameterType::GROUP_BACKGROUND,
		'controller_settings/toolbar_background' => ParameterType::GROUP_BACKGROUND_LIGHT,
		'controller_settings/loading_background' => ParameterType::GROUP_BACKGROUND,
		'controller_settings/navigation_bar_background' => ParameterType::GROUP_BACKGROUND_LIGHT,
		'table/cell_background' => ParameterType::GROUP_BACKGROUND_LIGHT,
		'sliding_panel/background' => ParameterType::GROUP_BACKGROUND_LIGHT,
		'buttons/stretchable' => ParameterType::GROUP,
		'additional/push' => ParameterType::GROUP,

		//main
		'controller_settings/main_background/color' => ParameterType::COLOR,
		'controller_settings/main_background/image' => ParameterType::IMAGE,
		'controller_settings/main_background/image_landscape' => ParameterType::IMAGE,
		'controller_settings/main_background/fill_mode' => ParameterType::VALUE_LIST,

		'controller_settings/toolbar_background/color' => ParameterType::COLOR,
		'controller_settings/toolbar_background/image' => ParameterType::IMAGE,

		'controller_settings/loading_background/color' => ParameterType::COLOR,
		'controller_settings/loading_background/image' => ParameterType::IMAGE,
		'controller_settings/loading_background/image_landscape' => ParameterType::IMAGE,
		'controller_settings/loading_background/fill_mode' => ParameterType::VALUE_LIST,


		'controller_settings/navigation_bar_background/color' => ParameterType::COLOR,
		'controller_settings/navigation_bar_background/image' => ParameterType::IMAGE,
		'controller_settings/navigation_bar_background/image_large' => ParameterType::IMAGE,


		'controller_settings/loading_text_color' => ParameterType::COLOR,
		'controller_settings/title_color' => ParameterType::COLOR,

		//buttons
		'buttons/ios_use_square_buttons' => ParameterType::BOOLEAN,
		'buttons/default_back_button' => ParameterType::VALUE_LIST,
		'buttons/text_color' => ParameterType::COLOR,
		'buttons/main_background_image' => ParameterType::IMAGE,
		'buttons/type' => ParameterType::IMAGE_SET,

		'buttons/stretchable/main_position_vertical' => ParameterType::SIZE,
		'buttons/stretchable/main_position_horizontal' => ParameterType::SIZE,
		'buttons/stretchable/back_text_position_vertical' => ParameterType::SIZE,
		'buttons/stretchable/back_text_position_horizontal' => ParameterType::SIZE,
		//tables|lists
		'table/sections_text_color' => ParameterType::COLOR,
		'table/sections_text_shadow_color' => ParameterType::COLOR,
		'table/sections_background_color' => ParameterType::COLOR,
		'table/cell_text_shadow_color' => ParameterType::COLOR,
		'table/cell_text_color' => ParameterType::COLOR,
		'table/cell_detail_text_color' => ParameterType::COLOR,

		'table/row_height' => ParameterType::SIZE,
		'table/row_height_large' => ParameterType::SIZE,
		'table/cell_background/color' => ParameterType::COLOR,
		'table/cell_background/image' => ParameterType::IMAGE,
		//pull to refresh controller

		'pull_down/background' => ParameterType::GROUP_BACKGROUND,
		'pull_down/background/color' => ParameterType::COLOR,
		'pull_down/background/image' => ParameterType::IMAGE,
		'pull_down/date_text_color' => ParameterType::COLOR,
		'pull_down/text_color' => ParameterType::COLOR,
		'pull_down/icon' => ParameterType::IMAGE,
		//sliding panel
		'sliding_panel/text_color' => ParameterType::COLOR,
		'sliding_panel/background/color' => ParameterType::COLOR,
		'sliding_panel/background/image' => ParameterType::IMAGE,
		'sliding_panel/background/image_large' => ParameterType::IMAGE,
//		'sliding_panel/textSize' => ParameterType::SIZE,

		//category switcher in a list controller
		'category_switcher/button_text_color_selected' => ParameterType::COLOR,
		'category_switcher/button_text_color' => ParameterType::COLOR,
		'category_switcher/button_background_color_selected' => ParameterType::COLOR,
		'category_switcher/button_width' => ParameterType::SIZE,
		'category_switcher/button_height_landscape' => ParameterType::SIZE,
		'category_switcher/button_height' => ParameterType::SIZE,
		//additional
		'additional/use_top_bar'=>ParameterType::BOOLEAN,
		'additional/use_slider'=>ParameterType::BOOLEAN,
		'additional/push/use_push'=>ParameterType::BOOLEAN,
		'additional/push/app_push_id'=>ParameterType::STRING,

	),
	"listValues"=>array(
		"buttons/default_back_button"=>array("default","back_text","back"),
		"controller_settings/loading_background/fill_mode"=>array("repeat","crop","stretch"),
		"controller_settings/main_background/fill_mode"=>array("repeat","crop","stretch"),
		"pull_down/background/fill_mode"=>array("repeat","crop","stretch"),
	),
	"limits" => array(
		"table/row_height"=>array(
			"min"=>50
		),
		"table/row_height_large" => array(
			"min" => 50
		),
	),
	"defaults" => array(),
);

return $map;