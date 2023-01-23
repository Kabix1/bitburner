/** @param {NS} ns **/

import { exec, run, waitForScript } from "tools.js";
import { getServerList, prepareServers } from "worm.js";

export async function main(ns) {
  let target = "n00dles";
  while (true) {
    await prepareServers(ns);
    exec(ns, "single_grow.js", "sigma-cosmetics", 8, "n00dles");
    exec(ns, "single_weaken.js", "sigma-cosmetics", 1, "n00dles");
    let servers = getServerList(ns)
      .filter((x) => x != "home")
      .filter((x) => x != "sigma-cosmetics")
      .filter(ns.hasRootAccess);
    var pid = 0;
    for (let s of servers) {
      let numThreads = Math.floor(ns.getServerMaxRam(s) / 1.7);
      pid = exec(ns, "single_hack.js", s, numThreads, "n00dles");
    }
    await waitForScript(ns, pid);
  }
}
