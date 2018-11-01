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

// 0 is scene rating project; 1 is emotion category project
const Project_version = 'continuous';  // ‘scene or category or control or retest’
const experimentTime = 60;


//1: scene
//0: person
//2: baseline
//3: characterOnly
// const sceneOrPerson = 0;
// const Experiment_type = sceneOrPerson === 1 ? 'scene':'person';
// const sceneOrPerson = Math.round(Math.random()*1); // randome number of 0 or 1
const sceneOrPerson = Math.floor(Math.random()*3); ;
const Experiment_type = sceneOrPerson === 0 ? 'baselineContinuous' : sceneOrPerson === 1 ? 'contextOnlyContinuous' : 'characterOnlyContinuous';



// 0: baseline
// 2: contextOnly
// 1: characterOnly
// const personOrContext = Math.round(Math.random()*1); // randome number of 0 or 1 or 2
const personOrContext = 2;
const Condition_type = personOrContext === 0 ? 'baseline' : personOrContext === 1 ? 'contextOnly' : 'characterOnly';


const valence_direction = Math.round(Math.random()); 
// const valence_direction = 1; //positive on the left and negative on the right
// const valence_direction = 1; //positive on the right and negative on the left

var PRACTICE_TRIAL;
var MAX_TRIALS;

if (Project_version === 'control'){
  PRACTICE_TRIAL = 2;
}
else{
  PRACTICE_TRIAL = 1;
}

if (Project_version === 'control'){
  MAX_TRIALS = 19;
}else{
  MAX_TRIALS = 24;
}

const throttleTime = 0.2; //in seconds
var waitSeconds = 300; //instruction waiting time (in seconds)
const debugMode = 0;
const TimeStillLimit = 20;

// instructions
// URL
const sceneURL0 = 'https://docs.google.com/document/d/e/2PACX-1vRolz-hraYuU8ETW1ppMi9wmHUTNmks-fsViG0MNNf6XyD6_Ic5m5tBHLkFzafzVgGuoOxoCf-xibxl/pub?embedded=true';
const personURL0 = 'https://docs.google.com/document/d/e/2PACX-1vRnbe3dDQnNJk0_FBl16QTGf9rhlKZNBy5BI61yTNmXBuFXav6z_L7S09Q-XI-khVx5V8P6As9HuMby/pub?embedded=true';
const sceneURL1 = 'https://docs.google.com/document/d/e/2PACX-1vSQCOWig6ICKx_F_mUIgijyNIKPF6AvNa-Q8fpV0oHMYbh47-CROeqa4iScn0dcdJ3YWrTsRE7k1fra/pub?embedded=true';
const personURL1 = 'https://docs.google.com/document/d/e/2PACX-1vQobREqq_tNT2TF4xh2vQZcqx46rueEprab5CyXa4idZ86FClislJvcHjlMtwqFO6kpnsOdPh4TbXZl/pub?embedded=true';
const baselineURL = 'https://docs.google.com/document/d/e/2PACX-1vRnshbH70Bi6Qo6lTXyY2Pg9lRhCN2riEYOLPJWgtakQ1Yk5xPJAIRlcYeBs-uZX1qv7hKtK-ajWN3w/pub?embedded=true';
const characterOnlyURL = 'https://docs.google.com/document/d/e/2PACX-1vRD2uhwCgQG_lu7SyiqcshVNfoAj1dF0f5ph_y62yUJpnc3-eolRyPHNHL9BSgA9UldPSoI4-QJBBZ-/pub?embedded=true';
const contextOnlyURL = 'https://docs.google.com/document/d/e/2PACX-1vS6_UDxx8uQWj6RguU11rlKMoPRzoHJ8LO9yON2PEWjbDHgMeCjcsY9LfNCNXC0_CvtcObR5sYMerZZ/pub?embedded=true';
const controlURL0 = 'https://docs.google.com/document/d/e/2PACX-1vTdzE2-LOyjEyOZZf89hq5iLhkOrrwdwE16Z8ikB818eUCKv-0F9N6GDOxPJXpMoRPfSaWMeewpXU0E/pub?embedded=true';
const controlURL1 = 'https://docs.google.com/document/d/e/2PACX-1vQQAOiuOACfwSlQgifFL385jW439z-XwOwJCN0n6xDPo3G4DSIyb9Ua3ZnlZAD1XOmyxMtFP28idAQ4/pub?embedded=true';
const baselineContinuousURL0 = 'https://docs.google.com/document/d/e/2PACX-1vSUmp4-swAryAgOwKHcsK7IvVjW5BCFfkAHQFnXSVTY5-9taGo1_k5RnS3_Zqqb4sHsko62QRDQ7yCW/pub?embedded=true';
const baselineContinuousURL1 = 'https://docs.google.com/document/d/e/2PACX-1vThKYBU0giYqQ1fqEcFw7nS_yiDDiuH3HKHTqqgoX8MbkD6c3XLgnwUET6We_skpBQLDCwEvaMwgDv7/pub?embedded=true';
const characterOnlyContinuousURL0 = 'https://docs.google.com/document/d/e/2PACX-1vRHFOuRwliaCW6YLSs1agY5XVJfuAns6Zq8D5XHKtcM1mLLOw5H15KW1AY08OG-Xv24Xwt_nxBuaf78/pub?embedded=true';
const characterOnlyContinuousURL1 = 'https://docs.google.com/document/d/e/2PACX-1vS8tMN6oEkQA8g5RtueuFiLBVqiQNHP21OcKMo1CVZoERpvvN0VXvOtAq3I1SmksNPczcBV11WCKxxu/pub?embedded=true';

