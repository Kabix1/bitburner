/** @param {NS} ns **/

export async function main(ns) {
  var startTime = ns.getTimeSinceLastAug();
  var tracker = startTime;
  const sleepTime = 25;
  for (var i = 0; i < 60; i++) {
    await ns.sleep(sleepTime);
    tracker += 2*sleepTime;
    ns.tprint(ns.getTimeSinceLastAug() - tracker);
  }
}
