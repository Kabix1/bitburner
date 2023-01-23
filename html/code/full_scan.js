/** @param {NS} ns **/

import { getServerList } from "worm.js";

export async function main(ns) {
  let servers = getServerList(ns).filter(
    (x) => !ns.getServer(x).purchasedByPlayer
  );
  let serverInfo = servers
    .map((s) => {
      return {
        name: s,
        ram: ns.getServerMaxRam(s),
        lvl: ns.getServerRequiredHackingLevel(s),
        ports: ns.getServerNumPortsRequired(s),
      };
    })
    .sort((a, b) => a.lvl - b.lvl);
  for (let s of serverInfo) {
    ns.tprintf(
      "%4u: %u, %s, %s",
      s.lvl,
      s.ports,
      ns.nFormat(1024 * 1024 * 1024 * s.ram, "0ib"),
      s.name
    );
  }
}
