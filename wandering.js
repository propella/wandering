// Wandering Letters by Yoshiki Ohshima

var TextFieldWidth = 300;
// var TextFieldWidth = 80;
var TextFieldHeight = 300;
var SPACE_WIDTH = 0;
var SpeedLimit = 13;

function isSpace(t_) {
  return $(t_).firstChild.nodeValue == ' ';
}

function place(index, pos, prevPos) { // pos: predecessor's pos
  var me = $('p' + index); // This character's node
  var prev = index == 0 ? {} : $('p' + (index - 1)); // Preceding letter's node
  var prevSettled = pos.settled;
  var newBeginning = prevPos.beginning;
  if (me.asked) {
    if(isSpace(prev)) {
      newBeginning = true;
    } else {
      prev.asked = true;
    }
  }
  var targetX = newBeginning ? 0 : pos.right;
  var targetY = newBeginning ? pos.y + prevPos.height : pos.y;
  var curX = prevPos.x;
  var curY = prevPos.y;

  var diffX = targetX - curX;
  var diffY = targetY - curY;
  var norm = Math.sqrt(diffX * diffX + diffY * diffY);

  // The letter reached the goal
  if (norm < SpeedLimit) {
    var newRight = targetX + prevPos.width;
    // The letter passed the TextFieldWidth
    if (newRight > TextFieldWidth && prevSettled) {
      prev.asked = true;
    }
    return {x: targetX, y: targetY, width: prevPos.width, height: prevPos.height, right: targetX + prevPos.width, beginning: newBeginning, settled: prevSettled && !(newRight > TextFieldWidth)};
  }
  var speed = Math.min(norm, SpeedLimit);
  var speedX = (diffX/norm) * speed;
  var speedY = (diffY/norm) * speed;
  var newX = curX + speedX;
  var jit = Math.random() * 6 - 3;
  return {x: newX, y: curY + speedY + jit, width: prevPos.width, height: prevPos.height, right: newX + prevPos.width, beginning: newBeginning, settled: false};
}

function makePos(i) {
  var id = 'p' + i;
  var width = isSpace(id) ? SPACE_WIDTH : $(id).getDimensions().width;
  var height = $(id).getDimensions().height;

  return {x: Math.random() * TextFieldWidth,  // X position
          y: Math.random() * TextFieldHeight, // Y position
          width: width,
          height: height,
          right: 0, // right
          beginning: false, // the beginning of the line
          settled: false};
}

// Return a Behavior with timer and the first anchor
function makePosArray0() {
  return timerB(50).liftB(
    function (time) {
      return {x: 0,
              y: 0,
              width: 0,
              height: 0,
              right: 0,
              beginning: false, // the beginning of the line
              settled: true};
    });
}

// Return each character's behavior.
// When it is the first character, it will be placed to 0,0.
function makePosArray(posArray, i) {
  var prevBehavior = i == 0 ? makePosArray0() : posArray[i - 1];
  return prevBehavior
    .changes() // Behavior a -> EventStream a
    .collectE(makePos(i), function(pred, past) {
                            return place(i, pred, past);
                          })
    .startsWith(makePos(i)); // (EventStream a, a) -> Behavior a
}

function loader() {

  var ary = 'The first three years were devoted to making much smaller, simpler, and more readable versions of many of the prime parts of personal computing, including: graphics and sound, viewing/windowing, UIs, text, composition, cells, TCP/IP, etc. These have turned out well (they are chronicled in previous NSF reports and in our papers and memos).'.split('');
//  var ary = 'The first three'.split('');

  var posArray = new Array(ary.length);

  SPACE_WIDTH = $('space').getDimensions().width;

  var str = '';
  for (var i = 0; i < ary.length; i++) {
    str = str + '<span id=p' + i + '>' + ary[i] + '</span>';
  }
  document.body.innerHTML = str;

  // Initialize each character
  for (var i = 0; i < ary.length; i++) {
    var id = 'p' + i;
    posArray[i] = makePosArray(posArray, i);

    insertDomB(
      DIV({style: { position: 'absolute',
                    left: posArray[i].liftB(function(pos) {return pos.x;}),
                    top: posArray[i].liftB(function(pos) {return pos.y;}) },
           id: id},
          ary[i]),
      id);
  }
}
