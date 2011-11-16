// Wandering Letters by Yoshiki Ohshima

var TextFieldWidth = 300;
var TextFieldHeight = 300;
var SpeedLimit = 13;

function isSpace(t_) {
  return $(t_).firstChild.nodeValue == ' ';
}

function place(index, pos) {
  var me = $('p' + index);
  var prev = index == 0 ? null : $('p' + (index - 1));
  var prevSettled = index == 0 ? true : pos.settled;
  if (me.asked) {
    if(isSpace(prev)) {
      me.b = true;
    } else {
      prev.asked = true;
    }
  }
  var targetX = index == 0 ? 0 : (me.b ? 0 : pos.r);
  var targetY = index == 0 ? 0 : (me.b ? pos.y + me.getDimensions().height : pos.y);
  var curX = parseFloat(me.style.getPropertyValue('left'));
  var curY = parseFloat(me.style.getPropertyValue('top'));

  var diffX = targetX - curX;
  var diffY = targetY - curY;
  var norm = Math.sqrt(diffX * diffX + diffY * diffY);
  if (norm < SpeedLimit) {
    var newRight = targetX + me.getDimensions().width;
      if (newRight > TextFieldWidth && prevSettled) {
        prev.asked = true;
      }
    return {x: targetX, y: targetY, r: targetX + me.w, settled: prevSettled && !(newRight > TextFieldWidth)};
  }
  var speed = Math.min(norm, SpeedLimit);
  var speedX = (diffX/norm) * speed;
  var speedY = (diffY/norm) * speed;
  var newX = curX + speedX;
  var jit = prev == null ? 0 : Math.random() * 6 - 3;
  return {x: newX, y: curY + speedY + jit, r: newX + me.w, settled: false};
}

function makePos() {
  return {x: Math.random() * TextFieldWidth,  // X position
          y: Math.random() * TextFieldHeight, // Y position
          r: 0,
          settled: false};
}

// Initialize each character's behavior.
// When it is the first character, it will be placed to 0,0.
function makePosArray(posArray, i) {
  return i == 0 ?
      (timerE(50)
        // (f, EventStream a) -> EventStream b
        .mapE(function (time) {return place(0, {x: 0, y: 0, r: 0});})
        .startsWith(makePos())) : // (EventStream a, a) -> Behavior a
      (posArray[i-1]
        .changes() // Behavior a -> EventStream a
        .mapE(function (pos) {return place(i, pos);}) // (f, EventStream a) -> EventStream b
        .startsWith(makePos())); // (EventStream a, a) -> Behavior a
}

function loader() {

  var ary = 'The first three years were devoted to making much smaller, simpler, and more readable versions of many of the prime parts of personal computing, including: graphics and sound, viewing/windowing, UIs, text, composition, cells, TCP/IP, etc. These have turned out well (they are chronicled in previous NSF reports and in our papers and memos).'.split('');
  var posArray = new Array(ary.length);

  var sp = $('space').getDimensions().width;

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
           id: id,
           b: false,
           w: isSpace(id) ? sp : $(id).getDimensions().width},
          ary[i]),
      id);
  }
}
