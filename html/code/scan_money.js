/** @param {NS} ns **/

import { getServerList } from "worm.js";
import { calcPrepTime } from "prepare_target.js";

export async function main(ns) {
  let servers = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess);
  let targets = getServerList(ns).filter(
    (x) => !ns.getServer(x).purchasedByPlayer && ns.getServerMaxMoney(x) > 0
  );
  let serverInfo = targets
    .map((s) => {
      return {
        name: s,
        sec: ns.getServerSecurityLevel(s),
        minSec: ns.getServerMinSecurityLevel(s),
        money: ns.getServerMoneyAvailable(s),
        maxMoney: ns.getServerMaxMoney(s),
        lvl: ns.getServerRequiredHackingLevel(s),
        ports: ns.getServerNumPortsRequired(s),
        prep: calcPrepTime(ns, s, servers),
      };
    })
    .sort((a, b) => a.lvl - b.lvl);
  for (let s of serverInfo.slice(0, 20)) {
    ns.tprintf(
      "%4u %20s: %u, sec: %2u/%2u, money: %s/%s, %s",
      s.lvl,
      s.name,
      s.ports,
      s.sec,
      s.minSec,
      ns.nFormat(s.money, "($0.00 a)"),
      ns.nFormat(s.maxMoney, "($0.00 a)"),
      ns.tFormat(s.prep)
    );
  }
}
