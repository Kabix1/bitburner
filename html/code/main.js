/** @param {NS} ns **/

import {run} from "tools.js";
import {testFindCollision} from "tests.js";

export async function main(ns) {
  ns.tprint("New run! Killing all currently running scripts");
  run(ns, "kill_all.js");
  await ns.sleep(1000);
  ns.tprint("New run starting...");
 //  ns.run(ns, "calc_cycle_col.js");
  testFindCollision(ns);
  // run(ns, "head.js");
  // ns.run(ns, "calc_income.js");
}
