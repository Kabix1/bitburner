/** @param {NS} ns **/

import { getServerList } from "worm.js";
import { calcNeededRam, ramFormated, calcPeriod } from "tools.js";

export async function main(ns) {
  let servers = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess);
  let ram = servers.reduce((s, x) => s + ns.getServerMaxRam(x), 0);
  let targets = getServerList(ns).filter(
    (x) =>
      !ns.getServer(x).purchasedByPlayer &&
      ns.getServerMaxMoney(x) > 0 &&
      ns.getServerRequiredHackingLevel(x) <= ns.getHackingLevel()
  );
  const period = 10000;
  let serverInfo = targets
    .map((s) => {
      return {
        name: s,
        lvl: ns.getServerRequiredHackingLevel(s),
        ports: ns.getServerNumPortsRequired(s),
        ram: calcNeededRam(ns, s, 0.49, period),
        period: calcPeriod(ns, s, ram, 0.49),
      };
    })
    .sort((a, b) => a.lvl - b.lvl);
  for (let s of serverInfo.slice(0, 20)) {
    ns.tprintf(
      "%4u %20s: %u, %s, %s",
      s.lvl,
      s.name,
      s.ports,
      ramFormated(ns, s.ram),
      ns.tFormat(s.period, true)
    );
  }
}