//Href
const sceneHref0 = 'https://docs.google.com/document/d/1TlWZGEolJQQ-LqZJb_NXOk9dydJAtDSH_zAvKMSVtRI/edit?usp=sharing';
const personHref0 = 'https://docs.google.com/document/d/1B86DZ3aon9Cw7EH6wOEYoz339kHx9f6iLfaHyHofWfo/edit?usp=sharing';
const sceneHref1 = 'https://docs.google.com/document/d/1XykrTl18kxoyeSpqrEd-d08NTosX_0LFH7EweCaVp4A/edit?usp=sharing';
const personHref1 = 'https://docs.google.com/document/d/1500qSCqhNq-up9TlUEj58SJXPZOHQfRWkphzgs1yTKI/edit?usp=sharing';
const baselineHref = 'https://docs.google.com/document/d/1HU3S1jOpjVhsqmBWFsUNFJOJabGbyQ4cOLehlOzYilM/edit?usp=sharing';
const characterOnlyHref = 'https://docs.google.com/document/d/1wIcl7PBkUP6fwXAhkeE3-w6FzCxysbib6F5F1KNSbOw/edit?usp=sharing';
const contextOnlyHref = 'https://docs.google.com/document/d/1yz1T0TjR86pT23g00mO_jwyvYGEIP93zGPCopnxorV4/edit?usp=sharing';
const controlHref0 = 'https://docs.google.com/document/d/1qGA6b47xS6C0ZO9skOz84bSyYC5vU5JUXKuqE1Ja9Mk/edit?usp=sharing'
const controlHref1 = 'https://docs.google.com/document/d/1mLogjwTwn9Rzix9RSkVlYUTTX9gVT9C3tim1t0B3SrY/edit?usp=sharing'
const baselineContinuousHref0 = 'https://docs.google.com/document/d/16Pth2PquuHpKKdsaBUtWOoP7qVf5llWVGjUK5xNZbGs/edit?usp=sharing';
const baselineContinuousHref1 = 'https://docs.google.com/document/d/1xsmIHw-FkXvIhOYUQ0uFJVXHsjDk3qCWpo-M2DRw0iE/edit?usp=sharing';
const characterOnlyContinuousHref0 = 'https://docs.google.com/document/d/17O77cAPCcTlBO6GThWvmfPPScZTD8bOIiiZpxIdjwZg/edit?usp=sharing';
const characterOnlyContinuousHref1 = 'https://docs.google.com/document/d/10yWdorBe7NgjmKKgSo-vwJWP-9i0gDYlSewy1fJ0RIw/edit?usp=sharing';

// playlist
const playlistContextOnly = 'PLm09SE4GxfvWj9uQn8NiouW4uRHZ0ToJs'; //'PLm09SE4GxfvX_w6Kian4mlNiA4JR2Qu8Q';
const playlistCharacterOnly = 'PLm09SE4GxfvXkeBNyd6HG_LxvN3mSgCpZ'; //'PLm09SE4GxfvX-pjLLzaLpgyOa57AL4fcI';
const playlistBaseline = 'PLm09SE4GxfvXs_DtUWZKeHPYg1_rPUE-y';
const playlistControl = 'PLm09SE4GxfvX--LAJf6-d1j64JP_n90GN';
const playlistControlFull = 'PLm09SE4GxfvVKETEW1kZgMCpVhPotv_lY';
const practiceContextOnly = 'agfaUcSffms'; //nGRc-cD6tTw
const practiceBaseline = 'oBhS-2-utr4';
const practiceCharacterOnly = 'fQG-vbx_V-g';
const practiceControl = 'ZBJs6_6Z2z4'

