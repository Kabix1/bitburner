/** @param {NS} ns **/

const timeRe = /(?<minutes>[0-9]+)?( minutes)? (?<seconds>[0-9\.]+) seconds \(t=(?<threads>[0-9,]+)\)/;

export async function main(ns) {
    ns.disableLog("ALL");
    const [isHead, port, ...pids] = ns.args;
    let scriptRuntimes = {};
    while(true) {
        var singlePid = ns.readPort(port);
        if(singlePid == "NULL PORT DATA") {
            await ns.sleep(200);
            continue;
        }
        var log = await waitForLogs(ns, singlePid);
        let script = ns.getRunningScript(singlePid);
        let sig = createScriptSignature(script);
        let runtime = getRuntimeFromLog(log[0]);
        if(! scriptRuntimes.hasOwnProperty(sig)) {
            scriptRuntimes[sig] = runtime;
            ns.print(scriptRuntimes);
        } else if (scriptRuntimes[sig] != runtime)  {
            ns.printf("Wrong runtime!!  %s, %s Have to kill this run", runtime, sig);
            pids.forEach(x => ns.kill(x));
            ns.exit();
        }
    }
}

export function createScriptSignature(script) {
    return script.filename + ":" + script.threads;
}

export function getRefOfRunningScript(ns, pid) {
    var script = ns.getRunningScript(pid);
    var ref = {fn: script.filename,
               host: script.server,
               args: script.args};
    return ref;
}

export function getRefsFromLogs(logs) {
    return logs.map(x => JSON.parse(x).ref);
}

export function getLogs(ns, ref) {
    return ns.getScriptLogs(ref.fn, ref.host, ...ref.args);
}

export function getStartedCommands(ns, pid) {
    var logs = ns.getRunningScript(pid).logs.map(JSON.parse);
    ns.tprintf("%s, %s, %s", pid, logs[0].args[1], logs[0].pid);
    var pids = logs.map(x => x.pid);
    return pids;
}

export async function waitForLogs(ns, pid) {
    var attemptCounter = 0;
    var script = ns.getRunningScript(pid);
    while(script == null) {
        if(attemptCounter >= 5) {
            ns.tprintf("Script with pid %s never started", pid);
            return;
        }
        await ns.sleep(200);
        attemptCounter += 1;
        script = ns.getRunningScript(pid);
    }
    var log = script.logs;
    attemptCounter = 0;
    while(log[0] == undefined) {
        if(attemptCounter >= 5) {
            ns.tprintf("Script with pid %s has undefined log", pid);
            return;
        }
        attemptCounter += 1;
        await ns.sleep(200);
        script = ns.getRunningScript(pid);
        log = script.logs;
    }
    return log;
}

export function getRuntimeFromLog(log) {
    let match = timeRe.exec(log);
    if (match == undefined) {
        ns.tprintf("!!!! Script has log %s !!!!", log);
        return;
    }
    var seconds = Number(match.groups.seconds);
    var threads = Number(match.groups.threads.replace(",", ""));
    var minutes = 0;
    if (match.groups.minutes != undefined) {
        minutes = Number(match.groups.minutes);
    }
    var runtime = Math.ceil((seconds + 60 * minutes) * 1000);
    return runtime;
    // var scriptEnd = now + ms - 1000 * script.onlineRunningTime;
    // // ns.tprintf("%s: Time: %s, Script running time: %s Script ending time: %s", threads, now, script.onlineRunningTime, scriptEnd);
    //  if (!scriptRuntimes.includes(ms) && ! scriptRuntimes.includes(ms + 1)) {
    //      ns.tprintf("Wrong runtime!! %s not in list", ms);
    //      ns.tprint(scriptRuntimes);
    //  }
    // if (cycles.length == 0 || cycles[cycles.length - 1].hasOwnProperty(threads)) {
    //     cycles.push({});
    //     cycles[cycles.length - 1][threads] = scriptEnd;
    // } else {
    //     for (let cycle of cycles) {
    //         if (! cycle.hasOwnProperty(threads)) {
    //             cycle[threads] = scriptEnd;
    //             let size = Object.keys(cycle).length;
    //             if (size == 4) {
    //                 printCycle(ns, cycle);
    //             }
    //             break;
    //         }
    //     }
    // }
}

export function printCycle(ns, cycle) {
    var endTimes = Object.values(cycle);
    endTimes.sort((a, b) => a - b);
//    ns.tprint(endTimes);
    var endDiffs = endTimes.slice(1).map((item, index) => { return [item - endTimes[index]];});
//    ns.tprint(cycle);
    ns.tprint(endDiffs);
}

export async function monitorScripts(ns) {
    while (true) {
        await ns.sleep(50);
    }
}
