const feathers = require('feathers/client');
const rest = require('feathers-rest/client');
const $ = require("jquery");
const YTPlayer = require('yt-player');
const _ = require('lodash');
const assert = require('assert');
const moment = require('moment');
const util = require('util');
const restClient = rest();
const app = feathers().configure(restClient.jquery($));
const playlist = app.service('/playlist');
const db = app.service('/mongo');
const Experiment_type = $("#objectVersion").length ? 'object' : 'action';

//
const MAX_TRIALS = 13;
const throttleTime = 0.1; //in seconds
var waitSeconds = 120; //instruction waiting time (in seconds)
const debugMode = 0;
//
const div_width = 800;
const div_height = 570;
var videoCanvas = document.getElementById('videoCanvas');
videoCanvas.height = div_height;
videoCanvas.width = div_width;
const recHeight = 2/3*videoCanvas.height;
const recWidth = recHeight;
const topLeftX = (videoCanvas.width-recWidth)/2;
const topLeftY = (videoCanvas.height-recHeight)/2;
var mouseCentered = 0;
const crossLength = 50;
var mouse_posX;
var mouse_posY;
var mouse_time;
var valenceRating;
var arousalRating;
// const playlistId = Experiment_type === 'action' ? 'PLm09SE4GxfvWi5dKXkCoXdtJstAgvNHp3' : 'PLm09SE4GxfvUmhC1SU-AH7OKYfwMPrPsn';
const playlistId ='PLm09SE4GxfvX_w6Kian4mlNiA4JR2Qu8Q';
const practiceId = 'agfaUcSffms';
let trialStart = 0;// Trial start time
let trialEntries = [];
var randFeedback = 1;
var longestTimeStill = 0;
// var valence_direction = Math.round(Math.random()); //
var user = {
  info: {},
  trials: [],
  durations: [],
  trialVideos: [],
  survey:[],
  currentTrial: 0,
  canvasSize: null,
  experimentType: Experiment_type,
  longestTimeStill: [],
  valenceDirection: [],
};
let videoCtx;// Canvas context

$(document).ready(function() {
  preventNavigation();
  showPage(0);
  $('.totalNumber').text(MAX_TRIALS);
  registerHandlers();
  infoFormHandler();
  setupGridDimentional();
  getPlaylist(playlistId, {
    query: {
      maxResults: MAX_TRIALS,
    }
  }).then(message => {
    user.trialVideos.push({videoId:practiceId, title:'0_context'});
    Array.prototype.push.apply(user.trialVideos, message.results);
  });
});

// begin a trial
function beginTrial() {
  const currentTrial = user.currentTrial;
  $('#trialNumber').text(currentTrial + 1);
  $('.totalNumber').text(MAX_TRIALS);
  const videoId = _.get(user.trialVideos[currentTrial], 'videoId');
  const videoName = _.get(user.trialVideos[currentTrial], 'title');
  if (!videoId) {
    window.alert('Could not load video!');
    return;
  }
  var videoNum = videoName.match(/\d+/);
  // var videoNum = $(this).attr('id').split('_').pop();
  // console.log();
  $('#imageTrack').attr('src','img/Exp2_'+ videoNum + '_context.png')
  trialStart = Date.now(); //get start time of the trial
  showPage(4);
  setupGridDimentional();
  // console.log(videoId);
  player.load(videoId,0);
}

// submit a trial
function submitTrial(){
  user.trials.push(trialEntries);
  user.longestTimeStill.push(longestTimeStill);
  longestTimeStill = 0;
  user.durations.push((Date.now() - trialStart)/1000); // turn into miliseconds
  user.currentTrial += 1;
  // console.warn(user);
  updateEntry(user);
  trialEntries = [];
  $('#submitTrial').hide();
  $('#surveyForm')[0].reset();
  if (user.currentTrial === MAX_TRIALS) {
    showPage(6);
  } else {
    beginTrial();
  }
}


//handlers
function registerHandlers() {
  // $('#submitTrial').click(submitTrial);
  $('#beginTrial').click(beginTrial);
}

function infoFormHandler() {
  showJustEmail();
  $('#submitForm').click(checkEmail);
  $('#submitTrial').click(checkForm);
}


// set up player functions 
function getPlaylist(id, params) {
  return playlist.get(id, params).then(function(message) {
    console.log(message);
    return message;
  }).catch(function(err) {
    console.error(err);
    throw err;
  });
}

var player = new YTPlayer('#yt-player', {
  width: div_width,
  height: div_height,
  related: false,
  info: false,
  modestBranding: true,
  controls: false,
  autoplay: false,
});

// player.on('unstarted',function(){
  // $("#LoadingVideo").hide()
  // $("#VideoReady").show()
