<?if(!defined("B_PROLOG_INCLUDED")||B_PROLOG_INCLUDED!==true)die();
//$this->setFrameMode(false);
?>
<div class="mfeedback">
	<?if(!empty($arResult["ERROR_MESSAGE"]))
	{
		foreach($arResult["ERROR_MESSAGE"] as $v)
			ShowError($v);
	}
	if(strlen($arResult["OK_MESSAGE"]) > 0)
	{
		?><div class="mf-ok-text"><?=$arResult["OK_MESSAGE"]?></div><?
	}
	?>

	<form action="" method="POST" id="contact-form">
		<fieldset>
			<?=bitrix_sessid_post()?>
			<div class="div-label">
	        	<label class="name wrapper-after">
	            	<input placeholder="<?=GetMessage("MFT_NAME")?>" name="user_name" type="text" value="" />
	            </label><div class="clear"></div>
	        </div>

			<div class="div-label">
	        	<label class="email wrapper-after">
	            	<input placeholder="<?=GetMessage("MFT_EMAIL")?>" name="user_email" type="text" value="" />
	        	</label><div class="clear"></div>
	        </div>

			<?foreach($arParams["NEW_EXT_FIELDS"] as $i => $ext_field):?>
				<div class="div-label">
	        		<label class="phone wrapper-after">
	            		<input placeholder="<?=$ext_field?>" name="custom[<?$i?>]" type="text" value="" />
	        		</label><div class="clear"></div>
	        	</div>
			<?endforeach;?>

			<div class="div-label">
	        	<label class="message wrapper-after">
	            	<textarea placeholder="<?=GetMessage("MFT_MESSAGE")?>" class="img-shadow" name="MESSAGE"></textarea>
	        	</label><div class="clear"></div>
	        </div>

			<?if($arParams["USE_CAPTCHA"] == "Y"):?>
			<div class="div-label">
	        	<label class="message wrapper-after">
					<input type="hidden" name="captcha_sid" value="<?=$arResult["capCode"]?>">
					<img src="/bitrix/tools/captcha.php?captcha_sid=<?=$arResult["capCode"]?>" width="180" height="40" alt="CAPTCHA">
					<input type="text" placeholder="<?=GetMessage("MFT_CAPTCHA_CODE")?>" name="captcha_word" value="" />
				</label>
			</div>
			<?endif;?>
			<div class="clear"></div>
	        <div class="buttons2">
				<input type="reset" value="<?=GetMessage("MFT_RESET")?>" />
				<input type="submit" name="submit" value="<?=GetMessage("MFT_SUBMIT")?>" />
	        <div class="clear"></div>
	        </div>
	        <div class="clear"></div>
		</fieldset>
	</form>
</div>
<script>
	$(document).ready(function() {
		$('#contact-form .buttons2 input:reset, #contact-form .buttons2 input:submit').each(function() {
			$(this).css({'visibility':'hidden', 'position':'absolute', 'top':0, 'left':0});
			$(this).after('<a href="javascript:void(0);">'+$(this).attr('value')+'</a>');
		})
		$('#contact-form .buttons2 input:reset, #contact-form .buttons2 input:submit').next('a').click(function() {
			$(this).prev('input').click();
		})
	})
</script>