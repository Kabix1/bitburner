/** @param {NS} ns **/

import {prepareServers} from "worm.js";
import {exec, run} from "tools.js"

export async function main(ns) {
    const [target, hackRatio, startServer, period, taskSeperation, port] = ns.args;
    ns.clearPort(port);
    ns.disableLog("sleep");
    await ns.scp("single_hack.js", startServer);
    await ns.scp("single_weaken.js", startServer);
    await ns.scp("single_grow.js", startServer);
    var actionList = [];

    await prepareServers(ns);

    if (hackRatio == 0) {
        await weakenTarget(ns, startServer, target);
        await growTarget(ns, startServer, target);
        await weakenTarget(ns, startServer, target);
        ns.exit();
    }

    var threadsNeeded = await getCycleThreads(ns, target, hackRatio);

    let player = ns.getPlayer();
    let targetServer = ns.getServer(target);

    var hackTime = Math.round(ns.getHackTime(target));
    var weakenTime = Math.round(ns.getWeakenTime(target));
    var growTime = Math.round(ns.getGrowTime(target));

    // Initialize scripts
    run(ns, "run_command.js", 1, "init", uuidv4());
    // run(ns, "monitor.js", 1, true, hackTime, weakenTime, growTime, weakenTime);

    // Create a plan for scripts running order
    actionList.push(["single_hack.js", hackTime, threadsNeeded["hack"]]);
    actionList.push(["single_weaken.js", weakenTime - taskSeperation, threadsNeeded["weaken1"]]);
    actionList.push(["single_grow.js", growTime - 2 * taskSeperation, threadsNeeded["grow"]]);
    actionList.push(["single_weaken.js", weakenTime - 3 * taskSeperation, threadsNeeded["weaken2"]]);

    // actionList.push(["single_weaken.js", weakenTime, 1]);
    // actionList.push(["single_weaken.js", weakenTime - taskSeperation, 2]);
    // actionList.push(["single_weaken.js", weakenTime - 2 * taskSeperation, 3]);
    // actionList.push(["single_weaken.js", weakenTime - 3 * taskSeperation, 4]);

    actionList.sort((a, b) => b[1] - a[1]);
    var runTable = [[actionList[0][0], 0, threadsNeeded["weaken1"]]];
    runTable = runTable.concat(actionList.slice(1).map((item, index) => { return [item[0], actionList[index][1] - item[1], item[2]]; }));
    var pids = [];
    run(ns, "monitor.js", 1, false, port);
    for (let command of runTable) {
        await ns.sleep(command[1]);
        pids.push(run(ns, "repeat_command.js", 1, port, period, command[0], command[2], uuidv4(), target));
        await ns.writePort(port, JSON.stringify({type: "repeater", pid: pids[pids.length - 1]}));
    }
    await ns.sleep(3 * (hackTime + growTime + 2 * weakenTime));
    for (let pid of pids) {
        var income = ns.getScriptIncome(pid);
        if (income > 0) {
            ns.tprint("Income: " + ns.getScriptIncome(pid));
            ns.print("Income: " + ns.getScriptIncome(pid));
        }
        ns.kill(pid);
    }
    ns.exit();
}


export async function run_command(ns, task, server, target) {
    const minSecurity = ns.getServerMinSecurityLevel(target);
    var security = ns.getServerSecurityLevel(target);
    var waitTime = 0;
    task[0](ns, server, target, task[2]);
    return waitTime;
}

