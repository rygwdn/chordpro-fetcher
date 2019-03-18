const fs = require('fs'); 

const {
  actionOutput,
  buildShortcut,
  withVariables,
  variable,
} = require('@joshfarrant/shortcuts-js');

const {
  conditional,
  text,
  comment,
  getContentsOfURL,
  getDictionaryValue,
  setVariable,
  getVariable,
  runJavaScriptOnWebPage,
  showAlert,
  exitShortcut,
  openURLs,
  showResult,
  setName,
} = require('@joshfarrant/shortcuts-js/actions');

const {
  COLORS,
  GLYPHS,
} = require('@joshfarrant/shortcuts-js/meta');

const {
  shortcutInput,
} = require('@joshfarrant/shortcuts-js/variables');


const { withActionOutput } = require('@joshfarrant/shortcuts-js/build/utils');
const openInOnSong = withActionOutput(WFWorkflowAction => ({
  WFWorkflowActionIdentifier: "is.workflow.actions.openin",
  WFWorkflowActionParameters: {
    "WFOpenInAskWhenRun": false,
    "WFOpenInAppIdentifier": "com.onsongapp.onsong"
  }
}))

const tagNameVar = variable('Tag Name')
const jsVar = variable('JS Content')
const resultVar = variable('Result')
const errorVar = variable('Error')
const versionErrorVar = variable('Version Error')
const urlVar = variable('URL')
const nameVar = variable('Name')

const actions = [
  comment({text: 'Get latest version of JS'}),
  text({text: 'https://api.github.com/repos/rygwdn/chordpro-fetcher/releases/latest'}),
  getContentsOfURL({}),
  getDictionaryValue({get: 'Value', key: 'tag_name'}),
  setVariable({variable: tagNameVar}),
  text({text: withVariables`https://github.com/rygwdn/chordpro-fetcher/releases/download/${tagNameVar}/shortcut.js`}),
  getContentsOfURL({}),
  setVariable({variable: jsVar}),

  comment({text: 'Run the JS to get ChordPro'}),
  getVariable({variable: shortcutInput}),
  runJavaScriptOnWebPage({
    text: withVariables`${jsVar}

shortcut.run(1)`,
  }),
  setVariable({variable: resultVar}),

  comment({text: 'Handle errors'}),
  getVariable({variable: resultVar}),
  getDictionaryValue({get: 'All Keys'}),
  conditional({
    input: 'Contains',
    value: 'error',
    ifTrue: [
      getVariable({variable: resultVar}),
      getDictionaryValue({get: 'Value', key: 'error'}),
      setVariable({variable: errorVar}),
      showAlert({
        title: 'Error',
        message: withVariables`Failed to build file.

${errorVar}`,
        showCancelButton: false,
      }),
      exitShortcut(),
    ],
  }),

  comment({text: 'Handle version errors'}),
  getVariable({variable: resultVar}),
  getDictionaryValue({get: 'All Keys'}),
  conditional({
    input: 'Contains',
    value: 'versionError',
    ifTrue: [
      getVariable({variable: resultVar}),
      getDictionaryValue({get: 'Value', key: 'versionError'}),
      setVariable({variable: versionErrorVar}),

      getVariable({variable: resultVar}),
      getDictionaryValue({get: 'Value', key: 'url'}),
      setVariable({variable: urlVar}),

      showAlert({
        title: 'Version Mismatch',
        message: withVariables`${versionErrorVar}

Do you want to open ${urlVar}?`,
        showCancelButton: true,
      }),

      getVariable({variable: urlVar}),
      openURLs(),
      exitShortcut(),
    ],
  }),

  comment({text: 'Used for testing..'}),
  text({text: 'F'}),
  conditional({
    input: '=',
    value: 'T',
    ifTrue: [
      showResult({
        text: withVariables`GOT: ${resultVar}`,
      }),
      exitShortcut(),
    ],
  }),

  getVariable({variable: resultVar}),
  getDictionaryValue({get: 'Value', key: 'name'}),
  setVariable({variable: nameVar}),

  getVariable({variable: resultVar}),
  getDictionaryValue({get: 'Value', key: 'file'}),
  setName({
    name: withVariables`${nameVar}.onsong`,
    dontIncludeFileExtension: false,
  }),
  openInOnSong(),
];

const shortcut = buildShortcut(actions, {
  icon: {
    color: COLORS.DARK_BLUE,
    glyph: GLYPHS.DOCUMENT,
  },
  showInWidget: false,
  // TODO: need to be able to set "Show in Share Sheet: Safari web pages"
});

// Write the Shortcut to a file in the current directory
fs.writeFile('Open in OnSong 2.shortcut', shortcut, (err) => {
  if (err) {
    console.error('Something went wrong :(', err);
    return;
  }
  console.log('Shortcut created!');
});
