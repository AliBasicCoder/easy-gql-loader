import { loader as webpackLoader } from "webpack";
import { parse } from "graphql/language";
import { isAbsolute } from "path";
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
  queryOrMutation: /(query|mutation)[ ]+(\w+)([^]+)/g,
  inputOrType: /(input|type)[ ]+(\w+)[ ]*\{([^}]+)\}/g,
  imports: /\#import[ ]+("|')([\w\/.]+)\1/g,
  fragments: /fragment[ ]+(\w+)[ ]+on[ ]+(\w+)\{([^]+)\}/,
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
    neededFragments?: string;
  }>;
  mutations: obj<{
    base?: string;
    neededFragments?: string;
  }>;
  subscriptions: obj<{
    base?: string;
    neededFragments?: string;
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

  ["mutations", "queries", "subscriptions"].forEach(
    // @ts-ignore
    (key: "mutations" | "queries" | "subscriptions") => {
      for (const objKey in dataObj[key]) {
        const elem = dataObj[key][objKey];
        if (!elem.base) continue;
        elem.neededFragments = elem.neededFragments || "";
        exec(elem.base, /\.\.\.(\w+)/g, (arr) => {
          elem.neededFragments += dataObj.fragments[arr[1]];
        });
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
  }
) {
  const { url, webSocketEndPoint, flat } = opts;
  let str = `var graphqlFetch = require('graphql-fetch')('${url}');
var queries = {};
var mutations = {};
var subscriptions = {};
  `;
  if (webSocketEndPoint) {
    str += `
try {
var swServer = require('subscriptions-transport-ws').SubscriptionClient;\n 
var swClient = new swServer("${webSocketEndPoint}", {
  reconnect: true
})
    `;
    for (const objKey in parsedData.subscriptions) {
      const elem = parsedData.subscriptions[objKey];
      if (!elem.base) continue;
      elem.neededFragments = elem.neededFragments || "";
      str += `
subscriptions["${objKey}"] = function(queryVars){
  return swClient.request({
    query: "${(elem.neededFragments + elem.base).replace(/\n/g, "\\n")}",
    variables: queryVars
  })
}`;
    }
    str += `} catch(err) { console.log(err); }`;
  }
  ["mutations", "queries"].forEach(
    // @ts-ignore
    (key: "mutations" | "queries") => {
      for (const objKey in parsedData[key]) {
        const elem = parsedData[key][objKey];
        if (!elem.base) continue;
        elem.neededFragments = elem.neededFragments || "";
        str += `
${key}["${objKey}"] = function(queryVars, opts){
  return graphqlFetch("${(elem.neededFragments + elem.base).replace(
    /\n/g,
    "\\n"
  )}", queryVars, opts)
}\n`;
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
