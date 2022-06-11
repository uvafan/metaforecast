import "dotenv/config";

import * as fs from "fs";

import { prisma } from "../database/prisma";

let main = async () => {
  let json = await prisma.pastcastQuestion.findMany({});
  let string = JSON.stringify(json, null, 2);
  let filename = "pastcasts.json";
  fs.writeFileSync(filename, string);
  console.log(`File downloaded to ./${filename}`);
};

main()
