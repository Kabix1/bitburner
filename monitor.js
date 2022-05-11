/** @param {NS} ns **/

const timeRe = /(?<minutes>[0-9]+)?( minutes)? (?<seconds>[0-9\.]+) seconds \(t=(?<threads>[0-9,]+)\)/;

export async function main(ns) {
    ns.disableLog("ALL");
    const [isHead, port] = ns.args;
    var countActivations = {};
    let scriptRuntimes = {};
    var pids = [];
    while(true) {
        let data = ns.readPort(port);
        var singlePid = 0;
        if(data == "NULL PORT DATA") {
            await ns.sleep(200);
            continue;
        }
        data = JSON.parse(data);
        if(data.type == "single") {
            singlePid = data.pid;
        } else if(data.type == "repeater") {
            pids.push(data.pid);
            continue;
        }
        var log = await waitForLogs(ns, singlePid);
        let script = ns.getRunningScript(singlePid);
        let sig = createScriptSignature(script);
        let runtime = getRuntimeFromLog(log[0]);
        if(! scriptRuntimes.hasOwnProperty(sig)) {
            scriptRuntimes[sig] = runtime;
            countActivations[sig] = 1;
            ns.print(scriptRuntimes);
        } else if (scriptRuntimes[sig] != runtime)  {
            ns.print(countActivations);
            ns.printf("Wrong runtime!!  %s, %s Have to kill this run", runtime, sig);
            pids.forEach(x => ns.kill(x));
            ns.exit();
        } else {
            countActivations[sig]++;
        }
    }
}

export function createScriptSignature(script) {
    return script.filename + ":" + script.threads;
}

export function getLogs(ns, ref) {
    return ns.getScriptLogs(ref.fn, ref.host, ...ref.args);
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
}
