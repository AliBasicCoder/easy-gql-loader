import { loader as webpackLoader } from "webpack";
import { parse } from "graphql/language";
import { isAbsolute, join } from "path";
import { File } from "fs-pro";

function exec(
  str: string,
  regex: RegExp,
  callback: (arr: RegExpExecArray) => any
) {
  let arr;
  while ((arr = regex.exec(str)) !== null) {
    callback(arr);
  }
}

const regexs = {
  imports: /\#import[ ]+("|')([\w\/.]+)\1/g,
};

type obj<T> = {
  [key: string]: T;
};

type dataObject = {
  // inputs: obj<string>;
  // types: obj<string>;
  fragments: obj<string>;
  queries: obj<{
    base?: string;
    neededFragments?: string[];
  }>;
  mutations: obj<{
    base?: string;
    neededFragments?: string[];
  }>;
  subscriptions: obj<{
    base?: string;
    neededFragments?: string[];
  }>;
  file: {
    name: string;
    extension: string;
    base: string;
    root: string;
    path: string;
    directory: string;
    defaultContent?: string | Buffer | undefined;
  };
};

export function resolveStr(
  obj: {
    addDependency: (file: string) => any;
    emitError: (msg: string | Error) => any;
  },
  file: File
): string {
  let data = file.read().toString();
  data = data.replace(regexs.imports, (_, _1, path) => {
    const newFile = new File(isAbsolute(path) ? "" : file.directory, path);
    if (!newFile.exits()) obj.emitError("could not found file: " + path);
    obj.addDependency(newFile.path);
    return resolveStr(obj, newFile);
  });
  return data;
}

export function mainParser(
  obj: {
    addDependency: (file: string) => any;
    emitError: (msg: string | Error) => any;
  },
  file: File
) {
  if (!file.exits()) obj.emitError("could not found file: " + file.path);

  const data = resolveStr(obj, file);

  const dataObj: dataObject = {
    // inputs: {},
    // types: {},
    fragments: {},
    queries: {},
    mutations: {},
    subscriptions: {},
    file: { ...file },
  };

  const { definitions } = parse(data);

  for (const definition of definitions) {
    if (definition.kind === "OperationDefinition") {
      if (definition.operation === "subscription") {
        dataObj.subscriptions[definition.name?.value || ""] = {
          base: data.slice(definition.loc?.start, definition.loc?.end),
        };
        continue;
      }

      const key = definition.operation === "mutation" ? "mutations" : "queries";
      dataObj[key][definition.name?.value || ""] = {
        base: data.slice(definition.loc?.start, definition.loc?.end),
      };
    }
    if (definition.kind === "FragmentDefinition") {
      dataObj.fragments[definition.name.value] = data.slice(
        definition.loc?.start,
        definition.loc?.end
      );
    }
  }

  function getFragments(str: string) {
    const resArr: string[] = [];
    const includedFragments: obj<1> = {};
    exec(str, /\.\.\.(\w+)/g, (arr) => {
      if (includedFragments[arr[1]]) return;
      resArr.push(arr[1]);
      includedFragments[arr[1]] = 1;
      resArr.push(...getFragments(dataObj.fragments[arr[1]]));
    });
    return resArr;
  }

  ["mutations", "queries", "subscriptions"].forEach(
    // @ts-ignore
    (key: "mutations" | "queries" | "subscriptions") => {
      for (const objKey in dataObj[key]) {
        const { base } = dataObj[key][objKey];
        if (!base) continue;
        dataObj[key][objKey].neededFragments = getFragments(base);
      }
    }
  );

  return dataObj;
}

export function stringify(
  parsedData: dataObject,
  opts: {
    url: string;
    webSocketEndPoint: string;
    flat: boolean;
    client: string;
  }
) {
  const { url, webSocketEndPoint, flat, client } = opts;
  const config = JSON.stringify({ url, webSocketEndPoint });
  let str = `var client = require('${client}')(${config});
var queries = {};
var mutations = {};
var subscriptions = {};
var parsedData = ${JSON.stringify(parsedData)};
function request(key, objKey, type, vars, opts){
  var query = "";
  query += parsedData[key][objKey].neededFragments.map(function(key){ return parsedData.fragments[key] });
  query += parsedData[key][objKey].base;
  return client(type, query, vars, opts);
}\n`;
  ["mutations", "queries", "subscriptions"].forEach(
    // @ts-ignore
    (key: "mutations" | "queries" | "subscriptions") => {
      for (const objKey in parsedData[key]) {
        const elem = parsedData[key][objKey];
        if (!elem.base || !elem.neededFragments) continue;
        str += `${key}["${objKey}"] = function(vars, opts){ return request("${key}", "${objKey}", "${
          key === "queries" ? "query" : key.slice(0, -1)
        }", vars, opts) }\n`;
      }
    }
  );
  if (flat)
    str += `module.exports = { ...queries, ...mutations, ...subscriptions };`;
  else str += `module.exports = { queries, mutations, subscriptions }`;
  return str;
}

function loader(this: webpackLoader.LoaderContext) {
  this.cacheable();
  const options = Object.assign(
    {},
    {
      url: "/graphql",
      flat: false,
      client: join(__dirname, "../src/defaultClient"),
    },
    this.loaders[this.loaderIndex].options || {}
  );
  let parsedData: dataObject = mainParser(
    {
      addDependency: (file) => this.addDependency(file),
      emitError: (err) => this.emitError(err),
    },
    new File(this.resourcePath)
  );
  return stringify(parsedData, options);
}

function normal() {}

loader.normal = normal;

module.exports = loader;
