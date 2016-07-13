'use  strict';

var vscode = require('vscode');
var yaspeller = require('yandex-speller');
var fs = require('fs');
var path = require('path');

var settings;
var settingPath = "/.vscode/spell.json";
var CONFIGFILE;
var problems = new Array();

function activate(context) {

    CONFIGFILE = context.extensionPath + settingPath;
    settings = readSettings();
    var disposable = vscode.commands.registerCommand('extension.checkText', function () {
        createDiagnostic(vscode.window.activeTextEditor.document);
    });
    var disposable1 = vscode.commands.registerCommand('Spell.suggestionsFix', function () {
        suggestFix();
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable1);  
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;

function spellcheckDocument(text,cb){
   
    yaspeller.checkText(text, function(err, docProblems){
        if (docProblems != null) {
            for(var i=0; i<docProblems.length; i++){
                if (settings.ignoreWordsList.indexOf(docProblems[i].word) === -1) {
                    var problem = docProblems[i];
                    var activeEditor = vscode.window.activeTextEditor;
                    var startPos = activeEditor.document.positionAt(problem.pos);
                    var endPos = activeEditor.document.positionAt(problem.len + problem.pos);
                    var rng = new vscode.Range(startPos.line,startPos.character,endPos.line,endPos.character);
                    
                    problems.push({
                        error: problem.word,
                        startLine: startPos.line,
                        startChar: startPos.character,
                        endLine: endPos.line,
                        endChar: endPos.character,
                        message:  " [" + problem.word + "] - suggest [" + problem.s + "]",
                        suggestions: problem.s
                    });
                }
            }
            cb(problems);
        }
        if (docProblems.length === 0){
            vscode.window.showInformationMessage("No errors");
        }      
    }, {lang: settings.language});
}


function createDiagnostic(document)
{
        var spellingErrors = vscode.languages.createDiagnosticCollection("Spelling");
        var diagnostics = new Array();
        var docToCheck = document.getText();

        problems = [];

        if (settings.languageIDs.indexOf(document.languageId) !== -1) {
            spellcheckDocument(docToCheck, function (problems) {
            for (var x = 0; x < problems.length; x++) {
                var problem = problems[x];
                var lineRange = new vscode.Range(problem.startLine, problem.startChar, problem.endLine, problem.endChar);
                var loc = new vscode.Location(document.uri, lineRange);

                var diag = new vscode.Diagnostic(lineRange, problem.message, vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diag);
            }
            spellingErrors.set(document.uri, diagnostics);
        });
    }


}
function suggestFix() {
    var items = new Array();
    var e = vscode.window.activeTextEditor;
    var d = e.document;
    var sel = e.selection;
    var wordRange = d.getWordRangeAtPosition(sel.active);
    var word = d.getText(wordRange);

    var problem = problems.filter(function (obj) {
            return obj.error === word;
        });
          
    items.push({lable: "IGNORE LIST" , decription:"Add [" + word + "] to ignore list"});
    if (problem.length !== 0) {
            if (problem[0].suggestions.length > 0) {
            
                for (var i = 0; i < problem[0].suggestions.length; i++) {
                    items.push({ label: problem[0].suggestions[i], description: "Replace [" + word + "] with [" + problem[0].suggestions[i] + "]" });
                }
            } else {
                items.push({ label: null, description: "No suggestions available sorry..." });
            }
            
        } else {
            items.push({ label: null, description: "No suggestions available sorry..." });
        }
    var pr = vscode.window.showQuickPick(items);
    pr.then(function(selection) {
       if (selection.lable === "IGNORE LIST") {
            settings.ignoreWordsList.push(word);
            updateSettings();
            createDiagnostic(vscode.window.activeTextEditor.document);
       }else {
                if (selection.label !== null) {
                    e.edit(function (edit) {
                        edit.replace(wordRange, selection.label);
                    });
                }
            }
    });
}

function readSettings() {
    var cfg = readJsonFile(CONFIGFILE);
    function readJsonFile(file) {
        try {
            cfg = JSON.parse(fs.readFileSync(file).toString());
        }
        catch (err) {
            cfg = JSON.parse('{\
                                "version": "0.1.0", \
                                "language": ["ru","en"], \
                                "ignoreWordsList": [], \
                                "languageIDs": ["markdown","plaintext"],\
                                "ignoreRegExp": []\
                              }');
        }

        //gracefully handle new fields
        if (cfg.languageIDs === undefined) cfg.languageIDs = ["markdown"];
        if (cfg.language === undefined) cfg.language = ["ru"];
        if (cfg.ignoreRegExp === undefined) cfg.ignoreRegExp = [];

        return cfg;
    }

    return {
        language: cfg.language,
        ignoreWordsList: cfg.ignoreWordsList,
        languageIDs: cfg.languageIDs,
        ignoreRegExp: cfg.ignoreRegExp
    }
}

function updateSettings() {
    fs.writeFileSync(CONFIGFILE, JSON.stringify(settings));
}