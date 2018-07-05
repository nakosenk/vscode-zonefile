'use strict';

import { workspace, languages, window, commands, ExtensionContext, Disposable, TextDocument, TextEditorEdit, Range, Position } from 'vscode';
import { parseZoneFile } from './parser/parser';
import { ZoneFile } from './parser/types';
import { formatZoneFile } from './commands';

let parsedFiles: Map<string, ZoneFile>;

export function activate(context: ExtensionContext) {
    console.log("vscode-zonefile has loaded.");
    parsedFiles = new Map();

    let activeEditor = window.activeTextEditor;
    registerCommands(context);

    if (activeEditor && activeEditor.document.languageId === "zone") {
        parseFile(activeEditor.document);
    }

    window.onDidChangeActiveTextEditor(editor => {
		if (editor && editor.document.languageId === "zone") {
            parseFile(editor.document);
		}
	}, null, context.subscriptions);

	workspace.onDidChangeTextDocument(event => {
		if (event.document.languageId === "zone") {
            parseFile(event.document);
		}
	}, null, context.subscriptions);
}

function parseFile(document: TextDocument) {
    let uri = document.uri.toString();
    let file = parseZoneFile(document.getText());

    parsedFiles.set(uri, file);
}

function registerCommands(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand("vscode-zonefile.formatZoneFileDocument", formatZoneFileDocument));
}

function formatZoneFileDocument() {
    let activeEditor = window.activeTextEditor;
    let uri = activeEditor.document.uri.toString();
    let zoneFile = parsedFiles.get(uri);
    let formattedFile = formatZoneFile(zoneFile);

    activeEditor.edit((editBuilder: TextEditorEdit) => {
        editBuilder.delete(new Range(0, 0, activeEditor.document.lineCount, 0));
        editBuilder.insert(new Position(0,0), formattedFile);
    });
}