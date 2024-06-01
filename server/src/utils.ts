import { DB } from "@seungpyo.hong/netpro-hw";
import fs from "fs";
import path from "path";

const dbPath = path.join(__dirname, "../../db.json");

export const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    const db = JSON.parse(data) as DB;
    return db;
  } catch (error) {
    console.error("Error reading database:", error);
    return null;
  }
};

export const writeDB = (data: DB) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), {
      flag: "w",
      encoding: "utf-8",
    });
  } catch (error) {
    console.error("Error writing to database:", error);
  }
};
