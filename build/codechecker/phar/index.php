<?php

// Autoloader
require_once 'phar://codechecker.phar/vendor/squizlabs/php_codesniffer/autoload.php';
require_once 'phar://codechecker.phar/vendor/autoload.php';
require_once 'phar://codechecker.phar/App.php';

// Start app
$app = new App();
$app->run();
