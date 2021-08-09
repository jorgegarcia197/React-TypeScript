import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

const fileCache = localForage.createInstance({
  name: "filecache",
});

export const fetchPlugin = (inputCode:string) => {
    return {
        name: 'fetch-plugins',
        setup(build: esbuild.PluginBuild) {
            build.onLoad({ filter: /.*/ }, async (args: any) => {
            console.log("onLoad", args);
    
            if (args.path === "index.js") {
              return {
                loader: "jsx",
                contents: inputCode,
              };
            }
            // * Check to see if we have already fetched this file
            // * if true, return the cached version
    
            const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
              args.path
            );
            if (cachedResult) {
              return cachedResult;
            }
    
            const { data, request } = await axios.get(args.path);
            // * If not, fetch it and cache it
            const fileType = args.path.match(/\.css$/) ? "css" : "jsx";

            const contents = fileType === "css" ? 
                `
                const style = document.createElement("style");
                style.innerText = 'body { background-color: "red"}';
                document.head.appendChild(style);
                `: data

            const result: esbuild.OnLoadResult = {
              loader:"jsx",
              contents,
              resolveDir: new URL("./", request.responseURL).pathname,
            };
            await fileCache.setItem(args.path, result);
    
            return result;
          }); }
    }
}