// });

player.on('ended',function(){
  showPage(5);
  $('#longestTimeStill').html(Math.round(longestTimeStill));
  randFeedback = Math.floor((Math.random() * 5) + 1);
  if ((longestTimeStill)>10){
    $('#badJob1').show();
    $('#badJob2').show();
  }else{
    $('#encourage'+randFeedback).show();
  }
});

// listen to enter key presses to start videos
document.addEventListener("keyup", function(e) {
  var ev = e || window.event; // window.event for IE fallback
  if(ev.keyCode === 13) {
    if(player.getState() === 'paused' || player.getState() === 'unstarted' || player.getState() === 'cued') {
      if (mouseCentered){
        player.play();
        $('#VideoReady').hide();
        $('#VideoStart').hide();
        $('#MovieInstruction').show();
      }
    } else if (player.getState() === 'playing') {
      player.pause();
      $('#VideoStart').show();
      $('#MovieInstruction').hide();
    }
  }  
  // //for skipping a video    
  if (debugMode){ 
    if (ev.keyCode === 27) {
      player.pause();
      showPage(5);
    }
  }
});

//saving mouse positions once the video starts playing
// throttler controls the interval the function 'mouseMoveHandler' gets 
// executed
function mouseMoveHandler(event) {
  var ev = event || window.event;
  var mouse_posX_save = ev.pageX;
  var mouse_posY_save = ev.pageY;
  var mouse_time_save = player.getCurrentTime();
  var canvasRect = videoCanvas.getBoundingClientRect();
  if (player.getState() === 'playing'){
    // convert to valence and arousal ratings from -1 to 1
    valenceRating = (mouse_posX_save - canvasRect.left - topLeftX - recWidth/2)*2/recWidth;
    arousalRating = (canvasRect.top + recHeight/2 + topLeftY - mouse_posY_save)*2/recHeight;
    
    var lastEntry = _.last(trialEntries);
    if (lastEntry) {
      var diff_time = (mouse_time_save -lastEntry.mouse_time_save);

      if (diff_time > longestTimeStill){
        longestTimeStill = diff_time;
      }  
    }
    
    trialEntries.push({valenceRating,arousalRating,mouse_time_save,mouse_posX_save,mouse_posY_save});
    // console.log(valenceRating + ' ' + arousalRating);
  } 
};
const throttledMouseHandler = _.throttle(mouseMoveHandler, throttleTime*1000);
document.addEventListener("mousemove", e => throttledMouseHandler(e)); 


// getting mouse positions all the time
document.addEventListener("mousemove", function(event){
  var ev = event || window.event;
  mouse_posX = ev.pageX;
  mouse_posY = ev.pageY;
  mouse_time = player.getCurrentTime();
  canvasRect = videoCanvas.getBoundingClientRect();

  // see if the mouse cursor is at the center 
  if (mouse_posX<(canvasRect.left+topLeftX+recWidth/2+crossLength/2) && 
    mouse_posX>(canvasRect.left+topLeftX+recWidth/2-crossLength/2) && 
    mouse_posY<(canvasRect.top+topLeftY+recWidth/2+crossLength/2) && 
    mouse_posY>(canvasRect.top+topLeftY+recWidth/2-crossLength/2)) {
    mouseCentered =1;
  }else{
    mouseCentered =0;
  }

  function drawMouseLines(){
    const pointerSize = 8;
    videoCtx = videoCanvas.getContext('2d');
    videoCtx.clearRect(0,0,videoCanvas.width, videoCanvas.height);
    $('#videoCanvas').show();
    // $('#gridCanvas').show();
    var canvasRect = videoCanvas.getBoundingClientRect();

    if (mouse_posX>=(topLeftX+canvasRect.left) && mouse_posX<=(canvasRect.left + topLeftX+recWidth) && 
      mouse_posY>=(canvasRect.top+topLeftY) && mouse_posY<=(canvasRect.top + topLeftY+recWidth)) {
        // drawing the vertical dashed line
        videoCtx.setLineDash([10, 10]);
        videoCtx.beginPath();
        videoCtx.moveTo(mouse_posX-canvasRect.left, topLeftY);
        videoCtx.lineTo(mouse_posX-canvasRect.left, topLeftY+recWidth);
        videoCtx.stroke();

        // drawing the horizontal dashed line
        videoCtx.setLineDash([10, 10]);
        videoCtx.beginPath();
        videoCtx.moveTo(topLeftX, mouse_posY -canvasRect.top);
        videoCtx.lineTo(topLeftX+ recWidth, mouse_posY-canvasRect.top);
        videoCtx.stroke();

        // drawing the mouse pointer
        videoCtx.fillStyle="#FF0000";
        videoCtx.fillRect(mouse_posX-canvasRect.left-pointerSize/2, mouse_posY-canvasRect.top-pointerSize/2, pointerSize, pointerSize);
        videoCtx.stroke();
      }else{
        videoCtx.font = "30px Arial";
        videoCtx.fillStyle = "red";
        videoCtx.textAlign="center"; 
        videoCtx.fillText("OUT OF BOUNDS",videoCanvas.width/2, videoCanvas.height/2-crossLength);
      }
  }
  drawMouseLines();
});

