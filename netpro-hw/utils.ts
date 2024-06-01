import { Protocol } from "./types";
import { v4 as uuidv4 } from "uuid";

export const uuid = (): string => {
  return uuidv4();
};

export const errorOf = (object: any): Protocol.ErrorResponse | null => {
  return object?.statusCode && object?.message
    ? (object as Protocol.ErrorResponse)
    : null;
};
