/** @param {NS} ns **/

import {
  execOnServers,
  calcThreadsGrow,
  calcThreadsWeaken,
  waitForScript,
} from "tools.js";

import { getServerList } from "worm.js";

export async function main(ns) {}

export function calcPrepTime(ns, target, servers) {
  let totalRam = servers.reduce((s, x) => s + ns.getServerMaxRam(x), 0);
  let growRam = calcThreadsGrow(ns, target) * ns.getScriptRam("single_grow.js");
  var minSecurity = ns.getServerMinSecurityLevel(target);
  var currSecurity = ns.getServerSecurityLevel(target);
  let weakenRam =
    Math.ceil(
      (currSecurity +
        ns.growthAnalyzeSecurity(calcThreadsGrow(ns, target), target, 1) -
        minSecurity) /
        ns.weakenAnalyze(1)
    ) * ns.getScriptRam("single_weaken.js");
  let weakenTime = ns.getWeakenTime(target);
  // ns.printf(
  //   totalRam,
  //   growRam,
  //   minSecurity,
  //   currSecurity,
  //   weakenTime,
  //   weakenRam
  // );
  return Math.ceil((weakenRam + growRam) / totalRam) * weakenTime;
}

export async function prepareAllTargets(ns, servers) {
  let targets = getServerList(ns)
    .filter((x) => x != "home" && ns.getServerMaxMoney(x))
    .filter(ns.hasRootAccess)
    .sort(
      (a, b) =>
        ns.getServerRequiredHackingLevel(a) -
        ns.getServerRequiredHackingLevel(b)
    );
  for (let target of targets) {
    await prepareTarget(ns, target, servers);
  }
}

export async function prepareTarget(ns, target, servers) {
  var minSecurity = ns.getServerMinSecurityLevel(target);
  const growCost = ns.getScriptRam("single_grow.js");
  let totalRam = servers.reduce((s, x) => s + ns.getServerMaxRam(x), 0);
  let s = {
    name: target,
    sec: ns.getServerSecurityLevel(target),
    minSec: ns.getServerMinSecurityLevel(target),
    money: ns.getServerMoneyAvailable(target),
    maxMoney: ns.getServerMaxMoney(target),
    lvl: ns.getServerRequiredHackingLevel(target),
    ports: ns.getServerNumPortsRequired(target),
  };
  while (s.sec != s.minSec || s.money != s.maxMoney) {
    var currSecurity = ns.getServerSecurityLevel(target);
    var growThreads = calcThreadsGrow(ns, target);
    ns.print(JSON.stringify(s));
    var weakenThreads = Math.ceil(
      (currSecurity +
        ns.growthAnalyzeSecurity(
          Math.min(growThreads, totalRam / growCost),
          target,
          1
        ) -
        minSecurity) /
        ns.weakenAnalyze(1)
    );
    let pids = { w: 0, g: 0 };
    if (weakenThreads > 0) {
      pids.w = execOnServers(
        ns,
        "single_weaken.js",
        servers,
        weakenThreads,
        target
      );
    }
    if (growThreads > 0) {
      pids.g = execOnServers(
        ns,
        "single_grow.js",
        servers,
        growThreads,
        target
      );
    }
    await waitForScript(ns, pids.w);
    await ns.sleep(500);
    s.sec = ns.getServerSecurityLevel(target);
    s.money = ns.getServerMoneyAvailable(target);
    ns.printf(
      "%20s: sec: %2u/%2u, money: %s/%s",
      s.name,
      s.sec,
      s.minSec,
      ns.nFormat(s.money, "($0.00 a)"),
      ns.nFormat(s.maxMoney, "($0.00 a)")
    );
  }
}
