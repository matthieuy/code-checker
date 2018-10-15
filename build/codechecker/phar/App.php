<?php

/**
 * Class App
 */
class App {
    /**
     * Run app (entry point)
     */
    public function run()
    {
        $argv = $_SERVER['argv'];
        array_shift($argv);

        if (!count($argv)) {
            die("Paramètre manquant");
        }
        $cmd = $argv[0];
        array_shift($argv);

        switch ($cmd) {
            // Analyse PHP
            case 'phpcs':
                $this->runPhpcs($argv);
                break;

            // Fix PHP
            case 'phpcbf':
                $this->runPhpcbf($argv);
                break;

            // PHP MD
            case 'phpmd':
                $this->runPhpMd($argv);
                break;

            // PHP CPD
            case 'phpcpd':
                $this->runPhpCpd($argv);
                break;

            // PHP LOC
            case 'phploc':
                $this->runPhpLoc($argv);
                break;
        }

        die("Mauvais paramètre");
    }

    /**
     * Run PHP CodeSniffer (check php syntaxe)
     * @param array $argv
     */
    protected function runPhpcs(array $argv)
    {
        array_unshift($argv, '--standard=phar://codechecker.phar/PersonalRules');
        array_unshift($argv, '--report=json');

        $runner = new PHP_CodeSniffer\Runner();
        $exitCode = $runner->runPHPCS($argv);
        exit($exitCode);
    }

    /**
     * Run PHP CBF (fix php code)
     * @param array $argv
     */
    protected function runPhpcbf(array $argv)
    {
        array_unshift($argv, '--standard=phar://codechecker.phar/PersonalRules');
        array_unshift($argv, '--report=json');

        $runner = new PHP_CodeSniffer\Runner();
        $exitCode = $runner->runPHPCBF($argv);
        exit($exitCode);
    }

    /**
     * Run PHP Mess Detector (check php complexity)
     * @param array $argv
     */
    protected function runPhpMd(array $argv)
    {
        array_unshift($argv, '');
        $argv[] = 'xml';
        $argv[] = 'phar://codechecker.phar/phpmd.xml';
        $exitCode = PHPMD\TextUI\Command::main($argv);
        exit($exitCode);
    }

    /**
     * Run PHP CPD (check php copy/paste)
     * @param array $argv
     */
    protected function runPhpCpd(array $argv)
    {
        $finder = new \SebastianBergmann\FinderFacade\FinderFacade($argv);

        $files = $finder->findFiles();
        if (empty($files)) {
            exit(0);
        }

        $strategy = new \SebastianBergmann\PHPCPD\Detector\Strategy\DefaultStrategy();
        $detector = new \SebastianBergmann\PHPCPD\Detector\Detector($strategy, null);
        $clones = $detector->copyPasteDetection($files);

        $pmd = new \SebastianBergmann\PHPCPD\Log\PMD('php://stdout');
        $pmd->processClones($clones);

        if (count($clones) > 0) {
            exit(1);
        }
        exit(0);
    }

    /**
     * Run PHP LOC (get project stats
     * @param array $argv
     */
    protected function runPhpLoc(array $argv)
    {
        try {
            $excludes = array('vendor');
            $finder = new \SebastianBergmann\FinderFacade\FinderFacade($argv, $excludes);

            $files = $finder->findFiles();
            $files = array_filter($files, function ($path) {
                return !is_dir($path);
            });
            if (empty($files)) {
                exit(3);
            }
        } catch (InvalidArgumentException $e) {
            exit(3);
        }

        $analyser = new \SebastianBergmann\PHPLOC\Analyser();
        $count = $analyser->countFiles($files, true);

        $printer = new \SebastianBergmann\PHPLOC\Log\Xml();
        $printer->printResult('php://stdout', $count);
        exit(3);
    }
}
