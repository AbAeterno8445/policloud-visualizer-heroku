var socket = io();

//// Globals ////
// Document elements
const mainDiv = document.getElementById('mainDiv');
const lineSVG = document.getElementById('lineSVG');
const lineSVGdefs = document.getElementById('lineSVGdefs');
const linetest = document.getElementById('testLine');

// Variables
var init = false;
var avaMaxCount = 0;       // Amount of avatars page must render (set from server, used only in page init)
var avaLocalCount = 0;     // Amount of avatars page has currently rendered
var docScale = Math.min(mainDiv.offsetWidth / 1366, mainDiv.offsetHeight / 421);

var ava_baseSize = 120 * docScale;  // Base avatar size
var ava_currentSize = 0;   // Current avatar size
var ava_minSize = 35 * docScale;    // Minimum avatar size

var freePositions = [];

const shuffleDur = 3700;
////////////////

// Update doc scale on resize
window.onresize = function(event) {
  docScale = Math.min(mainDiv.offsetWidth / 1366, mainDiv.offsetHeight / 421);
  ava_baseSize = 120 * docScale;
  ava_minSize = 35 * docScale;
  scaleAvas();
}

// Gets the modified position of elements (for avatars)
function getComputedTranslateXY(obj) {
  const transArr = [];
  if (!window.getComputedStyle) return;
  const style = getComputedStyle(obj),
    transform = style.transform || style.webkitTransform || style.mozTransform;
  let mat = transform.match(/^matrix3d\((.+)\)$/);
  if (mat) return parseFloat(mat[1].split(', ')[13]);
  mat = transform.match(/^matrix\((.+)\)$/);
  mat ? transArr.push(parseFloat(mat[1].split(', ')[4])) : 0;
  mat ? transArr.push(parseFloat(mat[1].split(', ')[5])) : 0;
  return transArr;
}

function createAvaElement(uid, name, imgpath, color) {
  // New avatar div
  var newAva = document.createElement("div");
  newAva.classList.add("imgAva");
  newAva.id = uid;

  // New avatar image
  var newAvaImg = document.createElement("img");
  newAvaImg.src = imgpath;
  newAvaImg.id = uid + ".img";
  newAvaImg.style.borderColor = color;

  // New avatar paragraph for name
  var newAvaName = document.createElement("p");
  newAvaName.innerHTML = name;
  newAvaName.id = uid + ".name";

  newAva.appendChild(newAvaImg);
  newAva.appendChild(newAvaName);
  mainDiv.appendChild(newAva);

  avaLocalCount++;
  if (!init && avaMaxCount > 0 && avaLocalCount >= avaMaxCount) {
    init = true;
    scaleAvas();
    shuffleAvas();
    setInterval(shuffleAvas, shuffleDur);
  }
}

function modifyAva(uid, name, imgpath, color) {
  var modAva = document.getElementById(uid);
  if (modAva) {
    // Modify name
    var modAvaName = document.getElementById(uid + ".name");
    if (modAvaName) {
      modAvaName.innerHTML = name
    }

    // Modify image
    var modAvaImg = document.getElementById(uid + ".img");
    if (modAvaImg) {
      modAvaImg.src = imgpath;

      // Modify color
      modAvaImg.style.borderColor = color;
    }
  }
}

function deleteAva(uid) {
  var delAva = document.getElementById(uid);
  if (delAva) {
    delAva.parentElement.removeChild(delAva);
    avaLocalCount--;
  }
}

function shuffleAvas() {
  // Create a random permutation of possible positions
  var tmpPositions = [];
  var randPositions = [];

  for (var i = 0; i < freePositions.length; i++) {
    tmpPositions.push(i);
  }
  var i = tmpPositions.length;
  var j = 0;

  while (i--) {
      j = Math.floor(Math.random() * (i+1));
      randPositions.push(tmpPositions[j]);
      tmpPositions.splice(j,1);
  }

  shuffled = true;
  var imgAvaList = document.getElementsByClassName('imgAva');
  for (var i = 0; i < imgAvaList.length; i++) {
    var imgChild = imgAvaList[i];

    var targetPos = freePositions[randPositions[i]];
    anime({
      targets: imgChild,
      translateX: targetPos[0],
      translateY: targetPos[1],
      duration: shuffleDur,
      easing: 'easeInOutCubic'
    });
  }
}

