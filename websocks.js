// Get references to elements on the page.
var form = document.getElementById('message-form');
var answer = document.getElementById('answer-form');
var answerField = document.getElementById('answer');
var messageField = document.getElementById('message');
var messagesList = document.getElementById('messages');
var socketStatus = document.getElementById('stat');
var closeBtn = document.getElementById('close');
var count = document.getElementById('countries');
var paint_space = document.getElementById('paint_space');
var points = document.getElementById('points');
var activeRoom = "room:lobby";
var mySet = new Set();
var lastquestion = "France"

if (sessionStorage.points) {
  points.innerHTML = sessionStorage.points;
} else {
  sessionStorage.points = 0;
  points.innerHTML = sessionStorage.points;
}


function setSet() {
  var temp = "";
  for (let item of mySet)
  temp += '<li class="sent"><span>' + item + '</span> '+
  '<button onclick="joinRoom(\''+item+'\')">Join</button>'
  +'</li>';

  messagesList.innerHTML = temp;
  // Clear out the message field.
  messageField.value = '';
}

function init() {
  websocket = new WebSocket("ws://localhost:4000/socket/websocket");
  websocket.onopen = function(e) {
    onOpen(e)
  };
  websocket.onclose = function(e) {
    onClose(e)
  };
  websocket.onmessage = function(e) {
    onMessage(e)
  };
  websocket.onerror = function(e) {
    onError(e)
  };
}


function onOpen(e) {
  console.log(e);
  websocket.send(JSON.stringify({
    "topic": "room:lobby",
    "event": "phx_join",
    "payload": {
    },
    "ref": "room:lobby"
  }));


  socketStatus.innerHTML = activeRoom;
  if (sessionStorage.lastjoinedroom) {
    joinRoom(sessionStorage.lastjoinedroom)
  }

}

function onClose(e) {
  console.log(e);
  location.reload();
}

function onMessage(e) {
  console.log('rcvd: ' + e.data);
  rec = JSON.parse(e.data);
  if(rec.payload.Room_names != undefined){
    for (let room of rec.payload.Room_names) {
      if(room != "room:lobby" && room != undefined)
      mySet.add(room);
    }
    setSet();
  } else
  if(rec.payload.response && rec.payload.response.Room_names != undefined){
    for (let room of rec.payload.response.Room_names) {
      if(room != "room:lobby" && room != undefined)
      mySet.add(room);
    }
    setSet();
  }
  if(rec.event === "phx_reply" && rec.payload.response.type === "question"){
    lastquestion = rec.payload.response.country
    document.getElementById(rec.payload.response.country).style="display: inline-block;";
  } else if(rec.event === "phx_reply" && rec.payload.response.type === "answer" && rec.payload.response.state === "right"){

    if (sessionStorage.points) {
      sessionStorage.points = Number(sessionStorage.points) + 1;
      points.innerHTML = sessionStorage.points;
    } else {
      sessionStorage.clickcount = 0;
      points.innerHTML = sessionStorage.points;
    }
  }else if(rec.event === "phx_reply" && rec.payload.response.type === "answer" && rec.payload.response.state === "wrong"){

    if (sessionStorage.points) {
      sessionStorage.points = Number(sessionStorage.points) - 1;
      points.innerHTML = sessionStorage.points;
    } else {
      sessionStorage.clickcount = 0;
      points.innerHTML = sessionStorage.points;
    }
  } else if(rec.event === "correct_answer"){
    lastquestion = rec.payload.Next_question
    document.getElementById(rec.payload.Next_question).style="display: inline-block";
    document.getElementById(rec.payload.message).style="display: none";
  }
}

function joinRoom(room_name){
  document.getElementById(lastquestion).style="display: none";


  if(activeRoom != "room:lobby") {
    websocket.send(JSON.stringify({
      "topic": activeRoom,
      "event": "phx_close",
      "payload": {
        "message" : activeRoom
      },
      "ref": "close connection room: "+activeRoom
    }));
  }

  websocket.send(JSON.stringify({
    "topic": room_name,
    "event": "phx_join",
    "payload": {
      "room_name" : room_name
    },
    "ref": "new room: "+room_name
  }));

  activeRoom = room_name;
  socketStatus.innerHTML = room_name;
  sessionStorage.lastjoinedroom = activeRoom;
  paint_space.style="display: inline-block;"

  websocket.send(JSON.stringify({
    "topic": activeRoom,
    "event": "question",
    "payload": {
    },
    "ref": "q"
  }));
}

form.onsubmit = function(e) {
  e.preventDefault();
  document.getElementById(lastquestion).style="display: none";

  // Retrieve the message from the textarea.
  var message = messageField.value;

  if(activeRoom != "room:lobby") {
    websocket.send(JSON.stringify({
      "topic": activeRoom,
      "event": "phx_close",
      "payload": {
        "message" : activeRoom
      },
      "ref": "close connection room: "+activeRoom
    }));
  }

  websocket.send(JSON.stringify({
    "topic": "room:"+message,
    "event": "phx_join",
    "payload": {
      "room_name" : message
    },
    "ref": "new room: "+message
  }));


  websocket.send(JSON.stringify({
    "topic": "room:lobby",
    "event": "shout",
    "payload": {
      "type" : "new room",
    },
    "ref": "new room shout: "+message
  }));

  activeRoom = "room:"+message;
  socketStatus.innerHTML = activeRoom;
  sessionStorage.lastjoinedroom = activeRoom;
  paint_space.style="display: inline-block;"

  websocket.send(JSON.stringify({
    "topic": activeRoom,
    "event": "question",
    "payload": {
    },
    "ref": "q"
  }));
  return false;
};

answer.onsubmit  = function(e) {
  e.preventDefault();

  // Retrieve the message from the textarea.
  var message = answerField.value;
  websocket.send(JSON.stringify({
    "topic": activeRoom,
    "event": "answer",
    "payload": {
      "message" : message
    },
    "ref": "answer: "+message
  }));
};

window.addEventListener("load", init, false);
