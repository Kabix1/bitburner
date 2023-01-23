/** @param {NS} ns **/

import { run, uuidv4 } from "tools.js";

const threadCost = 1.75;

export async function main(ns) {
  ns.disableLog("ALL");
  const [allocatedServers, period, command, threads, id, target] = ns.args;
  while (true) {
    let args = [allocatedServers, command, threads, target, uuidv4()];
    run(ns, "run_command.js", 1, ...args);
    await ns.sleep(period);
  }
}
