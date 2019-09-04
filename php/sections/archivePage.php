<?php
require_once '../connection.php';

session_start();

$postData = file_get_contents('php://input');
$data = json_decode($postData, true);
$action = $data['action'];

switch ($action) {

	case 'getDatePeriod':
        getDatePeriod();
        break;
	case 'getPeriodInfo':
        getPeriodInfo($data['from'], $data['to']);
        break;
    case 'getShiftVisits':
        getShiftVisits($data['shiftId']);
        break;
};


function getDatePeriod() {
	global $pdo;

	$period = $pdo->query("SELECT DATE_FORMAT(min(start_time), '%Y-%m-%d') 
						  as 'from', DATE_FORMAT(max(start_time), '%Y-%m-%d') 
						  as 'to' FROM shifts WHERE end_time IS NOT NULL")->fetch();

	$resp = array(
		'done' => true,
		'data' => $period
	);

	exit(json_encode($resp));
}


function getPeriodInfo($from, $to) {
	global $pdo;

	if ($from > $to) {
		$resp = array(
			'done' => false,
			'errorMsg' => 'Некорректное значение диапазона дат!'
		);

		exit(json_encode($resp));
	}

	$stmt = $pdo->prepare("SELECT COUNT(DISTINCT id) AS 'total_shifts', COUNT(visit_id) AS 'total_visitors', SUM(total) AS 'total_profit', 
							ROUND(SUM(total) / COUNT(DISTINCT id)) AS 'average_profit',
							ROUND(AVG(unix_timestamp(archive.end_time) - unix_timestamp(archive.start_time)) / 60) AS 'average_duration',
							ROUND(AVG(total)) AS 'average_check' FROM shifts LEFT JOIN archive ON shifts.id = archive.shift_id 
							WHERE shifts.start_time BETWEEN :from AND DATE_ADD(STR_TO_DATE(:to, '%Y-%m-%d'), INTERVAL 1 DAY) 
							AND shifts.end_time IS NOT NULL");
							
	$stmt->execute( array('from' => $from, 'to' => $to) );
	$statistics = $stmt->fetch();

	$stmt = $pdo->prepare("SELECT id, DATE_FORMAT(start_time, '%Y-%m-%d') AS 'date',
						   date_format(start_time,'%H:%i') AS 'start_time',
						   date_format(end_time,'%H:%i') AS 'end_time' 
						   FROM shifts WHERE start_time BETWEEN :from 
						   AND DATE_ADD(STR_TO_DATE(:to, '%Y-%m-%d'), INTERVAL 1 DAY) 
						   AND shifts.end_time IS NOT NULL");

	$stmt->execute( array('from' => $from, 'to' => $to) ); 

	$shifts = $stmt->fetchAll();

	if (!$shifts) {
		$resp = array(
			'done' => true,
			'data' => null
		);
	} else {
		$resp = array(
			'done' => true,
			'data' => array(
				'statistics' => $statistics, 
				'shifts' => $shifts
			)
		);
	}

	exit(json_encode($resp));
}


function getShiftVisits($shiftId) {
	global $pdo;

	$stmt = $pdo->prepare("SELECT comment, date_format(start_time,'%H:%i') 
						   AS 'start_time', date_format(end_time,'%H:%i') 
						   AS 'end_time', discount, total, statuses.name 
						   AS 'status', users.surname AS 'end_user' from archive
						   LEFT JOIN users on archive.end_user = users.id
						   LEFT JOIN statuses on archive.status = statuses.id WHERE shift_id = :id");

	$stmt->execute( array('id' => $shiftId) );  
	$shiftVisits = $stmt->fetchAll();

	$resp = array(
		'done' => true,
		'data' => $shiftVisits
	);

	exit(json_encode($resp));
}


?>