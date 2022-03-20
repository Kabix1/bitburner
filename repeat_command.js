/** @param {NS} ns **/

import {run} from "tools.js"

export async function main(ns) {
	ns.disableLog("ALL");
	const port = ns.args[0];
	const period = ns.args[1];
	const command = ns.args[2];
	const threads = ns.args[3];
	const id = ns.args[4];
	const target = ns.args[5];
	var startTime = ns.getTimeSinceLastAug();
	var pid = 0;
	while (true) {
		var args = [threads, target, uuidv4()];
		pid = run(ns, "run_command.js", 1, command, port, ...args);
		await ns.sleep(period);
	}
}

export function uuidv4() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}
