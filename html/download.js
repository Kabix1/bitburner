/** @param {NS} ns **/
export async function main(ns) {
  var baseUrl = "http:127.0.0.1:8080/";
  while (true) {
    await ns.wget(baseUrl + "files.json", "files.txt");
    var files = JSON.parse(ns.read("files.txt"));
    var fileNames = files.files;
    for (let f of fileNames) {
      await ns.wget(baseUrl + "code/" + f, f);
    }
    ns.exit();
  }
}
