<?
header("Content-Type: application/x-javascript");
$config = array("appmap" => array("main"=>"/eshop_app/", "left"=>"/eshop_app/left.php"));
echo json_encode($config);
?>