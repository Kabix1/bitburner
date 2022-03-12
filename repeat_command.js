/** @param {NS} ns **/

export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getServerUsedRam");
	const period = ns.args[0];
	const command = ns.args[1];
	const threads = ns.args[2];
	const id = ns.args[3];
	const target = ns.args[4];
	var startTime = ns.getTimeSinceLastAug();
	var pid = 0;
	while (true) {
		ns.run("run_command.js", 1, command, threads, target, uuidv4());
		await ns.sleep(period);
	}
}

export function uuidv4() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
