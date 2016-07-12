'use  strict';

var vscode = require('vscode');
var yaspeller = require('yandex-speller');
var fs = require('fs');

var CONFIGFILE = vscode.workspace.rootPath + "/.vscode/spell.json";
var ErrorWords =  new Array();
var problems = new Array();
var spellingErrors = vscode.languages.createDiagnosticCollection("Spelling");

function createDiagnostic(text,settings)
{
    var DecorationType = vscode.window.createTextEditorDecorationType({
        textDecoration: 'underline',
        color: '#A435A5'
        });	
        var problemSuggestions = new Array();
        var diagnostics = new Array();
        yaspeller.checkText(text.getText(), function(err, docProblems){
            if (docProblems != null) {
                for(var i=0; i<docProblems.length; i++){
                    var problem = docProblems[i];
                    var problemTXT = problem.word;
                    var activeEditor = vscode.window.activeTextEditor;
                    var startPos = activeEditor.document.positionAt(problem.pos);
                    var endPos = activeEditor.document.positionAt(problem.len + problem.pos);
                    var rng = new vscode.Range(startPos.line,startPos.character,endPos.line,endPos.character);
                    var loc = new vscode.Location(text.uri, rng);

                    //var decoration = vscode.DecorationOptions;
                    //decoration = { range: rng, hoverMessage: 'Изменить слово на ' + problem.s[0]};

                    //ErrorWords.push(decoration);
                
                    //activeEditor.setDecorations(DecorationType,[decoration]);
                 
                   problems.push({
                        error: problemTXT,
                        startLine: startPos.line,
                        startChar: startPos.character,   
                        endLine: endPos,
                        endChar: endPos.character, 
                        suggestions: problem.s[0],
                        type: problem.description
                        
                    });

                //var lineRange = new vscode.Range(problem.startLine, problem.startChar, problem.endLine, problem.endChar);
               
                //var diag = new vscode.Diagnostic(lineRange, problem.message, convertSeverity(problem.type));
    
							
                var diag = new vscode.Diagnostic(rng,'Suggestion word: ' + problem.s[0],vscode.DiagnosticSeverity.Error);
                diag.source = 'Spell Checker';
                diagnostics.push(diag);
                console.log(diagnostics);
                //var edit = new vscode.WorkspaceEdit();
			    //edit.replace( document.uri, diagnostic.range, suggestion );
			    //vscode.workspace.applyEdit( edit );

                };
               
                spellingErrors.set(text.uri, diagnostics);

                 //activeEditor.setDecorations(DecorationType,ErrorWords);
                //CreateDiagnostics();
            }
            else{
                    vscode.window.showInformationMessage("");
            }
            
                //применить одну декорацию
                //activeEditor.setDecorations(DecorationType,[decoration]);
                
     
               
        }, {lang: settings.language});
}