var playlistId;
var playlistId2;
var practiceId;
var practiceId2;
var instructionURL;
var instructionHref;
var continuousOrCategory;

const wedgesAngle = [-30,-90,-150,30,90,150];
const categoriesAngle = [0,-60,-120,180,120,60];
const div_width = 800;
const div_height = 570;
var videoCanvas = document.getElementById('videoCanvas');
videoCanvas.height = div_height;
videoCanvas.width = div_width;
const recHeight = 2/3*videoCanvas.height;
const categoryRadius = recHeight/2*2/3;
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
var emotionLabel;
var emotionStrength;

let trialStart = 0;// Trial start time
let trialEntries = [];
var randFeedback = 1;
var longestTimeStill = 0;
// if 0 then negative on the right and positive on the left
// if 1 then negative on the left and positive on the right


function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

const categoryOrder = shuffle([0,1,2,3,4,5]); //emotion category labels
const categoryLabels = ['Anger','Disgust','Fear','Happiness','Sadness','Surprise'];
// console.log(categoryOrder[1]);
// console.log(user.categoryLabels[categoryOrder[0]]);

determineCondition();
var user = {
  info: {},
  trials: [],
  durations: [],
  trialVideos: [],
  survey:[],
  currentTrial: 0,
  canvasSize: null,
  experimentType: Experiment_type,
  conditionType: Condition_type,
  projectVersion: Project_version,
  longestTimeStill: [],
  valenceDirection: valence_direction,
  continuousOrCategory:continuousOrCategory,
  playlistId:playlistId,
  playlistId2:playlistId2,
  practiceId:practiceId,
  practiceId2:practiceId2,
  instructionURL:instructionURL,
  instructionHref:instructionHref,
  categoryOrder: categoryOrder,
  categoryLabels:categoryLabels,
  wedgesAngle:wedgesAngle,
  categoriesAngle:categoriesAngle,
};
let videoCtx;// Canvas context

$(document).ready(function() {
  preventNavigation();
  showPage(0);
  $('.totalNumber').text(MAX_TRIALS);
  $('.totalTime').text(experimentTime);
  registerHandlers();
  infoFormHandler();
  setupGridDimentional();
  if (valence_direction == 0){
    $('#emotionSpaceImage').attr('src','img/Valence_arousal_2.jpg');
  }
  else{
    $('#emotionSpaceImage').attr('src','img/Valence_arousal_1.jpg');
  }
});