//draw the square shape grid
function setupGridDimentional() {
  var gridCanvas = document.getElementById("gridCanvas");
  gridCanvas.height = div_height;
  gridCanvas.width = div_width;
  user.canvasSize = [div_width, div_height];
  const tickLength=4;
  var gridCtx = gridCanvas.getContext('2d');
  gridCtx.strokeStyle = '#FF0000';
  // $('#gridCanvas').show();

  function drawGrid(){
    //drawing the rectangle outline
    gridCtx.lineWidth="1";
    gridCtx.strokeStyle="red";
    gridCtx.strokeRect(topLeftX, topLeftY, recWidth, recHeight);

    // drawing the center cross
    gridCtx.lineWidth="3";
    gridCtx.beginPath();
    gridCtx.moveTo(topLeftX+recWidth/2-crossLength/2, topLeftY+recHeight/2);
    gridCtx.lineTo(topLeftX+recWidth/2+crossLength/2, topLeftY+recHeight/2);
    gridCtx.stroke();
    gridCtx.beginPath();
    gridCtx.moveTo(topLeftX+recWidth/2, topLeftY+recHeight/2-crossLength/2);
    gridCtx.lineTo(topLeftX+recWidth/2, topLeftY+recHeight/2+crossLength/2);
    gridCtx.stroke();

    // dawing all the minor ticks on axis
    for (i=1;i<10;i++){ 
      gridCtx.beginPath();gridCtx.moveTo(topLeftX+i*recWidth/10, topLeftY);
      gridCtx.lineTo(topLeftX+i*recWidth/10, topLeftY+tickLength);gridCtx.stroke();

      gridCtx.beginPath();gridCtx.moveTo(topLeftX+i*recWidth/10, topLeftY+recHeight-tickLength);
      gridCtx.lineTo(topLeftX+i*recWidth/10, topLeftY+recHeight);gridCtx.stroke();

      gridCtx.beginPath();gridCtx.moveTo(topLeftX, topLeftY+i*recHeight/10);
      gridCtx.lineTo(topLeftX+tickLength, topLeftY+i*recHeight/10);gridCtx.stroke();

      gridCtx.beginPath();gridCtx.moveTo(topLeftX+recWidth-tickLength, topLeftY+i*recHeight/10);
      gridCtx.lineTo(topLeftX+recWidth, topLeftY+i*recHeight/10);gridCtx.stroke();
    }

    // drawing text on axis end
    gridCtx.font = "14pt Arial";
    gridCtx.fillStyle = "red";
    gridCtx.textAlign="center"; 
    padding_x = 5;
    padding_y = 10;
    gridCtx.fillText("High Arousal",gridCanvas.width/2,  gridCanvas.height/2-recHeight/2-padding_y);
    gridCtx.fillText("Low Arousal",gridCanvas.width/2,  gridCanvas.height/2+recHeight/2+2*padding_y);
    // if (valence_direction === 0) {
      gridCtx.textAlign="left"; 
      gridCtx.fillText("Positive",gridCanvas.width/2+recWidth/2+padding_x, gridCanvas.height/2+padding_x);
      gridCtx.textAlign="right"; 
      gridCtx.fillText("Negative",gridCanvas.width/2-recWidth/2-padding_x, gridCanvas.height/2+padding_x);
    // } else {
    //   gridCtx.textAlign="right"; 
    //   gridCtx.fillText("Positive",gridCanvas.width/2-recWidth/2-padding_x, gridCanvas.height/2+padding_x);
    //   gridCtx.textAlign="left"; 
    //   gridCtx.fillText("Negative",gridCanvas.width/2+recWidth/2+padding_x, gridCanvas.height/2+padding_x);
    // }
  }
  drawGrid();
}


