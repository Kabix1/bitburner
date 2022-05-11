/** @param {NS} ns **/

import {getServerList} from "worm.js";
import {exec} from "tools.js"

let rootedServers = [];
const threadCost = 1.75;

export async function main(ns) {
    ns.disableLog("ALL");
    var command = ns.args[0];
    if (command == "init") {
        refreshServerList(ns);
        return;
    }
    var port = ns.args[1];
    var threads = ns.args[2];
    var target = ns.args[3];
    var pid = run_command(ns, command, threads, target, uuidv4());
    await ns.writePort(port, JSON.stringify({type: "single", pid: pid}));
    if (pid == 0) {
        ns.printf("Failed to start script!");
        ns.print(ns.getScriptLogs());
        ns.print(rootedServers);
        ns.print(ns.getServerMaxRam("evil-16384GB-744c99d4-d871-4dc8-b51a-b5a80a5e97b1")- ns.getServerUsedRam("evil-16384GB-744c99d4-d871-4dc8-b51a-b5a80a5e97b1"));
    }
    refreshServerList(ns);
}

export function run_command(ns, command, threadsNeeded, target) {
    for (let server of rootedServers) {
        if (server["threads"] >= threadsNeeded) {
            server["threads"] -= threadsNeeded;
            return exec(ns, command, server["host"], threadsNeeded, target, uuidv4());
        }
    }
}

export function refreshServerList(ns) {
    var serverList = [];
    var servers = getServerList(ns).filter(ns.hasRootAccess).filter(x => getAvailableThreads(ns, x) > 0);
    servers = servers.filter(x => x != "home");
    for (let server of servers) {
        serverList.push({"host": server, "threads": getAvailableThreads(ns, server)});
    }
    serverList.sort((a, b) => a["threads"] - b["threads"])
    rootedServers = serverList;
}

export function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export function getAvailableThreads(ns, host) {
    return Math.floor((ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) / threadCost);
}
