import "dotenv/config";

import * as fs from "fs";

import { prisma } from "../database/prisma";

let main = async () => {
  let json = await prisma.pastcastQuestion.findMany({});
  let string = JSON.stringify(json, null, 2);
  let filename = "pastcasts.json";
  fs.writeFileSync(filename, string);
  console.log(`Pastcasts downloaded to ./${filename}`);

  let cjson = await prisma.comment.findMany({});
  let cstring = JSON.stringify(cjson, null, 2);
  let cfilename = "comments.json";
  fs.writeFileSync(cfilename, cstring);
  console.log(`Pastcasts downloaded to ./${cfilename}`);
};

main()
