<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
							</div>
						</article>
						<?$APPLICATION->IncludeComponent(
							"bitrix:main.include",
							"grid4",
							Array(
								"AREA_FILE_SHOW" => "sect",
								"AREA_FILE_SUFFIX" => "right_4",
								"AREA_FILE_RECURSIVE" => "Y",
								"EDIT_MODE" => "html",
								"EDIT_TEMPLATE" => "sect_right_4.php"
							)
						);?>
		  			</div>
				</section>
			</div>
<!--==============================footer=================================-->
			<footer>
			   <div class="container_12">
			        <article class="grid_4 fright">
			        	<div class="schedule">
							<?$APPLICATION->IncludeFile(
								$APPLICATION->GetTemplatePath("include_areas/contacts.php"),
								Array(),
								Array("MODE"=>"html")
							);?>
			        	</div>
			        </article>
			        <article class="grid_4 fright">
			        	<?$APPLICATION->IncludeFile(
							$APPLICATION->GetTemplatePath("include_areas/social.php"),
							Array(),
							Array("MODE"=>"html")
						);?>
			        </article>
			        <article class="grid_4 fleft">
			        	<div class="div-footer">
			        		<?$APPLICATION->IncludeFile(
								$APPLICATION->GetTemplatePath("include_areas/copy.php"),
								Array(),
								Array("MODE"=>"html")
							);?>
			        	</div>
			        </article>
			   </div>
			</footer>
		</div>
	</body>
</html>