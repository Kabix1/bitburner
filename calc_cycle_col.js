/** @param {NS} ns **/

export async function main(ns) {
  var target = "phantasy";
  const period = 2990;
  const taskSeperation = 50;

  ns.tprint("Collisions for hack");
  var hackTime = Math.round(ns.getHackTime(target));
  findCollisions(ns, period, hackTime, taskSeperation * 3, [taskSeperation, 2 * taskSeperation]);
  ns.tprint("Collisions for weaken");
  var weakenTime = Math.round(ns.getWeakenTime(target));
 // findCollisions(ns, period, weakenTime, taskSeperation);
  ns.tprint("Collisions for grow");
  var growTime = Math.round(ns.getGrowTime(target));
  findCollisions(ns, period, growTime, taskSeperation);

}

export function findCollisions(ns, period, time, badInterval, safeInterval) {
  var drift = time % period;
  var cyclePos = drift;
  for(var i = 0; i < 100; i++) {
    var diff = period - cyclePos;
    if (diff < badInterval) {
      if (safeInterval != undefined && diff > safeInterval[0] && diff < safeInterval[1]) {
        continue;
      }
      ns.tprintf("Possible collision on cycle %s, %s", i, cyclePos);
    }
    cyclePos += drift;
    cyclePos %= period;
  }

}
