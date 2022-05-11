/** @param {NS} ns **/

import {findCollision} from "calc_cycle_col.js";

export function testFindCollision(ns) {
  var testResults = [
    [findCollision(ns, 10000, 100, [[200, 300]]), 2],
    [findCollision(ns, 1000, 1010, [[200, 300]]), 20],
    [findCollision(ns, 1000, 1100, [[900, 1000]]), 20],
    [findCollision(ns, 1000, 1500, [[200, 300]]), false],
    [findCollision(ns, 1000, 1000, [[200, 300]]), false],
    [findCollision(ns, 1000, 1250, [[700, 900]]), 3]
    ];
  testResults.forEach(x => { if(x[0] != x[1]) { ns.tprintf("Test failed! Expected %s got %s", x[1], x[0]) }});
}
