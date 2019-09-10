<?php
$stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE id = :id");
$stmt->execute(array('id' => $_SESSION['user']['id']));

if ($stmt->fetchColumn() === 0) {
    $resp = array(
		'done' => false,
		'errorMsg' => 'К сожалению, вас удалили из системы :('
	);

	exit(json_encode($resp));
}
?>