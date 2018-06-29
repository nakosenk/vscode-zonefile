'use strict';

import { workspace, languages, window, commands, ExtensionContext, Disposable, TextDocument } from 'vscode';
// import * as zf from 'dns-zonefile';
const zf = require('dns-zonefile');

let parsedFile: any;

export function activate(context: ExtensionContext) {
    console.log("vscode-zonefile has loaded.");

    let activeEditor = window.activeTextEditor;
    
    if (activeEditor && activeEditor.document.languageId === "zone") {
        parsedFile = parseFile(activeEditor.document);
    }

    window.onDidChangeActiveTextEditor(editor => {
		if (editor && editor.document.languageId === "zone") {
            parsedFile = parseFile(editor.document);
		}
	}, null, context.subscriptions);

	workspace.onDidChangeTextDocument(event => {
		if (event.document.languageId === "zone") {
            parsedFile = parseFile(event.document);
		}
	}, null, context.subscriptions);
}

function parseFile(document: TextDocument) : any {
    return zf.parse(document.getText());
}