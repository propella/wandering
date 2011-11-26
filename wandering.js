// Yoshiki Ohshima's Wandering Letters in Flapjax

var TextFieldWidth = 300; // Width of the text
var TextFieldHeight = 300; // Height of initial letter positions
var SpaceWidth = null; // Width of space initialized at loader()
var SpeedLimit = 13; // Smallest gap which animation happens

// Return next state of the letter
// pred : the preceding letter
// old : old state of the letter
function place(pred, old) {

  // Test if the letter should go next line
  var beginning = old.beginning;
  if (old.asked) {
    if(pred.isSpace) {
      beginning = true; // Beginning of the word
    } else {
      pred.asked = true; // Middle of the word TODO: unwanted side effect
    }
  }

  var targetX = beginning ? 0 : pred.x + pred.width;
  var targetY = beginning ? pred.y + old.height : pred.y;

  var diffX = targetX - old.x;
  var diffY = targetY - old.y;
  var norm = Math.sqrt(diffX * diffX + diffY * diffY);

  // Test if the letter reaches the goal
  if (norm < SpeedLimit) {
    var isExceed = targetX + old.width > TextFieldWidth;
    // The letter exceeded the TextFieldWidth
    if (isExceed && pred.settled) {
      pred.asked = true; // !!! TODO: unwanted side effect
    }
    return {x: targetX,
            y: targetY,
            width: old.width,
            height: old.height,
            isSpace: old.isSpace,
            beginning: beginning,
            settled: pred.settled && !isExceed,
            asked: old.asked};
  }

  // Continue wandering
  var speed = Math.min(norm, SpeedLimit);
  var speedX = (diffX/norm) * speed;
  var speedY = (diffY/norm) * speed;
  var jit = Math.random() * 6 - 3;

  return {x: old.x + speedX,
          y: old.y + speedY + jit,
          width: old.width,
          height: old.height,
          isSpace: old.isSpace,
          beginning: beginning,
          settled: false,
          asked: old.asked};
}

// Return a Letter structure
function makeLetter(i) {
  var id = 'p' + i;
  var isSpace = $(id).firstChild.nodeValue == ' ';
  var width = isSpace ? SpaceWidth : $(id).getDimensions().width;
  var height = $(id).getDimensions().height;

  return {x: Math.random() * TextFieldWidth,  // X position
          y: Math.random() * TextFieldHeight, // Y position
          width: width,
          height: height,
          isSpace: isSpace, // True if this is a space.
          beginning: false, // True if this is the beginning of the line
          settled: false, // True if this animation is stopped
          asked: false}; // True if the word including this should go next line.
}

// Return a Behavior with timer and the first anchor.
// This behavior is constant but tick at each 50 ms.
function makeLetter0() {
  return timerB(50).liftB(
    function (time) {
      // The anchor Letter structure
      return {x: 0,
              y: 0,
              width: 0,
              height: 0,
              isSpace: false,
              beginning: false,
              settled: true,
              asked: false};
    });
}

// Return each character's behavior.
// When it is the first character, it will be placed to 0,0.
function makeBehavior(behaviors, i) {
  var predBehavior = i == 0 ? makeLetter0() : behaviors[i - 1];
  return predBehavior
    .changes() // Behavior a -> EventStream a
    .collectE(makeLetter(i),
              function(pred, old) { return place(pred, old); })
    .startsWith({}); // (EventStream a, a) -> Behavior a
}

function loader() {

  var ary = 'The first three years were devoted to making much smaller, simpler, and more readable versions of many of the prime parts of personal computing, including: graphics and sound, viewing/windowing, UIs, text, composition, cells, TCP/IP, etc. These have turned out well (they are chronicled in previous NSF reports and in our papers and memos).'.split('');

  SpaceWidth = $('space').getDimensions().width;

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
