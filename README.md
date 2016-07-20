# Spelling Checker (RU, EN)

>**Notice:** This extension uses the [yandex-speller](https://github.com/hcodes/yandex-speller) service to check for spelling and grammatical errors.

## Functionality

Checking will occur as you call the command by hitting `Alt+Shift+A` or you may hit `F1` and type 'Spelling Checker' and choose this extension.

It will highlight both spelling mistakes as well as grammatical errors.

You can fix any word by placing the cursor in it and hitting `Alt+Shift+S`. Then choose in the Command Line any variant you like.

If extension did not find any errors you will see in the Information Message `No errors`.

When your cursor is within an error you can get suggested word.

## Installing the Extension

Open up VS Code and hit `F1` and type `ext` select install and type `spellcheck` hit enter and reload window to enable.

## Config File

The extension has a rich configuration file to customize the experience.  The file is named `spell.json` should go in the `.vscode` directory. 

>**Tip:** If you make manual updated you need to reload the VS Code window ie. `F1` followed by `Reload Window`.

It has the following sections/capabilities:

* `ignoreWordsList` an array of strings that represents words not to check (this can be added to via the `Alt+Shift+S` suggest fix menu).
* `ignoreRegExp` an array of regular expressions for text to not check.  This array is empty by default.
* `language` support for two languages 
* `languageIDs` configure more file types to check e.g. `plaintext` or `latex` 

More details on each setting are provided below.  A [sample file](https://github.com/JuliaBay/Spell-Cheker/blob/master/.vscode/spell.json) is included in this repo.

### Add to Ignore List/Dictionary

The suggestion list provides an option to add words to the dictionary.  Select that item and the `spell.json` config file `ignoreWordsList` array will have the word added to it and the document will be checked again.  

``` json
    "ignoreWordsList": [
        "vscode",
        "Markdown"
    ]
```

>**Tip:** You can manually edit that file if you wish to remove words.

### Ignoring Common Blocks

Sometimes you may want to ignore an entire block of text.  This can be useful for avoiding code blocks, links and other common chunks.  To do this there is a section in the config file `ignoreRegExp` where you can put an array of expressions.  These expressions will be matched in te document (in the order of the array) and any matches will not be checked for problems.

Here are a few example strings for Markdown... The first 5 ignore a set of easy to match links, the last one ignores code blocks.

``` json
    "ignoreRegExp": [
        "/(http\\\\S*)/gm",
        "/\\\\(.*.png\\\\)/g",
        "/\\\\(.*.gif\\\\)/g",
        "/\\\\(.*.md\\\\)/g",
        "/\\\\(.*.jpg\\\\)/g",
        "/^((`{3}\\\\s*)(\\\\w+)?(\\\\s*([\\\\w\\\\W]+?)\\\\n*)\\\\2)\\\\n*(?:[^\\\\S\\\\w\\\\s]|$)/gm"
    ]
```

> **Tip:** The regular expression are stored in JSON format so the strings must be escaped - typically meaning `\` should be replaced by `\\\\`.

### Checking Additional File Types

It is possible to configure the extension to work on additional file types by altering a setting.

``` json
    "languageIDs": [
        "markdown",
        "latex",
        "plaintext",
        "todo"
    ]
```