function determineCondition(){
  if (Project_version === 'scene'){
    continuousOrCategory = 0;
    if (Experiment_type === 'scene'){
      playlistId =  playlistContextOnly;
      practiceId = practiceContextOnly;
      if (valence_direction == 0){
        instructionURL = sceneURL0;
        instructionHref = sceneHref0;
      }else{
        instructionURL = sceneURL1;
        instructionHref = sceneHref1;
      }
    } else if (Experiment_type === 'person') {
      playlistId =  playlistContextOnly;
      practiceId = practiceContextOnly;
      if (valence_direction == 0){
        instructionURL = personURL0;
        instructionHref = personHref0;
      }else{
        instructionURL = personURL1;
        instructionHref = personHref1;
      }
    }else if (Experiment_type === 'baselineContinuous') {
      playlistId =  playlistBaseline;
      practiceId = practiceBaseline;
      if (valence_direction == 0){
        instructionURL = baselineContinuousURL0;
        instructionHref = baselineContinuousHref0;
      }else{
        instructionURL = baselineContinuousURL1;
        instructionHref = baselineContinuousHref1;
      }
    }else if (Experiment_type === 'characterOnlyContinuous') {
      playlistId =  playlistCharacterOnly;
      practiceId = practiceCharacterOnly;
      if (valence_direction == 0){
        instructionURL = characterOnlyContinuousURL0;
        instructionHref = characterOnlyContinuousHref0;
      }else{
        instructionURL = characterOnlyContinuousURL1;
        instructionHref = characterOnlyContinuousHref1;
      }
    }
  }else if (Project_version == 'category'){
    continuousOrCategory = 1;
    if (Condition_type === 'baseline'){
      playlistId =  playlistBaseline;
      practiceId = practiceBaseline;
      instructionURL = baselineURL;
      instructionHref = baselineHref;
    }else if (Condition_type === 'contextOnly'){
      playlistId =  playlistContextOnly;
      practiceId = practiceContextOnly;
      instructionURL = contextOnlyURL;
      instructionHref = contextOnlyHref;
    }else if (Condition_type === 'characterOnly'){
      playlistId =  playlistCharacterOnly;
      practiceId = practiceCharacterOnly;
      instructionURL = characterOnlyURL;
      instructionHref = characterOnlyHref;
    }
  }else if (Project_version == 'control'){
    continuousOrCategory = 0;
    playlistId =  playlistControl;
    playlistId2 =  playlistControlFull;
    practiceId = practiceControl;
    practiceId2 = practiceContextOnly
    if (valence_direction == 0){
      instructionURL = controlURL0;
      instructionHref = controlHref0;
    }else{
      instructionURL = controlURL1;
      instructionHref = controlHref1;
    }
  }else if (Project_version == 'retest'){
    continuousOrCategory = 0;
    playlistId =  playlistContextOnly;
    practiceId = practiceContextOnly;
    if (valence_direction == 0){
      instructionURL = sceneURL0;
      instructionHref = sceneHref0;
    }else{
      instructionURL = sceneURL1;
      instructionHref = sceneHref1;
    }
  }else if (Project_version == 'continuous'){
    continuousOrCategory = 0;
    if (Experiment_type === 'contextOnlyContinuous'){
      playlistId =  playlistContextOnly;
      practiceId = practiceContextOnly;
      if (valence_direction == 0){
        instructionURL = personURL0;
        instructionHref = personHref0;
      }else{
        instructionURL = personURL1;
        instructionHref = personHref1;
      }
    }else if (Experiment_type === 'baselineContinuous') {
      playlistId =  playlistBaseline;
      practiceId = practiceBaseline;
      if (valence_direction == 0){
        instructionURL = baselineContinuousURL0;
        instructionHref = baselineContinuousHref0;
      }else{
        instructionURL = baselineContinuousURL1;
        instructionHref = baselineContinuousHref1;
      }
    }else if (Experiment_type === 'characterOnlyContinuous') {
      playlistId =  playlistCharacterOnly;
      practiceId = practiceCharacterOnly;
      if (valence_direction == 0){
        instructionURL = characterOnlyContinuousURL0;
        instructionHref = characterOnlyContinuousHref0;
      }else{
        instructionURL = characterOnlyContinuousURL1;
        instructionHref = characterOnlyContinuousHref1;
      }
    }
  }
}

