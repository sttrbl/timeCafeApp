<?php
mb_internal_encoding('UTF-8');
session_start();
require_once 'php/connection.php';
if (!$_SESSION['user']) {
    header("Location: authorization.php");
    exit;
}
if (isset($_GET['logout']) && $_GET['logout'] == true) {
    unset($_SESSION['user']);
    session_destroy();
    header("Location: authorization.php");
}
$orgName = $pdo->query("SELECT value from settings WHERE name = 'org_name'")->fetchColumn();
$stmt = $pdo->prepare("SELECT users.name, users.surname, users.position AS 'position', positions.name 
					   AS 'position_name' FROM users LEFT JOIN positions ON users.position = positions.id 
					   WHERE users.id = :id");
$stmt->execute(array('id' => $_SESSION['user']['id']));
$usersInfo = $stmt->fetch();
$_SESSION['user']['position'] = $usersInfo['position'];
$_SESSION['user']['surname'] = $usersInfo['surname'];
$_SESSION['user']['name'] = $usersInfo['name'];
$userFullName = $usersInfo['surname'] . ' ' . mb_substr($usersInfo['name'], 0, 1) . '.';
?>

<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<title>Time-cafe app</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" type="text/css" href="css/fa/css/all.min.css">
	<link rel="stylesheet" type="text/css" href="css/resetCSS.css">
	<link rel="stylesheet" type="text/css" href="css/main.css">
	<link rel="stylesheet" type="text/css" href="css/sections/visits.css">
	<link rel="stylesheet" type="text/css" href="css/sections/settings.css">
	<link rel="stylesheet" type="text/css" href="css/sections/archive.css">
</head>

<body>
	<div class="layout">

		<aside class="layout__sidebar">
			<div class="logo-container">
				<img class="logo-container__img" src="img/logo.png">
				<h2 class="logo-container__text"><?php echo $orgName; ?></h2>
			</div>

			<div class="user-panel">
				<div class="user-info">
					<h4 class="user-info__name"><?php echo $userFullName; ?></h4>
					<span class="user-info__status"><?php echo $usersInfo['position_name']; ?></span>
				</div>

				<button class="btn-logout" onclick="location.href='?logout=true'">
					<i class="fa fa-times" aria-hidden="true"></i>
				</button>
			</div>

			<nav>
				<ul class="menu">
					<li class="menu__item">
						<a class="menu__link current" href="/visits">
							<i class="fa fa-gamepad" aria-hidden="true"></i>
							<span>Посещения</span>
						</a>
					</li>
					<li class="menu__item">
						<a class="menu__link" href="/archive">
							<i class="fa fa-clone" aria-hidden="true"></i>
							<span>Архив</span>
						</a>
					</li>
					<li class="menu__item">
						<a class="menu__link" href="/settings">
							<i class="fa fa-cog" aria-hidden="true"></i>
							<span>Настройки</span>
						</a>
					</li>
				</ul>
			</nav>
		</aside>


		<div class="layout__body">

			<header class="mobile-header">
				<button class="btn-sidebar-toggle">
					<i class="fa fa-bars" aria-hidden="true"></i>
				</button>

				<h1 class="mobile-header__text"><?php echo $orgName; ?></h1>
			</header>


			<main class="page">
				<h1 class="page__headline"></h1>
			</main>
		</div>
	</div>
	

	<script type="text/javascript" src="js/jquery-3.3.1.min.js"></script>
	<script src="js/helper.js"></script>
	<script src="js/sections/visitsPage.js"></script>
	<script src="js/sections/archivePage.js"></script>
	<script src="js/sections/settingsPage.js"></script>
	<script src="js/main.js"></script>
</body>
</html>