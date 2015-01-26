<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->SetTitle("Персональный раздел");
?> 
<div class="bx_page"> 	 
  <p>В личном кабинете Вы можете проверить текущее состояние корзины, ход выполнения Ваших заказов, просмотреть или изменить личную информацию, а также подписаться на новости и другие информационные рассылки. </p>
 	 
  <div> 		 
    <h2><a href="http://entask.ru/login/" >Вход на сайт</a> </h2>
  
    <h2>
      <br />
     Личная информация</h2>
   
    <div><a href="http://entask.ru/login/?register=yes&backurl=%2F" >Регистрация</a></div>
   		<a href="profile/" >Изменить регистрационные данные</a> 	</div>
 	 
  <div> 		 
    <h2>Заказы</h2>
   		<a href="order/" >Ознакомиться с состоянием заказов</a> 
    <br />
   		<a href="cart/" >Посмотреть содержимое корзины</a> 
    <br />
   		<a href="order/?filter_history=Y" >Посмотреть историю заказов</a> 
    <br />
   	</div>
 	 
  <div> 		 
    <h2>Подписка</h2>
   		<a href="subscribe/" >Изменить подписку</a> 	</div>
 </div>
 <?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>