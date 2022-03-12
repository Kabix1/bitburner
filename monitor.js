/** @param {NS} ns **/

let scriptRuntimes = [];
const timeRe = /(?<minutes>[0-9]+)?( minutes)? (?<seconds>[0-9\.]+) seconds \(t=(?<threads>[0-9,]+)\)/;

let cycles = [];

export async function main(ns) {
    var isHead = ns.args[0];
    if (isHead) {
        scriptRuntimes.push(ns.args[1]);
        scriptRuntimes.push(ns.args[2]);
        scriptRuntimes.push(ns.args[3]);
        scriptRuntimes.push(ns.args[4]);
        cycles = [];
        return;
    }
    var pid = ns.args[1];
    await getRuntimeFromLog(ns, pid);
}

export async function getRuntimeFromLog(ns, pid) {
    var script = ns.getRunningScript(pid);
    var log = script.logs;
    let match = timeRe.exec(log[0]);
    var seconds = Number(match.groups.seconds);
    var threads = Number(match.groups.threads.replace(",", ""));
    var minutes = 0;
    if (match.groups.minutes != undefined) {
        minutes = Number(match.groups.minutes);
    }
    var ms = Math.ceil((seconds + 60 * minutes) * 1000);
     if (!scriptRuntimes.includes(ms) && ! scriptRuntimes.includes(ms + 1)) {
         ns.tprintf("Wrong runtime!! %s not in list", ms);
         ns.tprint(scriptRuntimes);
     }
    var now = ns.getTimeSinceLastAug();
    var scriptEnd = now + ms - script.onlineRunningTime;
    if (cycles.length == 0 || cycles[cycles.length - 1].hasOwnProperty(threads)) {
        cycles.push({});
        cycles[cycles.length - 1][threads] = scriptEnd;
    } else {
        for (let cycle of cycles) {
            if (! cycle.hasOwnProperty(threads)) {
                cycle[threads] = scriptEnd;
                let size = Object.keys(cycle).length;
                if (size == 4) {
                    printCycle(ns, cycle);
                }
                break;
            }
        }
    }
}

export function printCycle(ns, cycle) {
    var endTimes = Object.values(cycle);
    endTimes.sort((a, b) => a - b);
    ns.tprint(endTimes);
    var endDiffs = endTimes.slice(1).map((item, index) => { return [item - endTimes[index]];});
    ns.tprint(cycle);
    ns.tprint(endDiffs);
}

export async function monitorScripts(ns) {
    while (true) {
        await ns.sleep(50);
    }
}
