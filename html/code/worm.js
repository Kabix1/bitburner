/** @param {NS} ns **/

export async function main(ns) {
  var start = "home";
  ns.tprint(getServerList(ns));
  await prepareServers(ns);
}

export function getServerList(ns) {
  return scanAll(ns, "home", "");
}

export function scanAll(ns, node, parent) {
  var serverList = [node];
  var adjServers = ns.scan(node).filter((host) => host != parent);

  for (var j = 0; j < adjServers.length; j++) {
    var nextHop = adjServers[j];
    if (!ns.hasRootAccess(nextHop)) {
      getRoot(ns, nextHop);
    }
    serverList = serverList.concat(scanAll(ns, nextHop, node));
  }
  return serverList;
}

export async function prepareServers(
  ns,
  scripts = ["single_weaken.js", "single_hack.js", "single_grow.js"]
) {
  var serverList = getServerList(ns);
  for (let server of serverList) {
    await ns.scp(scripts, server);
  }
}

export function getRoot(ns, target) {
  var hackLevel = ns.getHackingLevel();
  var requiredLevel = ns.getServerRequiredHackingLevel(target);
  if (hackLevel < requiredLevel) return;
  let openedPorts = 0;
  if (ns.fileExists("BruteSSH.exe", "home")) {
    ns.brutessh(target);
    openedPorts += 1;
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    ns.ftpcrack(target);
    openedPorts += 1;
  }
  if (ns.fileExists("relaySMTP.exe", "home")) {
    ns.relaysmtp(target);
    openedPorts += 1;
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    ns.httpworm(target);
    openedPorts += 1;
  }
  if (ns.fileExists("SQLInject.exe", "home")) {
    ns.sqlinject(target);
    openedPorts += 1;
  }
  if (openedPorts < ns.getServerNumPortsRequired(target)) {
    return;
  }
  ns.nuke(target);
}