// begin a trial
function beginTrial() {
  const currentTrial = user.currentTrial;
  $('#trialNumber').text(currentTrial + 1);
  $('.totalTime').text(experimentTime);
  const videoId = _.get(user.trialVideos[currentTrial], 'videoId');
  const videoName = _.get(user.trialVideos[currentTrial], 'title');
  if (!videoId) {
    window.alert('Could not load video!');
    return;
  }
  var videoNum = videoName.slice(0,3);//videoName.match(/\d+/);
  var regex_occlusion = RegExp('occlusion');
  var regex_control = RegExp('control');

  // var videoNum = $(this).attr('id').split('_').pop();
  if (user.projectVersion === 'scene'){
    if (user.experimentType === 'scene' || user.experimentType === 'person'){
      $('#imageTrack').attr('src','img/Exp2_'+ videoNum + '_context.png');
    }else{
      $('#imageTrack').attr('src','img/Exp2_'+ videoNum + '_baseline.png'); 
    }
  }else if (user.projectVersion === 'category'){
    if (user.conditionType === 'contextOnly'){
      $('#imageTrack').attr('src','img/Exp2_'+ videoNum + '_context.png'); 
    }else{
      $('#imageTrack').attr('src','img/Exp2_'+ videoNum + '_baseline.png'); 
    }
  } else if (user.projectVersion === 'control'){

    $('#imageTrack').attr('src','img/Exp2_'+ videoNum + '_context.png');

  } else if (user.projectVersion === 'continuous'){

    if (user.experimentType === 'contextOnlyContinuous'){
      $('#imageTrack').attr('src','img/'+ videoNum + '_blurred.png'); 
    }else{
      $('#imageTrack').attr('src','img/'+ videoNum + '.png'); 
    }

  }
  trialStart = Date.now(); //get start time of the trial
  showPage(4);
  if (user.projectVersion === 'scene' || user.projectVersion === 'continuous'){
    $('#VideoReady').show();
    $('#MovieInstruction').show();
    if (user.experimentType === 'scene'){
      $('#InstructionPerson').hide();
      $('#InstructionBaseline').hide();
      $('#InstructionCharacterOnly').hide();
      $('#InstructionScene').show();
      $('#imageTrack').hide();
    }else if (user.experimentType === 'person' || user.experimentType === 'contextOnlyContinuous'){
      $('#InstructionPerson').show();
      $('#InstructionBaseline').hide();
      $('#InstructionCharacterOnly').hide();
      $('#InstructionScene').hide();
      $('#imageTrack').show();
    }else if (user.experimentType === 'baselineContinuous'){
      $('#InstructionPerson').hide();
      $('#InstructionBaseline').show();
      $('#InstructionCharacterOnly').hide();
      $('#InstructionScene').hide();
      $('#imageTrack').show();
    }else if (user.experimentType === 'characterOnlyContinuous'){
      $('#InstructionPerson').hide();
      $('#InstructionBaseline').hide();
      $('#InstructionCharacterOnly').show();
      $('#InstructionScene').hide();
      $('#imageTrack').show();
    }
    $('#InstructionControl').hide();
    $('#characterInvisible').show();
  }else if (user.projectVersion === 'category'){
    if (user.conditionType === 'baseline'){
      $('#InstructionPerson').hide();
      $('#InstructionBaseline').show();
      $('#InstructionCharacterOnly').hide();
    }else if (user.conditionType === 'contextOnly'){
      $('#InstructionPerson').show();
      $('#InstructionBaseline').hide();
      $('#InstructionCharacterOnly').hide();
    }else if (user.conditionType === 'characterOnly'){
      $('#InstructionPerson').hide();
      $('#InstructionBaseline').hide();
      $('#InstructionCharacterOnly').show();
    }
    $('#InstructionControl').hide();
    $('#InstructionScene').hide();
    $('#imageTrack').show();
    $('#characterInvisible').show();
  }else if(user.projectVersion === 'control'){
    if (regex_occlusion.test(videoName)){
      $('#InstructionPerson').show();
      $('#InstructionControl').hide();
      $('#characterInvisible').show();
    }else if (regex_control.test(videoName)){
      $('#InstructionPerson').hide();
      $('#InstructionControl').show();
      $('#characterInvisible').hide();
    }
    $('#InstructionBaseline').hide();
    $('#InstructionCharacterOnly').hide();
    $('#InstructionScene').hide();
    $('#imageTrack').show();
  }else if(user.projectVersion === 'control'){
    $('#InstructionPerson').show();
    $('#InstructionBaseline').hide();
    $('#InstructionCharacterOnly').hide();
    $('#InstructionControl').hide();
    $('#InstructionScene').hide();
    $('#imageTrack').show();
    $('#characterInvisible').show();
  }
  setupGridDimentional();
  player.load(videoId,0);
}

// submit a trial
function submitTrial(){
  user.trials.push(trialEntries);
  user.longestTimeStill.push(longestTimeStill);
  longestTimeStill = 0;
  user.durations.push((Date.now() - trialStart)/1000); // turn into miliseconds
  user.currentTrial += 1;
  console.warn(user);
  updateEntry(user);
  trialEntries = [];
  $('#surveyForm')[0].reset();
  if (user.currentTrial === MAX_TRIALS) {
    showPage(7);
  } else {
    showPage(6);
  }
}


//handlers
function registerHandlers() {
  // $('#submitTrial').click(submitTrial);
  $('#beginTrial').click(beginTrial);
  $('#startTrial').click(beginTrial);
}

function infoFormHandler() {
  showJustEmail();
  $('#submitForm').click(checkEmail);
  $('#submitTrial').click(checkForm);
}

