/** @param {NS} ns **/

// import { getServerInfo } from "calc_income.js";
import { getServerList } from "worm.js";
import {
  run,
  waitForScript,
  getCycleThreads,
  ramFormated,
  prepareServer,
  getBestTarget,
  calcPeriod,
  uuidv4,
} from "tools.js";
import { findPeriod, getCollisions } from "calc_cycle_col.js";

import {
  calcPrepTime,
  prepareTarget,
  prepareAllTargets,
} from "prepare_target.js";

export async function main(ns) {
  // TODO: Choose hack ratio based on maxThreads
  ns.disableLog("ALL");

  killAll(ns);
  let servers = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess);

  // await prepareAllTargets(ns, servers);
  // buyServers(ns);
  await prepareTarget(ns, "max-hardware", servers);
  let a = findTarget(ns);
  await prepareTarget(ns, a.target, servers);
  startHacking(ns, a);

  while (true) {
    let newServers = buyServers(ns);
    if (newServers.length > 0) {
      ns.killall("home", true);
      a = findTarget(ns);
      servers = getServerList(ns)
        .filter((x) => x != "home")
        .filter(ns.hasRootAccess);
      await prepareTarget(ns, a.target, servers);
      startHacking(ns, a);
    }
    await ns.sleep(60 * 1000 * 5);
  }
}

export function getMaxServerSize(maxCost) {
  const baseCost = 110000;
  if (maxCost < baseCost) {
    return 0;
  }
  return 2 * Math.pow(2, Math.floor(Math.log2(Math.floor(maxCost / baseCost))));
}

export function createServerName(ns, ram) {
  return ns.sprintf(
    "worker-%s-%s",
    ns.nFormat(1024 * 1024 * 1024 * ram, "0ib"),
    uuidv4()
  );
}

export function buyServers(ns) {
  let money = ns.getServerMoneyAvailable("home");
  let ownedServers = getServerList(ns).filter(
    (x) => ns.getServer(x).purchasedByPlayer
  );
  let boughtServers = [];
  while (ownedServers.length + boughtServers.length < 25 && money > 110000) {
    let ram = Math.min(ns.getPurchasedServerMaxRam(), getMaxServerSize(money));
    let name = createServerName(ns, ram);
    boughtServers.push(ns.purchaseServer(name, ram));
    money = ns.getServerMoneyAvailable("home");
    prepareServer(ns, name);
  }
  return boughtServers;
}

function findTarget(ns) {
  let servers = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess)
    .sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
  let targets = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess);
  let ram = servers.reduce(
    (s, x) => s + Math.floor(Math.floor(ns.getServerMaxRam(x) / 1.7) * 1.7),
    0
  );
  return getBestTarget(ns, servers, targets, ram);
}

function startHacking(ns, a) {
  let servers = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess)
    .sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
  let targets = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess);
  let ram = servers.reduce(
    (s, x) => s + Math.floor(ns.getServerMaxRam(x) / 1.7) * 1.7,
    0
  );
  const period = calcPeriod(ns, a.target, ram, a.hackRatio);
  const taskSeperation = Math.max(0.1 * period, 400);
  run(
    ns,
    "cycle_controller.js",
    1,
    a.target,
    a.hackRatio,
    JSON.stringify(servers),
    period,
    taskSeperation,
    1
  );
}

function killAll(ns) {
  let servers = getServerList(ns);
  for (let s of servers) {
    ns.killall(s, true);
  }
}
