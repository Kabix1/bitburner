/** @param {NS} ns **/

import { getServerList } from "worm.js";
import {
  calcNeededRam,
  ramFormated,
  calcPeriod,
  getBestTarget,
} from "tools.js";

export async function main(ns) {
  let servers = getServerList(ns)
    .filter((x) => x != "home")
    .filter(ns.hasRootAccess);
  let ram = servers.reduce((s, x) => s + ns.getServerMaxRam(x), 0);
  let targets = getServerList(ns)
    .filter(
      (x) =>
        !ns.getServer(x).purchasedByPlayer &&
        ns.getServerMaxMoney(x) > 0 &&
        ns.getServerRequiredHackingLevel(x) <= ns.getHackingLevel()
    )
    .slice(0, 10);
  // const period = 10000;
  let hackRatio = 0.01;
  let incomeTable = [];
  [...Array(95)].forEach(() => {
    incomeTable.push(
      targets.map(
        (s) =>
          (ns.getServerMaxMoney(s) * hackRatio) /
          calcPeriod(ns, s, ram, hackRatio)
      )
    );
    hackRatio += 0.01;
  });
  ns.tprintf("%15s %15s %15s %15s %15s %15s %15s %15s %15s %15s", ...targets);
  for (let row of incomeTable) {
    ns.tprintf(
      "%15s %15s %15s %15s %15s %15s %15s %15s %15s %15s",
      ...row.map((s) => ns.nFormat(s ? s : 0, "($0.00 a)"))
    );
  }
  ns.tprint(getBestTarget(ns, servers, targets, ram));
}
