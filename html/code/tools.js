/** @param {NS} ns **/

export async function main(ns) {}

export function run(ns, script, numThreads = 1, ...args) {
  let host = ns.getHostname();
  return exec(ns, script, host, numThreads, ...args);
}

export function exec(ns, script, host, numThreads = 1, ...args) {
  let pid = ns.exec(script, host, numThreads, ...args);
  // ns.print(
  //   JSON.stringify({
  //     time: ns.getTimeSinceLastAug(),
  //     pid: pid,
  //     ref: { fn: script, host: host, args: args },
  //   })
  // );
  return pid;
}

export function execOnServers(ns, script, servers, numThreads = 1, ...args) {
  let tCost = ns.getScriptRam(script);
  let threadsLeft = numThreads;
  let i = 0;
  let pid = 0;
  while (threadsLeft > 0 && i < servers.length) {
    let t = Math.min(
      threadsLeft,
      Math.floor(
        (ns.getServerMaxRam(servers[i]) - ns.getServerUsedRam(servers[i])) /
          tCost
      )
    );
    if (t > 0) {
      pid = exec(ns, script, servers[i], t, ...args);
      threadsLeft -= t;
    }
    i += 1;
  }
  return pid;
}

export async function waitForScript(ns, pid) {
  await ns.sleep(100);
  var script = ns.getRunningScript(pid);
  while (script != null) {
    await ns.sleep(100);
    script = ns.getRunningScript(pid);
  }
}

export function getCycleThreads(ns, target, hackRatio) {
  var threadCount = {};
  if (ns.fileExists("Formulas.exe")) {
    var targetServer = ns.getServer(target);
    var player = ns.getPlayer();
    targetServer.moneyAvailable = targetServer.moneyMax;
    threadCount["hack"] = "test";
    threadCount["hack"] = Math.max(
      Math.floor(
        hackRatio / ns.formulas.hacking.hackPercent(targetServer, player)
      ),
      1
    );
    targetServer.moneyAvailable -=
      targetServer.moneyAvailable *
      ns.formulas.hacking.hackPercent(targetServer, player) *
      threadCount["hack"];
    var moneyGrow = targetServer.moneyMax - targetServer.moneyAvailable;
    threadCount["grow"] = Math.ceil(
      moneyGrow /
        (targetServer.moneyAvailable *
          (ns.formulas.hacking.growPercent(targetServer, 1, player) - 1))
    );
    threadCount["weaken1"] = Math.ceil(
      ns.hackAnalyzeSecurity(threadCount["hack"]) / ns.weakenAnalyze(1)
    );
    threadCount["weaken2"] = Math.ceil(
      ns.growthAnalyzeSecurity(threadCount["grow"]) / ns.weakenAnalyze(1)
    );
    return threadCount;
  } else {
    threadCount.hack = calcThreadsHack(ns, target, hackRatio);
    const minSec = ns.getServerMinSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);
    let sec = minSec + ns.hackAnalyzeSecurity(threadCount.hack, target);
    threadCount.weaken1 = Math.ceil((sec - minSec) / ns.weakenAnalyze(1));
    threadCount.grow = Math.ceil(
      ns.growthAnalyze(target, Math.ceil(1 / (1 - hackRatio)) * 2)
    );
    sec = minSec + ns.growthAnalyzeSecurity(threadCount.grow);
    threadCount.weaken2 = Math.ceil((sec - minSec) / ns.weakenAnalyze(1));
  }
  return threadCount;
}
export function calcThreadsGrow(ns, target) {
  var maxMoney = ns.getServerMaxMoney(target);
  var currMoney = ns.getServerMoneyAvailable(target);
  var threadsNeeded = Math.ceil(
    ns.growthAnalyze(target, Math.ceil(maxMoney / Math.max(currMoney, 1)) * 2)
  );
  return threadsNeeded;
}

export function ramFormated(ns, ram) {
  return ns.nFormat(1024 * 1024 * 1024 * ram, "0ib");
}

export function calcThreadsWeaken(ns, target) {
  var minSecurity = ns.getServerMinSecurityLevel(target);
  var currSecurity = ns.getServerSecurityLevel(target);
  var threadsNeeded = Math.ceil(
    (currSecurity - minSecurity) / ns.weakenAnalyze(1)
  );
  return threadsNeeded;
}

export function calcNeededRam(ns, target, hackRatio, period) {
  let threadsNeeded = getCycleThreads(ns, target, hackRatio);
  var hackTime = Math.round(ns.getHackTime(target));
  var weakenTime = Math.round(ns.getWeakenTime(target));
  var growTime = Math.round(ns.getGrowTime(target));
  let ramNeeded = [
    threadsNeeded.hack *
      ns.getScriptRam("single_hack.js") *
      Math.ceil(hackTime / period),
    threadsNeeded.weaken1 *
      ns.getScriptRam("single_weaken.js") *
      Math.ceil(weakenTime / period),
    threadsNeeded.grow *
      ns.getScriptRam("single_grow.js") *
      Math.ceil(growTime / period),
    threadsNeeded.weaken2 *
      ns.getScriptRam("single_weaken.js") *
      Math.ceil(weakenTime / period),
  ];
  return ramNeeded.reduce((s, x) => s + x, 0);
}

export function calcThreadsHack(ns, target, hackRatio) {
  var threadsNeeded = Math.floor(hackRatio / ns.hackAnalyze(target));
  return threadsNeeded;
}

export function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

export async function prepareServer(
  ns,
  server,
  scripts = ["single_weaken.js", "single_hack.js", "single_grow.js"]
) {
  await ns.scp(scripts, server);
}

export function calcPeriod(ns, target, ram, hackRatio) {
  let threads = getCycleThreads(ns, target, hackRatio);
  var hackTime = Math.round(ns.getHackTime(target));
  var weakenTime = Math.round(ns.getWeakenTime(target));
  var growTime = Math.round(ns.getGrowTime(target));
  let period = Math.ceil(
    (threads.hack * ns.getScriptRam("single_hack.js") * hackTime +
      threads.weaken1 * ns.getScriptRam("single_weaken.js") * weakenTime +
      threads.grow * ns.getScriptRam("single_grow.js") * growTime +
      threads.weaken2 * ns.getScriptRam("single_weaken.js") * weakenTime) /
      ram
  );
  period = Math.ceil(period / 100) * 100;
  while (
    calcNeededRam(ns, target, hackRatio, period) > ram &&
    period < weakenTime
  ) {
    period += 100;
  }
  if (period > weakenTime) {
    return Number.MAX_VALUE;
  }
  return Math.max(period, 3000);
}

export function getBestTarget(ns, servers, targets, ram) {
  let hackRatio = 0.01;
  let incomeTable = [];
  let m = { value: 0, point: [0, 0] };
  let i = 1;
  [...Array(95)].forEach(() => {
    let row = targets.map(
      (s) =>
        (ns.getServerMaxMoney(s) * hackRatio * i) /
        calcPeriod(ns, s, ram, hackRatio * i)
    );
    let maxI = row.reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
    m.point = m.value > row[maxI] ? m.point : [i - 1, maxI];
    m.value = m.value > row[maxI] ? m.value : row[maxI];
    i += 1;
  });
  return { target: targets[m.point[1]], hackRatio: hackRatio * m.point[0] };
}
