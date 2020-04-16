import * as data from "./gql/test.gql";

if (typeof window !== "undefined") {
  window["client"] = data;
}

export { data };