function activate(context) {

    var disposable = vscode.commands.registerCommand('extension.sayHello', function () {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        if(ErrorWords.length>0){
            //workspace.action.closeActiveEditor();
            //workbench.action.closeActiveEditor();

            removeWords(ErrorWords);
        }
        var selection = editor.selection;
        var text = editor.document;
        console.log(editor.document);
        createDiagnostic(text,readSettings());
    });

    var disposable1 = vscode.workspace.onDidOpenTextDocument(function () {
    });
    var disposable2 = vscode.workspace.onDidChangeTextDocument(function () {
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;

/*function CreateDiagnostics(document) {
    var diagnostics = new Array();
    var spellingErrors = vscode.languages.createDiagnosticCollection("spelling");
    var docToCheck = document.getText();

    // clear existing problems
    problems = [];

    if (settings.languageIDs.indexOf(document.languageId) !== -1) {
        // removeUnwantedText before processing the spell checker ignores a lot of chars so removing them aids in problem matching
        docToCheck = removeUnwantedText(docToCheck);
        docToCheck = docToCheck.replace(/[`\"!#$%&()*+,.\/:;<=>?@\[\]\\^_{|}]/g, " ");

        spellcheckDocument(docToCheck,function (problems) {
            for (var x = 0; x < problems.length; x++) {
                var problem = problems[x];
                var lineRange = new vscode.Range(problem.startLine, problem.startChar, problem.endLine, problem.endChar);
                var loc = new vscode.Location(document.uri, lineRange);

                var diag = new vscode.Diagnostic(lineRange, problem.message, convertSeverity(problem.type));
                diagnostics.push(diag);
            }
            spellingErrors.set(document.uri, diagnostics);
        });
    }
}          

// Take in a text doc and produce the set of problems for both the editor action and actions
// teacher does not return a line number and results are not in order - so a lot of the code is about 'guessing' a line number
function spellcheckDocument(content,function cb(report) {
    var problemMessage;
    var detectedErrors;
    var ya = new yaspeller.checkText(settings.language);
    yaspeller.checkText(content, function (err, docProblems) {
        if (docProblems != null) {
            for (var i = 0; i < docProblems.length; i++) {
                if (settings.ignoreWordsList.indexOf(docProblems[i].string) === -1) {
                    var problem = docProblems[i];
                    var problemTXT = problem.string;
                    var problemPreContext = (typeof problem.precontext !== "object") ? problem.precontext + " " : "";
                    var problemWithPreContent = problemPreContext + problemTXT;
                    var problemSuggestions= new Array();
                    var startPosInFile = -1;

                    // Check to see if this error has been seen before use the full context for improved uniqueness
                    // This is required as the same error can show up multiple times in a single doc - catch em all
                    if (detectedErrors[problemWithPreContent] > 0) {
                        startPosInFile = nthOccurrence(content, problemTXT, problemPreContext, detectedErrors[problemWithPreContent] + 1);
                    } else {
                        startPosInFile = nthOccurrence(content, problemTXT, problemPreContext, 1);
                    }

                    if (startPosInFile !== -1) {
                        var linesToMistake= content.substring(0, startPosInFile).split('\n');
                        var numberOfLinesToMistake = linesToMistake.length - 1;

                        if (!detectedErrors[problemWithPreContent]) detectedErrors[problemWithPreContent] = 1;
                        else ++detectedErrors[problemWithPreContent];

                        // make the suggestions an array even if only one is returned
                        if (String(problem.suggestions) !== "undefined") {
                            if (Array.isArray(problem.suggestions.option)) problemSuggestions = problem.suggestions.option;
                            else problemSuggestions = [problem.suggestions.option];
                        }

                        problems.push({
                            error: problemTXT,
                            preContext: problemPreContext,
                            startLine: numberOfLinesToMistake,
                            startChar: linesToMistake[numberOfLinesToMistake].length,
                            endLine: numberOfLinesToMistake,
                            endChar: linesToMistake[numberOfLinesToMistake].length + problemTXT.length,
                            type: problem.description,
                            message: problem.description + " [" + problemTXT + "] - suggest [" + problemSuggestions.join(", ") + "]",
                            suggestions: problemSuggestions
                        });
                    }
                }
            }
            cb(problems);
        }
    });
}*/

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
                                "mistakeTypeToStatus": { \
                                    "Spelling": "Error", \
                                    "Passive Voice": "Information", \
                                    "Complex Expression": "Information",\
                                    "Hyphen Required": "Warning"\
                                    },\
                                "languageIDs": ["markdown","text"],\
                                "ignoreRegExp": []\
                              }');
        }

        //gracefully handle new fields
        if (cfg.languageIDs === undefined) cfg.languageIDs = ["markdown"];
        if (cfg.language === undefined) cfg.language = ["ru","en"];
        if (cfg.ignoreRegExp === undefined) cfg.ignoreRegExp = [];

        return cfg;
    }

    return {
        language: cfg.language,
        ignoreWordsList: cfg.ignoreWordsList,
        mistakeTypeToStatus: cfg.mistakeTypeToStatus,
        languageIDs: cfg.languageIDs,
        ignoreRegExp: cfg.ignoreRegExp
    }
}
function convertSeverity(mistakeType) {
    var mistakeTypeToStatus = settings.mistakeTypeToStatus;

    switch (mistakeTypeToStatus[mistakeType]) {
        case "Warning":
            return vscode.DiagnosticSeverity.Warning;
        case "Information":
            return vscode.DiagnosticSeverity.Information;
        case "Error":
            return vscode.DiagnosticSeverity.Error;
        case "Hint":
            return vscode.DiagnosticSeverity.Hint;
        default:
            return vscode.DiagnosticSeverity.Hint;
    }
}

function updateSettings() {
    fs.writeFileSync(CONFIGFILE, JSON.stringify(settings));
}