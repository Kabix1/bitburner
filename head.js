/** @param {NS} ns **/

import { getServerInfo } from "calc_income.js";
import { getServerList } from "worm.js";
import { run } from "tools.js"
import { findPeriod, getCollisions } from "calc_cycle_col.js"

export async function main(ns) {
    // TODO: Choose hack ratio based on maxThreads
    ns.disableLog("ALL");
    var hackRatio = 0.8;
    var servers = getServerList(ns).filter(x => x != "home");
    var server = servers.sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a))[0];
    var maxCost = Math.floor(ns.getServerMaxRam(server) / 1.75);
    var targetInfo = chooseTarget(ns, maxCost);
    var target = targetInfo["host"];
    target = "phantasy";
    // const server = "evil-1PB-a2b0e551-4c29-4e46-b66c-c84c7d675ea9";
    // const period = 2900;
    const taskSeperation = 200;
    var period = 2500;
    // var period = findPeriod(ns, target, taskSeperation);
    ns.tprint(getCollisions(ns, period, target, taskSeperation));
    // ns.exit();
    ns.tprint({
        time: ns.getTimeSinceLastAug(),
        target: target,
        period: period,
        sep: taskSeperation,
        ratio: hackRatio
    });
    ns.exit();
    var pid = run(ns, "cycle_controller.js", 1, target, 0, server, period, taskSeperation, 1);
    await waitForScript(ns, pid);
    pid = run(ns, "cycle_controller.js", 1, target, hackRatio, server, period, taskSeperation, 1);
    await waitForScript(ns, pid);
}

export async function waitForScript(ns, pid) {
    var script = ns.getRunningScript(pid);
    while (script != null) {
        await ns.sleep(1000);
        script = ns.getRunningScript(pid);
    }
}

export function chooseTarget(ns, maxCost) {
    var serverInfo = getServerInfo(ns, maxCost);
    serverInfo.sort((a, b) => b.income - a.income);
    return serverInfo[0];
}
