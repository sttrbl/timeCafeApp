<?php
require_once '../connection.php';
session_start();

$postData = file_get_contents('php://input');
$data = json_decode($postData, true);
$action = $data['action'];


switch ($action) {
	case 'endShift':
    case 'startNewVisit':
    case 'removeVisit':
    case 'calculateVisit':
	case 'endVisit':
		if ( !shiftIsActive() ) {
			$resp = array(
				'done' => false,
				'errorMsg' => 'Смена уже завершена, перезагрузите страницу.'
			);

			exit( json_encode($resp) );
		}
		break;
}


switch ($action) {
    case 'removeVisit':
    case 'calculateVisit':
	//Придумать что нибудь с case 'endVisit':
		if ( !isExist($data['visitId']) ) {
			$resp = array(
				'done' => false,
				'errorMsg' => 'Запись уже удалена, обновите страницу.'
			);

			exit( json_encode($resp) );
		}
		break;
}


switch ($action) {
	case 'getShiftInfo':
        getshiftInfo();
        break;
    case 'getDiscountsValues':
        getDiscountsValues();
        break;
    case 'startShift':
        startShift();
        break;
    case 'endShift':
        endShift($data['shiftId']);
        break;
    case 'startNewVisit':
        startNewVisit($data['visitInfo']);
        break;
    case 'removeVisit':
        removeVisit($data['visitId']);
        break;
    case 'calculateVisit':
        calculateVisit($data['visitId']);
        break;
    case 'endVisit':
        endVisit($data['visitInfo']);
        break;
}


function shiftIsActive() {
	global $pdo;
	$stmt = $pdo->query('SELECT COUNT(*) FROM shifts WHERE end_time IS NULL');
	if ( $stmt->fetchColumn() == 0) return false;
	return true; 
}

function isExist($visitId) {
	global $pdo;
	$stmt = $pdo->prepare("SELECT COUNT(*) FROM current_shift WHERE id = :id");
	$stmt->execute(array('id' => $visitId));
	if ( $stmt->fetchColumn() == 0) return false;
	return true; 
}

function getDiscountsValues() {
	global $pdo;
	$discountValues = $pdo->query('SELECT id, value FROM discounts')->fetchAll();
	return $discountValues;
}