// Computes free positions in the screen
function calcFreePositions() {
  freePositions.length = 0;  // Clear list

  var safeguard = 0;
  while (freePositions.length < avaMaxCount) {
    var newPosX = (mainDiv.offsetWidth - ava_currentSize) * Math.random();
    var newPosY = (mainDiv.offsetHeight - ava_currentSize) * Math.random();
    
    // Check if free
    var free = true;
    freePositions.forEach(pos => {
      if (!free) return;

      var dist = Math.sqrt(Math.pow(Math.abs(pos[0] - newPosX), 2) + Math.pow(Math.abs(pos[1] - newPosY), 2))
      if (dist < ava_currentSize) {
        free = false;
      }
    });

    // Add to list with safeguard
    safeguard++;
    if (free || safeguard > 5000) {
      freePositions.push([newPosX, newPosY]);
    }
  }

  console.log(freePositions);
}

function scaleAvas() {
  var imgAvaList = document.getElementsByClassName('imgAva');
  if (imgAvaList.length > 10) {
    var newSize = Math.max(ava_minSize, ava_baseSize - (imgAvaList.length - 10));
    ava_currentSize = newSize;
    newSize = newSize.toString() + "px";
    for (var i = 0; i < imgAvaList.length; i++) {
      var imgAva = imgAvaList[i];
      var imgChild = document.getElementById(imgAva.id + ".img");
      if (imgChild) {
        imgAva.style.width = newSize;
        imgAva.style.height = newSize;
        imgChild.style.width = newSize;
        imgChild.style.height = newSize;
      }
    }
  }
  calcFreePositions();
}

function createConnection(id, usr1, usr2) {
  var newLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  newLine.id = id;
  newLine.setAttribute('usr1', usr1);
  newLine.setAttribute('usr2', usr2);
  newLine.style = "stroke:rgb(255,255,255);";
  newLine.style.strokeWidth = "3";
  lineSVG.appendChild(newLine);

  connectionGradient(newLine, usr1, usr2);
}

function connectionGradient(line, usr1, usr2) {
  // Create gradient for line between users
  var usr1Img = document.getElementById(usr1 + '.img');
  var usr2Img = document.getElementById(usr2 + '.img');

  if (usr1Img && usr2Img) {
    var newGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    newGrad.id = "grad" + +lineSVGdefs.childElementCount;

    var stopStart = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopStart.setAttribute('offset', '0%');
    stopStart.style = "stop-color:" + usr2Img.style.borderColor + ";stop-opacity:1";
    newGrad.appendChild(stopStart);

    var stopFinish = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopFinish.setAttribute('offset', '100%');
    stopFinish.style = "stop-color:" + usr1Img.style.borderColor + ";stop-opacity:1";
    newGrad.appendChild(stopFinish);

    lineSVGdefs.appendChild(newGrad);
    line.style = "stroke:url(#" + newGrad.id + ");";
    line.style.strokeWidth = "3";
  }
}

function modifyConnection(id, usr1, usr2) {
  var conn = document.getElementById(id);
  if (conn) {
    conn.setAttribute('usr1', usr1);
    conn.setAttribute('usr2', usr2);
    connectionGradient(conn, usr1, usr2);
  }
}

function deleteConnection(id) {
  var conn = document.getElementById(id);
  if (conn) {
    conn.parentElement.removeChild(conn);
  }
}

function drawConnections() {
  var lineList = document.getElementsByTagName("line");
  for (var i = 0; i < lineList.length; i++) {
    var line = lineList[i];
    var ava1 = document.getElementById(line.getAttribute('usr1'));
    var ava2 = document.getElementById(line.getAttribute('usr2'));

    if (ava1 && ava2) {
      var ava1XY = getComputedTranslateXY(ava1);
      var ava2XY = getComputedTranslateXY(ava2);
      line.setAttribute('x1', ava1XY[0] + ava1.clientWidth / 2);
      line.setAttribute('y1', ava1XY[1] + ava1.clientHeight / 2);
      line.setAttribute('x2', ava2XY[0] + ava2.clientWidth / 2);
      line.setAttribute('y2', ava2XY[1] + ava2.clientHeight / 2);
    }
  };
}
setInterval(drawConnections, 16);

socket.on("newUser", function (data) {
  console.log(data);
  createAvaElement(data.uid, data.name, data.downloadURL, data.color);
});

socket.on("modUser", function (data) {
  modifyAva(data.uid, data.name, data.downloadURL, data.color);
});

socket.on("delUser", function (data) {
  deleteAva(data.uid);
});

socket.on("connUsers", function (data) {
  createConnection(data.cid, data.usr1, data.usr2);
});

socket.on("modConn", function (data) {
  modifyConnection(data.cid, data.usr1, data.usr2);
});

socket.on("delConn", function (data) {
  deleteConnection(data.cid);
});

socket.on("avaCount", function (data) {
  avaMaxCount = data.count;
});

// Connect to server
socket.emit('join');