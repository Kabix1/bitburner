/** @param {NS} ns **/

export async function main(ns) {
}

export function run(ns, script, numThreads=1, ...args) {
  let host = ns.getHostname();
  return exec(ns, script, host, numThreads, ...args);
}

export function exec(ns, script, host, numThreads=1, ...args) {
  let pid = ns.exec(script, host, numThreads, ...args);
  ns.print(JSON.stringify({
    time: ns.getTimeSinceLastAug(),
    pid: pid,
    ref: {fn: script, host: host, args: args}
  }))
  return pid;
}