function getShiftInfo() {
	global $pdo;

	if ( !shiftIsActive() ) {
		$resp = array(
			'done' => true,
			'data' => NULL
		);

		exit( json_encode($resp) );
	}

	$stmt = $pdo->query('SELECT id FROM shifts WHERE end_time IS NULL');
	$stmt = $stmt->fetch(PDO::FETCH_LAZY);
	$shiftId = $stmt['id'];
	$stmt = $pdo->query("SELECT id, person_tag, comment, date_format(start_time,'%H:%i') 
						 AS start_time, date_format(end_time,'%H:%i') AS end_time, discount, 
						 total, status FROM current_shift");
	$visits = $stmt->fetchAll();

	$resp = array(
		'done' => true,
		'data' => array(
			'shiftId' => $shiftId, 
			'visits' => $visits, 
			'discounts' => getDiscountsValues() 
		)
	);

	echo json_encode($resp);
}


function startShift() {
	global $pdo;

	if ( shiftIsActive() ) {
		$resp = array(
			'done' => false,
			'errorMsg' => 'Смена уже начата, перезагрузите страницу.'
		);

		exit( json_encode($resp) );
	}

	$stmt = $pdo->prepare("INSERT INTO shifts(start_user) VALUES (:user_id)");
	$stmt->execute(array('user_id' => $_SESSION['user']['id']));

	$resp = array(
		'done' => true,
		'data' => array(
			'shiftId' => $pdo->lastInsertId(), 
			'discounts' => getDiscountsValues() 
		)
	);

	echo json_encode($resp);

}


function endShift($shiftId) {
	global $pdo;

	$stmt = $pdo->prepare("UPDATE shifts SET end_time = NOW(), end_user = :user_id WHERE id = :shift_id");
	$stmt->execute(array('user_id' => $_SESSION['user']['id'], 'shift_id' => $shiftId));

	/*Все визиты текущей смены - в архив*/

	$stmt = $pdo->prepare("INSERT INTO archive (shift_id, visit_id, comment, 
						   start_time, end_time, discount, total, status, end_user) 
						   SELECT :shift_id, id, comment, start_time, end_time, 
						   discount, total, status, end_user FROM current_shift");

	$stmt->execute(array('shift_id' => $shiftId));
	$pdo->query('TRUNCATE TABLE current_shift');
	$pdo->query('ALTER TABLE current_shift AUTO_INCREMENT = 1');

	$resp = array('done' => true);
	echo( json_encode($resp) );
}


function startNewVisit($inputs) {

	function validateUserInfo($inputs) {
		global $pdo;

		if ($inputs['person_tag'] <= 0) {
			$resp = array(
				'done' => false,
				'errorMsg' => 'Некорректное значение поля "Номерок"!'
			);
	
			exit( json_encode($resp) );
		}

		$stmt = $pdo->prepare("SELECT COUNT(*) FROM current_shift WHERE person_tag = :tag AND status != 'completed'");
		$stmt->execute( array('tag' => $inputs['person_tag']) );
		
		if ( $stmt->fetchColumn() != 0) {
			$resp = array(
				'done' => false,
				'errorMsg' => 'Посещение по данному номерку уже активно!'
			);
	
			exit( json_encode($resp) );
		}
	}

	global $pdo;

	validateUserInfo($inputs);

	$stmt = $pdo->prepare("INSERT INTO current_shift SET person_tag = :tag, comment = :comment, status = 'active'");
	$stmt->execute(array('tag' => $inputs['person_tag'],'comment' => $inputs['comment']));
	$visitId = $pdo->lastInsertId();

	$stmt = $pdo->prepare("SELECT date_format(start_time,'%H:%i') FROM current_shift WHERE id = :id");
	$stmt->execute( array('id' => $visitId) );

	$resp = array(
		'done' => true,
		'data' => array(
			'visitId' => $visitId, 
			'startTime' => $stmt->fetchColumn() 
		)
	);

	echo json_encode($resp);
}


function removeVisit($visitId) {
	global $pdo;
	$stmt = $pdo->prepare("DELETE FROM current_shift WHERE id = :id");
	$stmt->execute(array('id' => $visitId));

	$resp = array('done' => true);
	echo( json_encode($resp) );
}


function calculateVisit($visitId) {
	global $pdo;

	$stmt = $pdo->prepare("UPDATE current_shift SET end_time = NOW() WHERE id = :id");
	$stmt->execute(array('id' => $visitId));

	$stmt = $pdo->prepare("SELECT date_format(end_time,'%H:%i') FROM current_shift WHERE id = :id");
	$stmt->execute( array('id' => $visitId) );
	$endTime = $stmt->fetchColumn();

	$stmt = $pdo->prepare("SELECT (unix_timestamp(end_time) - unix_timestamp(start_time)) / 60
						   AS time FROM current_shift WHERE id = :id");
	$stmt->execute(array('id' => $visitId));
	$data = $stmt->fetch(PDO::FETCH_ASSOC);

	$firstCost = $pdo->query("SELECT value from settings WHERE name = 'first_cost'")->fetchColumn();
	$nextCost = $pdo->query("SELECT value from settings WHERE name = 'next_cost'")->fetchColumn();
	$stopCheck = $pdo->query("SELECT value from settings WHERE name = 'stop_check'")->fetchColumn();
	$time = $data['time'];

	//Рассчет стоимости
	if ($time <= 60) {
		$pureTotal = $firstCost;
	} else {
		$pureTotal = $firstCost + ( ($time - 60) * $nextCost );
	}

	if ($pureTotal >= $stopCheck) {
		$pureTotal = $stopCheck;
	} 

	$stmt = $pdo->prepare("UPDATE current_shift SET status = 'calculated', total = :total WHERE id = :id");
	$stmt->execute(array('id' => $visitId, 'total' => $pureTotal));

	$resp = array(
		'done' => true,
		'data' => array(
			'pureTotal' => floor($pureTotal), 
			'endTime' => $endTime 
		)
	);

	echo json_encode($resp);
}



function endVisit($data) {
	global $pdo;

	$visitId = $data['visitId'];
	$finalTotal = $data['finalTotal'];
	$discount = $data['discount'];

	$stmt = $pdo->prepare("UPDATE current_shift SET total = :total, discount = :discount, 
						   end_user = :end_user, status = 'completed' WHERE id = :visit_id");

	$stmt->execute(array('end_user' => $_SESSION['user']['id'], 'visit_id' => $visitId, 'total' => $finalTotal, 'discount' => $discount));

	$resp = array(
		'done' => true,
	);
	
	echo json_encode($resp);
}
?>

