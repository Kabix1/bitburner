/** @param {NS} ns **/

export async function main(ns) {
    var hackRatio = 0.8;
    var target = "phantasy";
    const server = "evil-1PB-a2b0e551-4c29-4e46-b66c-c84c7d675ea9";
    ns.disableLog("sleep");
    var pid = ns.exec("cycle_controller.js", "home", 1, target, 0, server);
    waitForScript(ns, pid);
    pid = ns.exec("cycle_controller.js", "home", 1, target, hackRatio, server);
    await waitForScript(ns, pid);
}

export async function waitForScript(ns, pid) {
    var script = ns.getRunningScript(pid);
    while (script != null) {
        await ns.sleep(1000);
        script = ns.getRunningScript(pid);
    }
}

export async function monitorServer(ns, server, pid) {
    var script = ns.getRunningScript(pid);
    var pidsOnServer = new Set();
    while (script != null) {
        script = ns.getRunningScript(pid);
        var ps = ns.ps(server);
        for (let script of ps) {
            if (!pidsOnServer.has(script.pid)) {
                ns.tprint(ns.getRunningScript(script.pid).logs);
                pidsOnServer.add(script.pid);
            }
        }
        await ns.sleep(100);
    }
}
