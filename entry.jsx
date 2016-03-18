require("./style.css");
var React = require('react');
var ReactDOM = require('react-dom');
var classNames = require('classnames');
var Dispatcher = require('flux').Dispatcher;
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var phraseDispatcher = new Dispatcher();

var CHANGE_EVENT = 'change';

// Initialize the phraseStore
var phraseStore = assign({}, EventEmitter.prototype, {
  phrase: null,

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  dispatcherIndex: phraseDispatcher.register(function(payload) {
    if (payload.actionType == 'phrase-select') {
      phraseStore.phrase = payload.selectedPhrase
      phraseStore.emitChange();
    }
  })
});

// Each phrase can only have one subphrase that is replaceable
// TODO: Modify it so that it can handle an array
var phrases = [
  {
    base: "J'ai frappé trois fois à la porte",
    verbs: ["frappé"],
    replace: [
      {
        word: "trois",
        variants: [
          {
            learn: "un",  // French
            know: "one"   // English
          },
          {
            learn: "deux",
            know: "two"
          },
          {
            learn: "quarte",
            know: "four"
          },
          {
            learn: "quinze",
            know: "fifteen"
          }
        ]
      }
    ]
  },
  {
    base: "Je vis à New York",
    verbs: [],
    replace: [
      {
        word: "New York",
        variants: [
          {
            learn: "Londres",
            know: "London"
          },
          {
            learn: "Paris",
            know: "Paris"
          }
        ]
      }
    ]
  },
  {
    base: "Je parle Anglais",
    verbs: [],
    replace: [
      {
        word: "Anglais",
        variants: [
          {
            learn: "Francais",
            know: "French"
          },
          {
            learn: "Chinois",
            know: "Chinese"
          },
          {
            learn: "Allemand",
            know: "German"
          },
          {
            learn: "Espanol",
            know: "Spanish"
          }
        ]
      }
    ]
  },
  {
    base: "J'habite dans un appartement",
    verbs: [],
    replace: [
      {
        word: "un appartement",
        variants: [
          {
            learn: "une maison",
            know: "a house"
          },
          {
            learn: "un grand château",
            know: "a big castle"
          },
          {
            learn: "une vieille maison",
            know: "an old house"
          }
        ]
      }
    ]
  },
  {
    base: "Je veux une voiture",
    verbs: [],
    replace: [
      {
        word: "une voiture",
        variants: [
          {
            learn: "un arbre",
            know: "a tree"
          },
          {
            learn: "un billet",
            know: "a ticket"
          },
          {
            learn: "une copine",
            know: "a girlfriend"
          },
          {
            learn: "un couteau",
            know: "a knife"
          }
        ]
      }
    ]
  }
]

var TargetSubPhrase = React.createClass({
  getInitialState: function() {
    return {isCorrect: false}
  },

  classes: function() {
    return classNames({
      'word': true,
      'replaceable': this.props.isReplaceable,
      'input': this.props.isInputField,
      'correct': this.state.isCorrect
    });
  },

  variationClasses: function() {
    return classNames({
      'prompt': true,
      'correct': this.state.isCorrect
    })
  },

  inputAnswer: function(evt) {
    this.setState({isCorrect: evt.target.value == this.props.phrase.learn});
  },

  render: function() {
    if (this.props.isInputField) {
      return  <span className={this.variationClasses()}>
                <input type="text" className="user-input" onKeyUp={this.inputAnswer}/>
                <span className="prompt-know">{this.props.phrase.know}</span>
              </span>;
    } else {
      return <span className={this.classes()}>{this.props.sub}</span>;
    }
    
  }
});

var variationInput = React.createClass({
  render: function() {
    return "";
  }
});

var PhraseVariation = React.createClass({
  classes: function() {
    return classNames({
      'phrase-variation': true,
      'first': this.props.isFirst
    })
  },

  // TODO: Extract to a module
  renderSubPhrase: function(sub) {
    return <TargetSubPhrase key={sub.id}
                            isInputField={this.props.replaceSubPhrase == sub}
                            phrase={this.props.variant}
                            sub={sub}/>
  },  

  phraseDelimiter: function() {
    return this.props.replaceSubPhrase;
  },

  // TODO: Extract to a module
  parsePhraseSegments: function() {
    var baseSubPhrases = this.props.base.split(this.phraseDelimiter());
    return [baseSubPhrases[0], this.phraseDelimiter(), baseSubPhrases[1]];
  },  

  createVariation: function() {
    return this.parsePhraseSegments().map(this.renderSubPhrase);
  },

  render: function() {
    return <div className={this.classes()}>{this.createVariation()}</div>;
  }
});

var VariationContainer = React.createClass({
  renderVariant: function(variant, index) {
    return <PhraseVariation key={variant.id}
                            variant={variant}
                            base={this.props.phrase.base}
                            isFirst={index == 0}
                            replaceSubPhrase={this.props.phrase.replace[0].word}/>
  },

  render: function() {
    return <div className="variation-container">{this.props.phrase.replace[0].variants.map(this.renderVariant)}</div>;
  }
});

var Phrase = React.createClass({
  getInitialState: function() {
    return {selected: false}
  },

  onStoreChange: function() {
    this.setState({selected: phraseStore.phrase == this.props.phrase.base});
  },

  componentDidMount: function() {
    phraseStore.addChangeListener(this.onStoreChange);
  },

  classes: function() {
    return classNames({
      'phrase': true,
      'selected': this.state.selected,
      'first': this.props.isFirst
    });
  },

  subIsReplaceable: function(sub) {
    var subphrases = this.props.phrase.replace.filter(function(obj) { return obj.word == sub });

    return subphrases.length ? true : false;
  },

  // TODO: Extract to a module
  renderSubPhrase: function(sub) {
    return <TargetSubPhrase key={sub.id}
                            isReplaceable={this.subIsReplaceable(sub)}
                            phrase={this.props.phrase}
                            sub={sub}/>
  },

  hasReplacements: function() {
    return this.props.phrase.replace.length;
  },

  phraseDelimiter: function() {
    if (this.hasReplacements()) {
      return this.props.phrase.replace.map(function(obj) {
        return obj.word;
      })[0];
    } else {
      return " ";
    }
  },

  // TODO: Extract to a module
  parsePhraseSegments: function() {
    var baseSubPhrases = this.props.phrase.base.split(this.phraseDelimiter());

    if (this.hasReplacements()) {
      return [baseSubPhrases[0], this.phraseDelimiter(), baseSubPhrases[1]];
    } else {
      return baseSubPhrases;
    }
  },

  renderVariations: function() {
    ReactDOM.render(
      <VariationContainer phrase={this.props.phrase}/>,
      document.getElementById('variations')
    );
  },

  select: function() {
    phraseDispatcher.dispatch({
      actionType: 'phrase-select',
      selectedPhrase: (this.state.selected ? this.props.phrase.base : null)
    })
    this.renderVariations();
    this.setState({selected: !this.state.selected});
  },

  render: function() {
    return <p className={this.classes()} onClick={this.select}>{this.parsePhraseSegments().map(this.renderSubPhrase)}</p>;
  }
})

var Flashcard = React.createClass({
  render: function() {
    var renderPhrase = function(phrase, index) {
      return <Phrase key={phrase.id} phrase={phrase} isFirst={index == 0}/>;
    };

    return <div className="container">{this.props.phrases.map(renderPhrase)}</div>;
  }
})

ReactDOM.render(
  <Flashcard phrases={phrases}/>,
  document.getElementById('phrases')
);
