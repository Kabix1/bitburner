/** @param {NS} ns **/

import * as worm from "worm.js";

export async function main(ns) {
    var hosts = worm.getServerList(ns);
    var hackRatio = 0.05;
    var period = 0;
    const minPeriod = 4000;
    const money = ns.getServerMoneyAvailable("home");
    const scriptSize = ns.getScriptRam("single_hack.js");
    var maxRam = Math.min(ns.getPurchasedServerMaxRam(), getMaxServerSize(money));
    const maxThreads = maxRam / scriptSize;
    var player = ns.getPlayer();
    const filename = "server_info.txt";
    player.hacking = 1;
    ns.tprint("Max threads: " + ns.nFormat(maxThreads, "0,0.0a"));
    var serverInfo = [];
    for (let hack = 1; hack < 100; hack++) {
        player.hacking = hack;
        serverInfo = serverInfo.concat(calcServerInfo(ns, player, maxThreads));
        // var formattedString = ns.sprintf(outputString, host, ns.nFormat(incomePerThread, "0,0.00a"), ns.tFormat(cycleTime), ns.nFormat(threadUsage, "0,0.0a"), ns.nFormat(income, "0,0.0a"));
    }
    serverInfo.sort((a, b) => b.income - a.income);
    await ns.write(filename, JSON.stringify(serverInfo), "w");
    for (let hack = 1; hack < 95; hack += 5){
        var serverInfoHack = serverInfo.filter((x) => x.hack == hack);
        for (let i = 0; i < 5; i++) {
            ns.tprint(serverInfoHack[i]);
        }
    }
}

export function getServerInfo(ns, maxThreads) {
    var player = ns.getPlayer();
    if (ns.fileExists("Formulas.exe")) {
        return calcServerInfo(ns, player, maxThreads);
    } else {
        return readServerInfo(ns, player.hacking, maxThreads);
    }
}

export function calcServerInfo(ns, player, maxThreads) {
    var hosts = worm.getServerList(ns);
    var hackRatio = 0.05;
    var serverInfo = [];
    var period = 0;
    const minPeriod = 4000;
    for(let host of hosts) {
        var server = ns.getServer(host);
        if(server.moneyMax <= 0 || server.requiredHackingSkill > player.hacking) {
            continue;
        }
        server.hackDifficulty = server.minDifficulty;
        server.moneyAvailable = server.moneyMax;
        var threads = getCycleThreads(ns, server, player, hackRatio);
        var cycleTime = calcCycleTime(ns, server, player);
        var cycleThreadCount = Object.values(threads).reduce((a, b) => a + b);
        period = calcPeriod(maxThreads, minPeriod, cycleThreadCount, cycleTime);
        var threadUsage = calcThreadUsage(cycleThreadCount, cycleTime, period);
        var hackProb = ns.formulas.hacking.hackChance(server, player);
        var income = calcIncome(server.moneyMax, server.minDifficulty, hackRatio, period);
        var incomePerThread = income / threadUsage;
        serverInfo.push({"hack": player.hacking, "host": host, "income": incomePerThread, "threads": threadUsage});
    }
    return serverInfo;
}

export function readServerInfo(ns, hack, maxThreads) {
    var serverInfo = JSON.parse(ns.read("server_info.txt"));
    return serverInfo.filter((x) => x.hacking < hack && x.threads < maxThreads);
}

export function getCycleThreads(ns, targetServer, player, hackRatio) {
    var threadCount = {};
    targetServer.moneyAvailable = targetServer.moneyMax;
    threadCount["hack"] = Math.max(Math.floor(hackRatio / ns.formulas.hacking.hackPercent(targetServer, player)), 1);
    targetServer.moneyAvailable -= targetServer.moneyAvailable * ns.formulas.hacking.hackPercent(targetServer, player) * threadCount["hack"];
    var moneyGrow = targetServer.moneyMax - targetServer.moneyAvailable;
    threadCount["grow"] = Math.ceil(moneyGrow / (targetServer.moneyAvailable * (ns.formulas.hacking.growPercent(targetServer, 1, player) - 1)));
    threadCount["weaken1"] = Math.ceil(ns.hackAnalyzeSecurity(threadCount["hack"]) / ns.weakenAnalyze(1));
    threadCount["weaken2"] = Math.ceil(ns.growthAnalyzeSecurity(threadCount["grow"]) / ns.weakenAnalyze(1));
    targetServer.moneyAvailable = targetServer.moneyMax;
    // ns.print("Thread count: " + threadCount);
    return threadCount;
}

export function calcCycleTime(ns, targetServer, player) {
    var times = [];
    times.push(ns.formulas.hacking.hackTime(targetServer, player));
    times.push(ns.formulas.hacking.weakenTime(targetServer, player));
    times.push(ns.formulas.hacking.growTime(targetServer, player));
    times.push(ns.formulas.hacking.weakenTime(targetServer, player));
    // ns.print("Cycle time: " + totalTime);
    return Math.max(...times);
}

export function calcPeriod(maxThreads, minPeriod, cycleThreadCount, cycleTime) {
    var period = Math.max(minPeriod, cycleTime * cycleThreadCount / maxThreads);
    return period;
}

export function calcThreadUsage(cycleThreadCount, cycleTime, period) {
    var threadUsage = cycleThreadCount * cycleTime / period;
    return threadUsage;
}

export function calcIncome(moneyMax, hackProb, hackRatio, period) {
    var income = 1000 * hackProb * moneyMax * hackRatio / period;
    return income;
}

export function getMaxServerSize(maxCost) {
    const baseCost = 110000;
    if (maxCost < baseCost) {
        return 0;
    }
    return 2 * Math.pow(2, Math.floor(Math.log2(Math.floor(maxCost / baseCost))));
}
