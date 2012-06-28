#!/usr/bin/env bash
cd src
echo "compiling squim parser"
jison squim.parser.jison -o squim.parser.js -m amd
echo "adding dependencies to define call"
(echo "1c" ; 
 echo "define(['squim.types'], function (Types){";
 echo ".";
 echo "wq") | ed -s squim.parser.js
