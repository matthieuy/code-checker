<?php

$pharName = 'codechecker.phar';

copy('phar/Runner.php', 'phar/vendor/squizlabs/php_codesniffer/src/Runner.php');

echo "  - Start compile\n";
$phar = new Phar($pharName,
	FilesystemIterator::CURRENT_AS_FILEINFO | FilesystemIterator::KEY_AS_FILENAME,
	$pharName);
echo "  - Copy files in $pharName\n";
$phar->buildFromDirectory('phar', '/\.(php|xml|xsd)$/');
$phar->setStub($phar->createDefaultStub('index.php'));
echo "  - $pharName generate with success\n";

echo "  - Copy $pharName in project\n";
copy($pharName, '../../static/'.$pharName);
copy($pharName, sys_get_temp_dir() . '/'.$pharName);
