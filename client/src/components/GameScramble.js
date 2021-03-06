import React from 'react';
import { data }  from './Data.js';
import { Timer } from './Timer.js';
import { Score } from './Score.js';
import $ from 'jquery';
import {X_MASHAPE_KEY} from '../config.js';


const NUM_WORDS = 5;

export default class GameScramble extends React.Component {
  constructor(props) {
    super(props);
    this.gametype = 'scramble';
    this.wordData = [];
    this.state = {
      userInput: '',
      position: 1,
      word: data[0],
      definition: null,
      shuffled: null,
      score: 0,
      timeLeft: 45
    };
    //This for loop is for creating the wordData array which holds the words returned from the wordsapi
    var context = this;
    for (var i = 0; i < NUM_WORDS; i++) {
      this.getWord( function(word) {
        context.wordData.push(word);
      });
    }
  }

  //Makes a get request from the wordsapi and returns a random word and a definition
  getWord(callback) {
    var word = {};
    var context = this;
    var THE_X_MASHAPE_KEY = process.env.X_MASHAPE_KEY || X_MASHAPE_KEY;
    $.ajax({
      type: 'GET',
      url: 'https://wordsapiv1.p.mashape.com/words/?random=true',
      headers: {
        'X-Mashape-Key': THE_X_MASHAPE_KEY,
        Accept: 'application/json'
      },
      contentType: 'application/json',
      success: function(data) {
        //sometimes API returns result without definition, handle that
        if (!data.results) {
          console.log('word without definiton! try again');
          context.getWord(callback);
        } else {
          word.word = data.word.toUpperCase();
          word.definition = data.results[0].definition;
          callback(word);
        }
      }
    });
  }


  //This method shuffles the string passed in
  shuffle(string) {
    var characters = string.split('');
    var length = characters.length;
    for (var i = length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = characters[i];
      characters[i] = characters[j];
      characters[j] = temp;
    }
    var result = characters.join('');
    if (result === string) {
      result = this.shuffle(string);
    }
    return result;
  }


  //This method changes this.state.word
  changeWord(context) {
    if (context.wordData.length > 0) {
      var thisWord = context.wordData[0].word;
      console.log(thisWord);
      this.setState({
        word: thisWord,
        definition: context.wordData[0].definition
      });
      context.wordData.shift();
    } else {
      var thisWord = data[this.state.position];
      this.setState({position: this.state.position + 1});
      this.setState({word: thisWord});
      this.setState({definition: ''});
    }
    this.setState({shuffled: this.shuffle(thisWord)});
  }


  //This method changes the state based on the text input
  changeInput(text) {
    var context = this;
    //console.log('the word in change input is ', this.state.word);
    this.setState({userInput: text.target.value});
    if (text.target.value.toUpperCase() === this.state.word) {
      this.changeWord(context);
      this.setState({userInput: ''});
      this.setState({score: this.state.score + 1});
      text.target.value = '';
    }
  }


  //This method skips the word and changes the word to the next
  skipWord() {
    this.setState({score: this.state.score - 1});
    this.changeWord(this);
  }


  //This method decrements the timer by 1 second
  decrementTimer() {
    this.setState({timeLeft: this.state.timeLeft - 1});
    if (this.state.timeLeft <= 0) {
      clearInterval(this.interval);
      this.saveScore();
    }
  }


  //When component mounts, the timer starts and the state word will be shuffled
  componentDidMount() {
    this.interval = setInterval(this.decrementTimer.bind(this), 1000);
    this.setState({shuffled: this.shuffle(this.state.word)});
  }

  //On dismount, the timer will stop.
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  //After the game is ended, this method makes an AJAX post request to the server
  saveScore() {
    //post the score to the backend if user is logged in
    if (localStorage.username) {
      console.log('scramble game username', localStorage.username);
      var obj = {
        username: localStorage.username,
        gametype: this.gametype,
        score: this.state.score
      };
      $.ajax({
        type: 'POST',
        url: '/scores',
        data: JSON.stringify(obj),
        contentType: 'application/json',
        success: function(data) {
          console.log('Data posted to server', data);
        }
      });
    }
  }

  render() {
    return (
      <div>
        <Timer time={this.state.timeLeft} />
        <h1> {this.state.shuffled} </h1>
        <h4> {this.state.definition} </h4>
        <input type="text" placeholder="Enter Word" onChange={this.changeInput.bind(this)}/>
        <button className="btn btn-default skipButton" onClick={this.skipWord.bind(this)}>Skip</button>
        <Score score={this.state.score}/>
      </div>
    );
  }
}
