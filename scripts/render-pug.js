'use strict';
const fs = require('fs');
const upath = require('upath');
const pug = require('pug');
const sh = require('shelljs');
const prettier = require('prettier');
const cite = require('citation-js');

module.exports = function renderPug(filePath) {
    const destPath = filePath.replace(/src\/pug\//, 'dist/').replace(/\.pug$/, '.html');
    const srcPath = upath.resolve(upath.dirname(__filename), '../src');

    let pubList = {};
    const bibPath = upath.resolve(srcPath, 'assets/bib');
    sh.ls(bibPath.concat('/*.bib')).forEach(function (file) {
        let rdObj = fs.readFileSync(file);
        let bibObj = new cite(rdObj.toString());
        let bibId = bibObj.data[0].id
        let bibText = bibObj.format('bibliography', {
            format: 'text',
            template: 'apa'
        });
        bibText = bibText.split('https://')
        pubList[bibId] = {};
        pubList[bibId]['bib'] = bibText[0].trim()
        if (bibText.length > 1) {
            pubList[bibId]['doi'] = 'https://' + bibText[1].trim()
        }
    });

    console.log(`### INFO: Rendering ${filePath} to ${destPath}`);
    const html = pug.renderFile(filePath, {
        doctype: 'html',
        filename: filePath,
        basedir: srcPath,
        pub: pubList
    });

    const destPathDirname = upath.dirname(destPath);
    if (!sh.test('-e', destPathDirname)) {
        sh.mkdir('-p', destPathDirname);
    }

    const prettified = prettier.format(html, {
        printWidth: 1000,
        tabWidth: 4,
        singleQuote: true,
        proseWrap: 'preserve',
        endOfLine: 'lf',
        parser: 'html',
        htmlWhitespaceSensitivity: 'css'
    });

    fs.writeFileSync(destPath, prettified);
};
