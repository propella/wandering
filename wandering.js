// Wandering Letters by Yoshiki Ohshima

var TextFieldWidth = 300;
// var TextFieldWidth = 150;
var TextFieldHeight = 300;
var SPACE_WIDTH = 0;
var SpeedLimit = 13;

function place(pred, old) { // pred: predecessor letter
  var newBeginning = old.beginning;

  if (old.asked) {
    if(pred.isSpace) {
      newBeginning = true;
    } else {
      pred.asked = true;
    }
  }

  var targetX = newBeginning ? 0 : pred.right;
  var targetY = newBeginning ? pred.y + old.height : pred.y;
  var curX = old.x;
  var curY = old.y;

  var diffX = targetX - curX;
  var diffY = targetY - curY;
  var norm = Math.sqrt(diffX * diffX + diffY * diffY);

  // The letter reached the goal
  if (norm < SpeedLimit) {
    var newRight = targetX + old.width;
    // The letter passed the TextFieldWidth
    if (newRight > TextFieldWidth && pred.settled) {
      pred.asked = true;
    }
    return {x: targetX, y: targetY, width: old.width, height: old.height, right: targetX + old.width, isSpace: old.isSpace, beginning: newBeginning, settled: pred.settled && !(newRight > TextFieldWidth), asked: old.asked};
  }
  var speed = Math.min(norm, SpeedLimit);
  var speedX = (diffX/norm) * speed;
  var speedY = (diffY/norm) * speed;
  var newX = curX + speedX;
  var jit = Math.random() * 6 - 3;
  return {x: newX, y: curY + speedY + jit, width: old.width, height: old.height, right: newX + old.width, isSpace: old.isSpace, beginning: newBeginning, settled: false, asked: old.asked};
}

// Return a Letter structure
function makeLetter(i) {

  var id = 'p' + i;
  var isSpace = $(id).firstChild.nodeValue == ' ';
  var width = isSpace ? SPACE_WIDTH : $(id).getDimensions().width;
  var height = $(id).getDimensions().height;

  return {x: Math.random() * TextFieldWidth,  // X position
          y: Math.random() * TextFieldHeight, // Y position
          width: width,
          height: height,
          right: 0, // right
          isSpace: isSpace, // True if this is a space.
          beginning: false, // True if this is the beginning of the line
          settled: false,
          asked: false}; // True if the word including this should go new line.
}

// Return a Behavior with timer and the first anchor
function makeLetter0() {
  return timerB(50).liftB(
    function (time) {
      return {x: 0,
              y: 0,
              width: 0,
              height: 0,
              right: 0,
              isSpace: false,
              beginning: false, // the beginning of the line
              settled: true,
              asked: false};
    });
}

// Return each character's behavior.
// When it is the first character, it will be placed to 0,0.
function makeBehavior(behaviors, i) {
  var prevBehavior = i == 0 ? makeLetter0() : behaviors[i - 1];
  return prevBehavior
    .changes() // Behavior a -> EventStream a
    .collectE(makeLetter(i), function(pred, old) { return place(pred, old); })
    .startsWith({}); // (EventStream a, a) -> Behavior a
}

function loader() {

  var ary = 'The first three years were devoted to making much smaller, simpler, and more readable versions of many of the prime parts of personal computing, including: graphics and sound, viewing/windowing, UIs, text, composition, cells, TCP/IP, etc. These have turned out well (they are chronicled in previous NSF reports and in our papers and memos).'.split('');

  SPACE_WIDTH = $('space').getDimensions().width;

  var str = '';
  for (var i = 0; i < ary.length; i++) {
    str = str + '<span id=p' + i + '>' + ary[i] + '</span>';
  }
  document.body.innerHTML = str;

  // Initialize each letter
  var behaviors = new Array(ary.length);
  for (var i = 0; i < ary.length; i++) {
    var id = 'p' + i;
    behaviors[i] = makeBehavior(behaviors, i);

    insertDomB(
      DIV({style: { position: 'absolute',
                    left: behaviors[i].liftB(function(pos) {return pos.x;}),
                    top: behaviors[i].liftB(function(pos) {return pos.y;}) },
           id: id},
          ary[i]),
      id);
  }
}
