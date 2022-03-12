/** @param {NS} ns **/

import {getServerList} from "worm.js";

let rootedServers = [];
const threadCost = 1.7;

export async function main(ns) {
    var command = ns.args[0];
    if (command == "init") {
        refreshServerList(ns);
        return;
    }
    var threads = ns.args[1];
    var target = ns.args[2];
    var pid = run_command(ns, command, threads, target, uuidv4());
    refreshServerList(ns);
    ns.run("monitor.js", 1, false, pid);
}

export function run_command(ns, command, threadsNeeded, target) {
    for (let server of rootedServers) {
        if (server["threads"] >= threadsNeeded) {
            ns.printf("Running %s on %s with %s threads", command, server["host"], threadsNeeded);
            server["threads"] -= threadsNeeded;
            return ns.exec(command, server["host"], threadsNeeded, target, uuidv4());
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
