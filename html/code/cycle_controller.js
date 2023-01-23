/** @param {NS} ns **/

import {
  exec,
  execOnServers,
  run,
  calcThreadsGrow,
  calcThreadsWeaken,
  calcThreadsHack,
  uuidv4,
  waitForScript,
  getCycleThreads,
} from "tools.js";

// import { getServerList } from "worm.js";

export async function main(ns) {
  const [target, hackRatio, serversString, period, taskSeperation, port] =
    ns.args;
  ns.clearPort(port);
  ns.disableLog("sleep");
  var actionList = [];

  const servers = JSON.parse(serversString);
  var threadsNeeded = getCycleThreads(ns, target, hackRatio);
  // ns.tprint(threadsNeeded);

  // let player = ns.getPlayer();
  // let targetServer = ns.getServer(target);

  var hackTime = Math.round(ns.getHackTime(target));
  var weakenTime = Math.round(ns.getWeakenTime(target));
  var growTime = Math.round(ns.getGrowTime(target));
  // ns.tprint(hackTime);
  // ns.tprint(weakenTime);
  // ns.tprint(growTime);

  // Initialize scripts
  // run(ns, "run_command.js", 1, "init", uuidv4());
  // run(ns, "monitor.js", 1, true, hackTime, weakenTime, growTime, weakenTime);

  // Create a plan for scripts running order
  actionList.push({
    command: "single_hack.js",
    time: hackTime,
    threads: threadsNeeded.hack,
    duration: hackTime,
  });
  actionList.push({
    command: "single_weaken.js",
    time: weakenTime - taskSeperation,
    threads: threadsNeeded.weaken1,
    duration: weakenTime,
  });
  actionList.push({
    command: "single_grow.js",
    time: growTime - 2 * taskSeperation,
    threads: threadsNeeded.grow,
    duration: growTime,
  });
  actionList.push({
    command: "single_weaken.js",
    time: weakenTime - 3 * taskSeperation,
    threads: threadsNeeded.weaken2,
    duration: weakenTime,
  });

  actionList.sort((a, b) => b.time - a.time);
  let first = actionList[0].time;
  actionList.forEach((x, i) => (x.time = first - x.time));

  var pids = [];
  run(ns, "monitor.js", 1, false, port);
  for (let a of actionList) {
    await ns.sleep(a.time);
    pids.push(
      run(
        ns,
        "repeat_command.js",
        1,
        serversString,
        period,
        a.command,
        a.threads,
        uuidv4(),
        target
      )
    );
    await ns.writePort(
      port,
      JSON.stringify({ type: "repeater", pid: pids[pids.length - 1] })
    );
  }
  // await ns.sleep(3 * (hackTime + growTime + 2 * weakenTime));
  // for (let pid of pids) {
  //   var income = ns.getScriptIncome(pid);
  //   if (income > 0) {
  //     ns.tprint("Income: " + ns.getScriptIncome(pid));
  //     ns.print("Income: " + ns.getScriptIncome(pid));
  //   }
  //   ns.kill(pid);
  // }
  // ns.exit();
}
