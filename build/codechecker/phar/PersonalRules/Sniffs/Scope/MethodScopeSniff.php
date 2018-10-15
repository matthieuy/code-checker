<?php
/**
 * Verifies that class members have scope modifiers.
 *
 * PHP version 5
 *
 * @category  PHP
 * @package   PHP_CodeSniffer
 * @author    Greg Sherwood <gsherwood@squiz.net>
 * @author    Marc McIntyre <mmcintyre@squiz.net>
 * @copyright 2006 Squiz Pty Ltd (ABN 77 084 670 600)
 * @license   http://matrix.squiz.net/developer/tools/php_cs/licence BSD Licence
 * @version   CVS: $Id: MethodScopeSniff.php 301632 2010-07-28 01:57:56Z squiz $
 * @link      http://pear.php.net/package/PHP_CodeSniffer
 */

//if (class_exists('PHP_CodeSniffer_Standards_AbstractScopeSniff', true) === false) {
//    throw new PHP_CodeSniffer_Exception('Class PHP_CodeSniffer_Standards_AbstractScopeSniff not found');
//}

/**
 * Verifies that class members have scope modifiers.
 *
 * @category  PHP
 * @package   PHP_CodeSniffer
 * @author    Greg Sherwood <gsherwood@squiz.net>
 * @author    Marc McIntyre <mmcintyre@squiz.net>
 * @copyright 2006 Squiz Pty Ltd (ABN 77 084 670 600)
 * @license   http://matrix.squiz.net/developer/tools/php_cs/licence BSD Licence
 * @version   Release: 1.3.0
 * @link      http://pear.php.net/package/PHP_CodeSniffer
 */
class Symfony2_Sniffs_Scope_MethodScopeSniff extends \PHP_CodeSniffer\Sniffs\AbstractScopeSniff //PHP_CodeSniffer_Standards_AbstractScopeSniff
{
    /**
     * Constructs a Symfony2_Sniffs_Scope_MethodScopeSniff.
     */
    public function __construct()
    {
        parent::__construct(array(T_CLASS), array(T_FUNCTION));

    }//end __construct()

    /**
     * Processes the function tokens within the class.
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile The file where this token was found.
     * @param int $stackPtr The position where the token was found.
     * @param int $currScope The current scope opener token.
     *
     * @return void
     * @throws \PHP_CodeSniffer\Exceptions\RuntimeException
     */
    protected function processTokenWithinScope(\PHP_CodeSniffer\Files\File $phpcsFile, $stackPtr, $currScope)
    {
        $tokens = $phpcsFile->getTokens();

        $methodName = $phpcsFile->getDeclarationName($stackPtr);
        if ($methodName === null) {
            // Ignore closures.
            return;
        }

        $modifier = $phpcsFile->findPrevious(\PHP_CodeSniffer\Util\Tokens::$scopeModifiers, $stackPtr);
        if (($modifier === false) || ($tokens[$modifier]['line'] !== $tokens[$stackPtr]['line'])) {
            $error = 'No scope modifier specified for function "%s"';
            $data  = array($methodName);
            $phpcsFile->addError($error, $stackPtr, 'Missing', $data);
        }

    }//end processTokenWithinScope()

    /**
     * Processes a token that is found outside the scope that this test is
     * listening to.
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile The file where this token was found.
     * @param int $stackPtr The position in the stack where this
     *                                               token was found.
     *
     * @return void|int Optionally returns a stack pointer. The sniff will not be
     *                  called again on the current file until the returned stack
     *                  pointer is reached. Return (count($tokens) + 1) to skip
     *                  the rest of the file.
     */
    protected function processTokenOutsideScope(\PHP_CodeSniffer\Files\File $phpcsFile, $stackPtr)
    {
    }
}//end class