// other functions
function createUser() {
  // Get all the forms elements and their values in one step
  var values = $("#infoForm").serializeArray();

  if (!user.trialVideos.length) {
    window.alert('Playlist could not be loaded');
    return;
  }

  var allPresent = [];
  _.each(values, function(val) {
    allPresent.push(val.value.length > 0);
    user.info[val.name] = val.value;
  });
  //check if all inputs are present
  allPresent = allPresent.every(function (e) {
    return e;
  });
  if (!allPresent) {
    alert('Please Fill in All Fields');
    return;
  }
  user._id = user.info.email;

  createEntry(user).then(message => {
    if (message) {
      // user.valenceDirection.push(valence_direction);
      showPage(3);
      var interval = setInterval(function() {
        if (!waitSeconds) {
          clearInterval(interval);
          $('#beginTrial').text('Begin the experiment');
        } else {
          $('#beginTrial').text(String(waitSeconds) + ' sec to begin');
          waitSeconds--;
        }
      }, 1000);
      setTimeout(function() {
        $('#beginTrial').prop('disabled', false);
      }, waitSeconds * 1000);
    }
  });
}

function checkForm() {
  // Get all the forms elements and their values in one step
  var values = $("#surveyForm").serializeArray();
  var allPresent = [];
  _.each(values, function(val) {
    allPresent.push(val.value.length > 0);
    user.info[val.name] = val.value;
  });
  //check if all inputs are present
  allPresent = allPresent.every(function (e) {
    return e;
  });
  if (!allPresent) {
    alert('Please Fill in All Fields');
    return;
  } else{
    user.survey.push(values);
    console.log(values);
    submitTrial();
  }
}


function checkEmail() {
  // Get all the forms elements and their values in one step
  var values = $("#infoForm").serializeArray();
  assert.strictEqual(values[0].name, 'email');
  var email = values[0].value;
  if (!email.match('.+@berkeley\.edu')) {
    // Email does not match berkeley template. Show some warning.
    window.alert('Invalid email. Please enter a berkeley.edu email.');
    return;
  }

  getEntry(email).catch(error => {
    // Email not found, better enter all info
    var alertStr = 'Email not found, please create a new profile.'
    window.alert(alertStr);
    showAllFields();
    $('#submitForm').off('click');
    $('#submitForm').click(createUser);
  }).then(message => {
    // Emails exists, continue?
    if (message) {
      var alertStr = 'Profile exists. Experiment will continue where you left off.'; 
      user = message;
      window.alert(alertStr)
      if (user.experimentType !== Experiment_type){
        if (user.experimentType === 'action'){
          window.alert('You are using the wrong website link. Please go to https://berkeley-video-annotation.herokuapp.com/');
        } else {
          window.alert('You are using the wrong website link. Please go to https://berkeley-video-annotation.herokuapp.com/object.html');
        }
        return;
      }
      showPage(3);
      $('#beginTrial').prop('disabled', false);
    }
  });
}

function getEntry(id) {
  return db.get(id).then(function(message) {
    console.log(message);
    return message;
  }).catch(function(err) {
    console.error(err);
    throw err;
  });
}

function updateEntry(entry) {
  return db.update(entry._id, entry)
    .then(function(message) {
      console.log(message);
      return message;
    })
    .catch(function(err) {
      console.error(err);
      throw err;
    });
}

function createEntry(entry) {
  return db.create(entry)
    .then(function(message) {
      console.log(message);
      return message;
    })
    .catch(function(err) {
      console.error(err);
      throw err;
    });
}

function showPage(pageNumber) {
  const pages = $('.page');
  _.forEach(pages, (p, index) => {
    if (index === pageNumber) {
      $(p).show();
    } else {
      $(p).hide();
    }
  });
}

function formatPlayerTime(timestamp) {
  var minute = Math.floor(timestamp / 60);
  var seconds = Math.floor(timestamp % 60);
  var milliseconds = (timestamp % 1) * 1000;
  return moment().startOf('day')
          .minutes(minute)
          .seconds(seconds)
          .milliseconds(milliseconds)
          .format('mm:ss.SSS');
}

function getPlayerTime(element) {
  var timestamp = player.getCurrentTime();
  timestamp = formatPlayerTime(timestamp);
  element.val(timestamp);
}

function disableStart(shouldDisable) {
  $('#agreeAndStart').prop('disabled', shouldDisable);
}

function showJustEmail() {
  $('#infoForm .formField#email').siblings().hide();
  $('#formText').hide();
}

function showAllFields() {
  $('#infoForm .formField').show();
  $('#formText').show();
}

function preventNavigation() {
  // Enable navigation prompt
  window.onbeforeunload = function() {
      return true;
  };
}

function findAll() {
  db.find().then(data => console.log(data));
}

module.exports = {
  disableStart: disableStart,
  showPage: showPage,
  createEntry: createEntry,
  findAll: findAll,
  $: $,
  getPlayerTime: getPlayerTime,
  trialEntries: trialEntries,
  user: user,
  player: player,
  Experiment_type: Experiment_type,
}