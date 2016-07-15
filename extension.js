'use  strict';

var vscode = require('vscode');
var yaspeller = require('yandex-speller');
var fs = require('fs');

var settings;
var settingPath = "/.vscode/spell.json";
var CONFIGFILE;
var problems = new Array();

var Doc = vscode.window.activeTextEditor.document;

function activate(context) {
    CONFIGFILE = vscode.workspace.rootPath + settingPath;
    settings = readSettings();
    var disposable = vscode.commands.registerCommand('extension.checkText', function () {
        createDiagnostic();
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
                    var startPos = Doc.positionAt(problem.pos);
                    var endPos = Doc.positionAt(problem.len + problem.pos);
                    var rng = new vscode.Range(startPos.line,startPos.character,endPos.line,endPos.character);
                    var check = DeleteRegExp(startPos, endPos);
                    if (check != 1)
                    {
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
            }
            cb(problems);
        }
        if (docProblems.length === 0){
            vscode.window.showInformationMessage("No errors");
        }      
    }, {lang: settings.language});
}


function createDiagnostic()
{
        var spellingErrors = vscode.languages.createDiagnosticCollection("Spelling");
        var diagnostics = new Array();
        var docToCheck = Doc.getText();
        
        problems = [];

        if (settings.languageIDs.indexOf(Doc.languageId) !== -1) {
            spellcheckDocument(docToCheck, function (problems) {
            for (var x = 0; x < problems.length; x++) {
                var problem = problems[x];
                var lineRange = new vscode.Range(problem.startLine, problem.startChar, problem.endLine, problem.endChar);
                var loc = new vscode.Location(Doc.uri, lineRange);

                var diag = new vscode.Diagnostic(lineRange, problem.message, vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diag);
            }
            spellingErrors.set(Doc.uri, diagnostics);
        });
    }
}

function DeleteRegExp(start, end) {
    var Pattern = GetPatterns(Doc.getText());
    for (var i = 0; i < Pattern.length; i++) {
        var per = Pattern[i];
        if (per[0].line === start.line) {
            if (per[0]._character <= start.character && per[1]._character >= end.character) {
                return 1;
            }
        }
    }
    return 0;
}

function GetPatterns(content) {
    var _match;
    var expressions = settings.ignoreRegExp;
    var ARng = new Array();  

    for (var x = 0; x < expressions.length; x++) {
        // Convert the JSON of regExp Strings into a real RegExp
        var flags = expressions[x].replace(/.*\/([gimy]*)$/, '$1');
        var pattern = expressions[x].replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
        pattern = pattern.replace(/\\\\/g, "\\");
        var regex = new RegExp(pattern, flags);
        _match = content.match(regex);
        if (_match !== null) {
            // look for a multi line match and build enough lines into the replacement
            for (var i = 0; i < _match.length; i++) {
                var StartP = content.indexOf(_match[i]);
                var EndP = _match[i].length;
                var sp = Doc.positionAt(StartP);
                var ep = Doc.positionAt(StartP + EndP);
                var Rng = new Array();
                Rng.push(sp);
                Rng.push(ep);            
                ARng.push(Rng);
            }
        }
    }
    return ARng;
}

function suggestFix() {
    var items = new Array();
    var e = vscode.window.activeTextEditor;
    var sel = e.selection;
    var wordRange = Doc.getWordRangeAtPosition(sel.active);
    var word = Doc.getText(wordRange);

    var problem = problems.filter(function (obj) {
            return obj.error === word;
        });
          
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
    items.push({lable: "IGNORE LIST" , decription:"Add [" + word + "] to ignore list"});
    
    var pr = vscode.window.showQuickPick(items);
    pr.then(function(selection) {
       if (selection.lable === "IGNORE LIST") {
            settings.ignoreWordsList.push(word);
            updateSettings();
            createDiagnostic();
       }else {
                if (selection.label !== null) {
                    e.edit(function (edit) {
                        edit.replace(wordRange, selection.label);
                        createDiagnostic();
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
                                "ignoreRegExp": ["/`(kb.*?)`/g","/(http\\\\S*)/gm","/\\\\(.*.png\\\\)/g","/\\\\(.*.gif\\\\)/g","/\\\\(.*.md\\\\)/g","/\\\\(.*.jpg\\\\)/g","/^((`{3}\\\\s*)(\\\\w+)?(\\\\s*([\\\\w\\\\W]+?)\\\\n*)\\\\2)\\\\n*(?:[^\\\\S\\\\w\\\\s]|$)/gm"]\
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