export async function getCycleThreads(ns, target, hackRatio) {
    var threadCount = {};
    if (ns.fileExists("Formulas.exe")) {
        var targetServer = ns.getServer(target);
        var player = ns.getPlayer();
        targetServer.moneyAvailable = targetServer.moneyMax;
        threadCount["hack"] = "test";
        threadCount["hack"] = Math.max(Math.floor(hackRatio / ns.formulas.hacking.hackPercent(targetServer, player)), 1);
        targetServer.moneyAvailable -= targetServer.moneyAvailable * ns.formulas.hacking.hackPercent(targetServer, player) * threadCount["hack"];
        var moneyGrow = targetServer.moneyMax - targetServer.moneyAvailable;
        threadCount["grow"] = Math.ceil(moneyGrow / (targetServer.moneyAvailable * (ns.formulas.hacking.growPercent(targetServer, 1, player) - 1)));
        threadCount["weaken1"] = Math.ceil(ns.hackAnalyzeSecurity(threadCount["hack"]) / ns.weakenAnalyze(1));
        threadCount["weaken2"] = Math.ceil(ns.growthAnalyzeSecurity(threadCount["grow"]) / ns.weakenAnalyze(1));
        return threadCount;
    } else {
        threadCount["hack"] = await hackTarget(ns, server, target, hackRatio);
        threadCount["weaken1"] = await weakenTarget(ns, server, target);
        threadCount["grow"] = await growTarget(ns, server, target);
        threadCount["weaken2"] = await weakenTarget(ns, server, target);
    }
}

export function getIncome(ns, threadUsage, startTime, target, hackRatio) {
    var income = ns.getScriptIncome("hackCycle.js", "home", target, hackRatio);
    var currTime = ns.getTimeSinceLastAug();
    var earnedPerThread = income * (currTime - startTime) / threadUsage;
    ns.tprint("Hack Ratio: " + hackRatio + " Income: " + ns.nFormat(income, "0,0.0a$") + "/s " + " Income per thread: " + ns.nFormat(earnedPerThread, "0,0.0a$") + "/Ths");
}

export function growExec(ns, server, target, threads) {
    return exec(ns, "single_grow.js", server, threads, target, uuidv4());
}

export function weakenExec(ns, server, target, threads) {
    return exec(ns, "single_weaken.js", server, threads, target, uuidv4());
}

export function hackExec(ns, server, target, threads) {
    return exec(ns, "single_hack.js", server, threads, target, uuidv4());
}

export async function growTarget(ns, server, target) {
    var maxMoney = ns.getServerMaxMoney(target);
    var currMoney = ns.getServerMoneyAvailable(target);
    var threadsNeeded = Math.floor(ns.growthAnalyze(target, maxMoney / currMoney));
    var time = 0;
    if (threadsNeeded > 0) {
        time = ns.getGrowTime(target);
        var pid = exec(ns, "single_grow.js", server, threadsNeeded, target);
        await waitForScript(ns, pid);
    }
    return threadsNeeded;
}

export async function weakenTarget(ns, server, target) {
    var minSecurity = ns.getServerMinSecurityLevel(target);
    var currSecurity = ns.getServerSecurityLevel(target);
    var threadsNeeded = Math.ceil((currSecurity - minSecurity) / ns.weakenAnalyze(1));
    var time = ns.getWeakenTime(target);
    if (threadsNeeded > 0) {
        var pid = exec(ns, "single_weaken.js", server, threadsNeeded, target);
        await waitForScript(ns, pid);
    }
    return threadsNeeded;
}

export async function hackTarget(ns, server, target, hackRatio) {
    var currMoney = ns.getServerMoneyAvailable(target);
    var startingMoney = ns.getServerMoneyAvailable(target);
    var threadsNeeded = Math.floor(hackRatio / ns.hackAnalyze(target));
    var time = 0;
    var loops = 1;
    time = ns.getHackTime(target);
    var pid = exec(ns, "single_hack.js", server, threadsNeeded, target);
    await waitForScript(ns, pid);
    currMoney = ns.getServerMoneyAvailable(target);
    return threadsNeeded;
}

export async function waitForScript(ns, pid) {
    await ns.sleep(100);
    var script = ns.getRunningScript(pid);
    while (script != null) {
        await ns.sleep(100);
        script = ns.getRunningScript(pid);
    }
}

export function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
