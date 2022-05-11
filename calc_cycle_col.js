/** @param {NS} ns **/

export async function main(ns) {
}

export function findPeriod(ns, target, taskSeperation) {
  var hackTime = Math.round(ns.getHackTime(target));
  var weakenTime = Math.round(ns.getWeakenTime(target));
  var growTime = Math.round(ns.getGrowTime(target));
  for(var period = 2500; period < 7000; period+=10) {
    let growCollision = findCollision(ns, period, growTime, [[taskSeperation, 2*taskSeperation], [period - taskSeperation, period]]);
    let hackCollision = findCollision(ns, period, hackTime, [[period - taskSeperation, period], [period - 3*taskSeperation, period - 2*taskSeperation]]);
    if(! (growCollision || hackCollision)) {
      return period;
    }
  }
  return false;
}

export function getCollisions(ns, period, target, sep) {
  var hackTime = Math.round(ns.getHackTime(target));
  var weakenTime = Math.round(ns.getWeakenTime(target));
  var growTime = Math.round(ns.getGrowTime(target));
  let growCollision = findCollision(ns, period, growTime,
                                    [[sep, 2*sep],
                                     [period - sep, period]]);
  let hackCollision = findCollision(ns, period, hackTime,
                                    [[period - sep, period],
                                     [period - 3*sep, period - 2*sep]]);
  let weakenCollision = findCollision(ns, period, weakenTime,
                                      [[0 , sep], [2 * sep , 3 * sep],
                                       [period - 2*sep, period - sep]]);
  return [growCollision, hackCollision, weakenCollision];
}

export function findCollision(ns, period, time, badIntervals) {
  var drift = time % period;
  var pos = drift;
  for(var i = 1; i < 1000; i++) {
    var diff = period - pos;
    if (badIntervals.map(x => inInterval(x, pos)).reduce((a, b) => a || b)) {
      ns.tprint(badIntervals.map(x => inInterval(x, pos)));
      ns.tprint(pos, badIntervals);
      return i;
    }
    pos += drift;
    pos %= period;
  }
  return false;
}

export function inInterval(interval, time) {
  return time >= interval[0] && time <= interval[1];
}
