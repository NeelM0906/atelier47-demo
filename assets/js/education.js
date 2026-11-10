(function () {
  'use strict';
  var NOTES = {
    cut: ['Light leaks out of the bottom and sides. The stone looks glassy and dark.', 'Noticeably less sparkle. Usually cut to save weight rather than for beauty.', 'Acceptable brightness. Fine for very small side stones.', 'Bright and lively. Most people cannot tell it from Excellent.', 'Cut decides sparkle more than anything else. Stay at Excellent or Very good.'],
    color: ['Colorless. The rarest and most expensive color grade.', 'Colorless. Indistinguishable from D without a master set.', 'Colorless. A favorite for platinum solitaires.', 'Near colorless. Looks white face-up and is the best value for most clients.', 'Near colorless. A smart choice, especially in yellow or rose gold.', 'Near colorless. Slight warmth visible next to a D, rarely on the hand.', 'Near colorless. Warmth shows in larger stones. Pairs well with yellow gold.', 'Faint color. Warm and vintage looking. Significant savings.', 'Faint color. Noticeably warm. Chosen on purpose for antique styles.', 'Faint color. A champagne tone. Lovely in yellow gold if you like warmth.'],
    clarity: ['Flawless. No inclusions or blemishes under 10x magnification.', 'Internally flawless. Tiny surface blemishes only.', 'Very, very slightly included. Hard for a trained grader to find at 10x.', 'Very, very slightly included. Invisible without magnification.', 'Very slightly included. Eye clean. A sweet spot for step cuts.', 'Very slightly included. Eye clean in almost every stone.', 'Slightly included. Often eye clean in round brilliants. We check each one.', 'Slightly included. Some inclusions may be visible from the side.', 'Included. Inclusions are visible to the eye and can affect durability.', 'Included. Obvious inclusions. We rarely recommend this grade for a center stone.']
  };
  function mm(c) { return (6.4 * Math.cbrt(c)).toFixed(1); }
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('explorer'), J = window.A47Jewelry;
    if (!form || !J) return;
    var stage = document.getElementById('explorer-svg'), sum = document.getElementById('explorer-sum');
    function update() {
      var s = { cut: +form.cut.value, color: +form.color.value, clarity: +form.clarity.value, carat: +form.carat.value };
      stage.innerHTML = J.diamond4c(s);
      document.getElementById('x-cut-out').textContent = J.CUT_GRADES[s.cut];
      document.getElementById('x-color-out').textContent = J.COLOR_GRADES[s.color];
      document.getElementById('x-clarity-out').textContent = J.CLARITY_GRADES[s.clarity];
      document.getElementById('x-carat-out').textContent = s.carat.toFixed(2) + ' ct';
      document.getElementById('x-cut-note').textContent = NOTES.cut[s.cut];
      document.getElementById('x-color-note').textContent = NOTES.color[s.color];
      document.getElementById('x-clarity-note').textContent = NOTES.clarity[s.clarity];
      document.getElementById('x-carat-note').textContent = 'About ' + mm(s.carat) + ' mm across. ' + (s.carat >= 1 ? 'Prices step up at 1, 1.5 and 2 carats, so 0.9 or 1.4 can save a lot.' : 'Price rises faster than size.');
      form.cut.setAttribute('aria-valuetext', J.CUT_GRADES[s.cut]);
      form.color.setAttribute('aria-valuetext', J.COLOR_GRADES[s.color] + ' color');
      form.clarity.setAttribute('aria-valuetext', J.CLARITY_GRADES[s.clarity]);
      form.carat.setAttribute('aria-valuetext', s.carat.toFixed(2) + ' carats');
      sum.textContent = s.carat.toFixed(2) + ' ct · ' + J.CUT_GRADES[s.cut] + ' cut · ' + J.COLOR_GRADES[s.color] + ' color · ' + J.CLARITY_GRADES[s.clarity] + ' clarity';
    }
    form.addEventListener('input', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  });
})();
