'use  strict';

var vscode = require('vscode');
var yaspeller = require('yandex-speller');
var fs = require('fs');

var settings;
var CONFIGFILE =  vscode.workspace.rootPath + "/.vscode/spell.json";

function activate(context) {
    settings = readSettings();
    //updateSettings();
    var disposable = vscode.commands.registerCommand('extension.sayHello', function () {
        
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; 
        }
        var text = editor.document;
     
        createDiagnostic(text,settings);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;

function createDiagnostic(text,settings)
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
function readSettings() {
    var cfg = readJsonFile(CONFIGFILE);
    function readJsonFile(file) {
        try {
            cfg = JSON.parse(fs.readFileSync(file).toString());
        }
        catch (err) {
            cfg = JSON.parse('{\
                                "version": "0.1.0", \
                                "language": "ru", \
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