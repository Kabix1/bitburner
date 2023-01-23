/** @param {NS} ns **/

import { execOnServers, uuidv4 } from "tools.js";

const threadCost = 1.75;

export async function main(ns) {
  // ns.disableLog("ALL");
  const [allocatedServers, command, threads, target, id] = ns.args;
  let servers = JSON.parse(allocatedServers);
  var pid = execOnServers(ns, command, servers, threads, target, uuidv4());
}

export function run_command(ns, command, threadsNeeded, target) {
  for (let server of rootedServers) {
    if (server["threads"] >= threadsNeeded) {
      server["threads"] -= threadsNeeded;
      return exec(ns, command, server["host"], threadsNeeded, target, uuidv4());
    }
  }
}

export function getAvailableThreads(ns, host) {
  return Math.floor(
    (ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) / threadCost
  );
}