function combinePlaylist(id_1, id_2, params, numResults){
  return Promise.all([getPlaylist(id_1, params),getPlaylist(id_2, params)])
    .then(function(values) {
      shuffledIndex = _.shuffle(_.range(numResults));
      console.warn(shuffledIndex);
      var middleIndex = Math.floor(numResults / 2);
      console.warn(middleIndex);
      var firstSlice = shuffledIndex.slice(0, middleIndex);
      var secondSlice = shuffledIndex.slice(middleIndex, shuffledIndex.length)
      console.warn(firstSlice);
      console.warn(secondSlice);

      var selected_1 = _.at(values[0].results, firstSlice);
      var selected_2 = _.at(values[1].results, secondSlice);
      const combined = _.shuffle(selected_1.concat(selected_2));
      return {id: values[0].id + values[1].id, results: combined};
  });
}
// set up player functions 
function getPlaylist(id, params) {
  return playlist.get(id, params).then(function(message) {
    message.results = _.shuffle(message.results);
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
  $('#encourage1').hide();
  $('#encourage2').hide();
  $('#encourage3').hide();
  $('#encourage4').hide();
  $('#encourage5').hide();
  $('#badJob1').hide();
  $('#badJob2').hide();
  if ((longestTimeStill)>TimeStillLimit){
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
  // record mouse movements
  if (player.getState() === 'playing'){
    // convert to valence and arousal ratings from -1 to 1
    if (user.continuousOrCategory === 0){
      arousalRating = (canvasRect.top + recHeight/2 + topLeftY - mouse_posY_save)*2/recHeight;
      if (user.valenceDirection === 0){
        valenceRating = (mouse_posX_save - canvasRect.left - topLeftX - recWidth/2)*2/recWidth;
      }else{
        valenceRating = (canvasRect.left + topLeftX + recWidth/2 - mouse_posX_save)*2/recWidth;
      }
    }else if (user.continuousOrCategory === 1){
      var distanceFromCenterX = mouse_posX_save - canvasRect.left - videoCanvas.width/2;
      var distanceFromCenterY = mouse_posY_save - canvasRect.top - videoCanvas.height/2;
      var distanceFromCenter = Math.pow(Math.pow(distanceFromCenterX,2) + Math.pow(distanceFromCenterY,2),0.5);
      emotionStrength = distanceFromCenter/recHeight*2;
      var angleFromZero = Math.acos(distanceFromCenterX/distanceFromCenter)*180/Math.PI;
      if (distanceFromCenterY <=0){
        if (angleFromZero<= 30){
          emotionLabel = user.categoryLabels[user.categoryOrder[0]];
        }else if (angleFromZero>30 && angleFromZero<= 90){
          emotionLabel = user.categoryLabels[user.categoryOrder[1]];
        }else if (angleFromZero>90 && angleFromZero<= 150){
          emotionLabel = user.categoryLabels[user.categoryOrder[2]];
        }else if (angleFromZero>150 && angleFromZero<= 180){
          emotionLabel = user.categoryLabels[user.categoryOrder[3]];
        }
      }else{
        if (angleFromZero<= 30){
          emotionLabel = user.categoryLabels[user.categoryOrder[0]];
        }else if (angleFromZero>30 && angleFromZero<= 90){
          emotionLabel = user.categoryLabels[user.categoryOrder[5]];
        }else if (angleFromZero>90 && angleFromZero<= 150){
          emotionLabel = user.categoryLabels[user.categoryOrder[4]];
        }else if (angleFromZero>150 && angleFromZero<= 180){
          emotionLabel = user.categoryLabels[user.categoryOrder[3]];
        }
      }
    }
    var lastEntry = _.last(trialEntries);
    if (lastEntry) {
      var diff_time = (mouse_time_save -lastEntry.mouse_time_save);
      if (diff_time > longestTimeStill){
        longestTimeStill = diff_time;
      }  
    }
    mouse_time_save = Math.round(mouse_time_save*100)/100;
    if (user.continuousOrCategory === 0){
      valenceRating = Math.round(valenceRating*1000)/1000;
      arousalRating = Math.round(arousalRating*1000)/1000;
      trialEntries.push({valenceRating,arousalRating,mouse_time_save,mouse_posX_save,mouse_posY_save});
      // console.log(valenceRating + ' ' + arousalRating);
    }else if (user.continuousOrCategory === 1){
      emotionStrength = Math.round(emotionStrength*1000)/1000;
      trialEntries.push({emotionLabel,emotionStrength,mouse_time_save,mouse_posX_save,mouse_posY_save});
    }
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

  const pointerSize = 8;
  videoCtx = videoCanvas.getContext('2d');
  videoCtx.clearRect(0,0,videoCanvas.width, videoCanvas.height);
  $('#videoCanvas').show();
  var canvasRect = videoCanvas.getBoundingClientRect();
  videoCtx.font = "12pt Arial";
  videoCtx.fillStyle = "red";
  videoCtx.textAlign="center";
  const shift_y_1 = -45;
  const shift_y_2 = -25;
  if (user.continuousOrCategory === 0){
    drawMouseLinesGrid();
  }else if (user.continuousOrCategory === 1){
    drawMouseLinesCircle();
  }

  function drawMouseLinesCircle(){
    var distanceFromCenterX = mouse_posX - canvasRect.left - videoCanvas.width/2;
    var distanceFromCenterY = mouse_posY - canvasRect.top - videoCanvas.height/2;
    var sum_temp = Math.pow(distanceFromCenterX,2) + Math.pow(distanceFromCenterY,2);
    if (sum_temp < Math.pow(recWidth/2,2)){
      // drawing the mouse pointer
      videoCtx.fillStyle="#FF0000";
      videoCtx.fillRect(mouse_posX-canvasRect.left-pointerSize/2, mouse_posY-canvasRect.top-pointerSize/2, pointerSize, pointerSize);
      videoCtx.stroke();

      // drawing the horizontal dashed line
      videoCtx.strokeStyle="black";
      videoCtx.setLineDash([10, 10]);
      videoCtx.beginPath();
      videoCtx.moveTo(topLeftX+recWidth/2, topLeftY+recHeight/2);//moveTo(topLeftX, mouse_posY -canvasRect.top);
      videoCtx.lineTo(mouse_posX-canvasRect.left, mouse_posY-canvasRect.top);
      videoCtx.stroke();

      if (emotionStrength){
        videoCtx.fillText('Emotion category: ' + emotionLabel, topLeftX+recWidth/2, topLeftY + shift_y_1);
        videoCtx.fillText('Emotion strength: ' + String(Math.round(emotionStrength*100)) + '%', topLeftX+recWidth/2, topLeftY + shift_y_2);
      }

    }else{
      videoCtx.font = "30px Arial";
      videoCtx.fillStyle = "red";
      videoCtx.textAlign="center"; 
      videoCtx.fillText("OUT OF BOUNDS",videoCanvas.width/2, videoCanvas.height/2-crossLength);
    }

  }

  function drawMouseLinesGrid(){
    // $('#gridCanvas').show();
    if (mouse_posX>=(topLeftX+canvasRect.left) && mouse_posX<=(canvasRect.left + topLeftX+recWidth) && 
      mouse_posY>=(canvasRect.top+topLeftY) && mouse_posY<=(canvasRect.top + topLeftY+recWidth)) {
        // drawing the vertical dashed line
        videoCtx.setLineDash([10, 10]);
        videoCtx.beginPath();
        videoCtx.moveTo(mouse_posX-canvasRect.left, topLeftY);
        videoCtx.lineTo(mouse_posX-canvasRect.left, topLeftY+recWidth);
        videoCtx.stroke();

        // drawing dashed line
        videoCtx.strokeStyle="black";
        videoCtx.setLineDash([10, 10]);
        videoCtx.beginPath();
        videoCtx.moveTo(topLeftX, mouse_posY -canvasRect.top);
        videoCtx.lineTo(topLeftX+recWidth, mouse_posY-canvasRect.top);
        videoCtx.stroke();

        // drawing the mouse pointer
        videoCtx.fillStyle="#FF0000";
        videoCtx.fillRect(mouse_posX-canvasRect.left-pointerSize/2, mouse_posY-canvasRect.top-pointerSize/2, pointerSize, pointerSize);
        videoCtx.stroke();

        if (valenceRating){
          videoCtx.fillText('Valence: ' + String(Math.round(valenceRating*100)) + '%', topLeftX+recWidth/5, topLeftY + shift_y_1);
          videoCtx.fillText('Arousal: ' + String(Math.round(arousalRating*100)) + '%', topLeftX+recWidth/5, topLeftY + shift_y_2);
        }
      }else{
        videoCtx.font = "30px Arial";
        videoCtx.fillStyle = "red";
        videoCtx.textAlign="center"; 
        videoCtx.fillText("OUT OF BOUNDS",videoCanvas.width/2, videoCanvas.height/2-crossLength);
      }
  }
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
  gridCtx.strokeStyle="red";
  // drawing the center cross
  gridCtx.lineWidth="2";
  gridCtx.beginPath();
  gridCtx.moveTo(topLeftX+recWidth/2-crossLength/2, topLeftY+recHeight/2);
  gridCtx.lineTo(topLeftX+recWidth/2+crossLength/2, topLeftY+recHeight/2);
  gridCtx.stroke();
  gridCtx.beginPath();
  gridCtx.moveTo(topLeftX+recWidth/2, topLeftY+recHeight/2-crossLength/2);
  gridCtx.lineTo(topLeftX+recWidth/2, topLeftY+recHeight/2+crossLength/2);
  gridCtx.stroke();

  gridCtx.lineWidth="1";
  // $('#gridCanvas').show();
  if (user.continuousOrCategory === 0){
    drawGrid();
  }else if (user.continuousOrCategory === 1){
    drawCircle();
  }
  

  function drawCircle(){
    // draw the circle
    gridCtx.beginPath();
    gridCtx.arc(topLeftX+recWidth/2,topLeftY+recHeight/2,recHeight/2,0,2*Math.PI);
    gridCtx.stroke();

    // draw the wedges
    for (i=0;i<6;i++){
      gridCtx.beginPath();
      gridCtx.moveTo(topLeftX+recWidth/2, topLeftY+recHeight/2); // center
      gridCtx.lineTo(topLeftX+recWidth/2 + recHeight/2*Math.cos(user.wedgesAngle[i]/180*Math.PI), topLeftY+recHeight/2+recHeight/2*Math.sin(user.wedgesAngle[i]/180*Math.PI));
      gridCtx.stroke();
    }

    //draw text for each wedges
    gridCtx.font = "14pt Arial";
    gridCtx.fillStyle = "red";
    gridCtx.textAlign="center";
    for (j=0;j<6;j++){
      gridCtx.fillText(user.categoryLabels[user.categoryOrder[j]],topLeftX+recWidth/2 + categoryRadius*Math.cos(user.categoriesAngle[j]/180*Math.PI), topLeftY+recHeight/2+categoryRadius*Math.sin(user.categoriesAngle[j]/180*Math.PI));
    }

  }

  function drawGrid(){
    //drawing the rectangle outline
    gridCtx.strokeRect(topLeftX, topLeftY, recWidth, recHeight);

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
    if (user.valenceDirection === 0) {
      gridCtx.textAlign="left"; 
      gridCtx.fillText("Positive",gridCanvas.width/2+recWidth/2+padding_x, gridCanvas.height/2+padding_x);
      gridCtx.textAlign="right"; 
      gridCtx.fillText("Negative",gridCanvas.width/2-recWidth/2-padding_x, gridCanvas.height/2+padding_x);
    } else {
      gridCtx.textAlign="right"; 
      gridCtx.fillText("Positive",gridCanvas.width/2-recWidth/2-padding_x, gridCanvas.height/2+padding_x);
      gridCtx.textAlign="left"; 
      gridCtx.fillText("Negative",gridCanvas.width/2+recWidth/2+padding_x, gridCanvas.height/2+padding_x);
    }
  }
  
}


// other functions
function createUser() {
  // Get all the forms elements and their values in one step
  var values = $("#infoForm").serializeArray();

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


  // combinePlaylist(user.playlistId, user.playlistId2, {}, MAX_TRIALS - PRACTICE_TRIAL).then(message => {
  getPlaylist(user.playlistId, {
    query: {
      maxResults: MAX_TRIALS-PRACTICE_TRIAL,
    }
  }).then(message => {
    console.log(message);
    if (user.projectVersion == 'control'){
      user.trialVideos.push({videoId:user.practiceId2, title:'0_occlusion'});
      user.trialVideos.push({videoId:user.practiceId, title:'0_control'});
    }else{
      user.trialVideos.push({videoId:user.practiceId, title:'000_occlusion'});
    }
    Array.prototype.push.apply(user.trialVideos, message.results);

    createEntry(user).then(message => {
      if (message) {
        // user.valenceDirection.push(valence_direction);
        showPage(3);
        $('#instructionDoc')[0].contentWindow.location.replace(user.instructionURL);
        // $('#instructionDoc').attr('src', user.instructionURL);
        $('#viewInstructionButton').attr('href', user.instructionHref);
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
      window.alert(alertStr);
      showPage(3);
      $('#instructionDoc')[0].contentWindow.location.replace(user.instructionURL);
      // $('#instructionDoc').attr('src', user.instructionURL);
      $('#viewInstructionButton').attr('href', user.instructionHref);
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
  getPlaylist: getPlaylist,
  trialEntries: trialEntries,
  player: player,
}