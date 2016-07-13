'use  strict';

var vscode = require('vscode');
var yaspeller = require('yandex-speller');
var fs = require('fs');
var path = require('path');
var settings;
var settingPath = "/.vscode/spell.json";
var CONFIGFILE;
function activate(context) {
    CONFIGFILE = context.extensionPath + settingPath;
    settings = readSettings();

    vscode.commands.registerCommand('Spell.suggestFix', suggestFix);
    var disposable = vscode.commands.registerCommand('extension.checkText', function () {
        
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; 
        }
        var text = editor.document;
     
        createDiagnostic(text);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;

function createDiagnostic(text)
{
        var spellingErrors = vscode.languages.createDiagnosticCollection("Spelling");
        var diagnostics = new Array();
        yaspeller.checkText(text.getText(), function(err, docProblems){
            if (docProblems != null) {
                for(var i=0; i<docProblems.length; i++){
                    var problem = docProblems[i];
                    
                    var activeEditor = vscode.window.activeTextEditor;
                    var startPos = activeEditor.document.positionAt(problem.pos);
                    var endPos = activeEditor.document.positionAt(problem.len + problem.pos);
                    var rng = new vscode.Range(startPos.line,startPos.character,endPos.line,endPos.character);
                    
                    var loc = new vscode.Location(text.uri, rng);	
                    var diag = new vscode.Diagnostic(rng,'Suggestion word: ' + problem.s[0],vscode.DiagnosticSeverity.Warning);
                    diagnostics.push(diag);
                };
                spellingErrors.set(text.uri, diagnostics);
            }
            if (docProblems.length === 0){
                    vscode.window.showInformationMessage("No errors");
                    }       
        }, {lang: settings.language});
}
function suggestFix() {
    var items= new Array();
    items.push({lable: "ADD TO IGNORE LIST", decription:"Add word to ignore list"});
    vscode.window.showQuickPick(items,function (selection) {
       if (selection.lable === "ADD TO IGNORE LIST") {
            settings.ignoreWordsList.push(word);
            updateSettings();
            createDiagnostic(vscode.window.activeTextEditor.document);
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
                                "languageIDs": ["markdown","text"],\
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