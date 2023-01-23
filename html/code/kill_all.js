/** @param {NS} ns **/

import {getServerList} from "worm.js";

export function main(ns) {
    let hosts = getServerList(ns).filter(x => x != "home");
    for (let host of hosts) {
        ns.killall(host);
    }
  ns.scriptKill("head.js", "home");
  ns.scriptKill("cycle_controller.js", "home");
  ns.scriptKill("repeat_command.js", "home");
  ns.scriptKill("monitor.js", "home");
}
