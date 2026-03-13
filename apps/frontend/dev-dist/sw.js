/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-a4b5d8d7'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "/index.html",
    "revision": "0.m23hsvaqrpg"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    allowlist: [/^\/$/]
  }));
  workbox.registerRoute(({
    request
  }) => request.mode === "navigate", new workbox.NetworkFirst({
    "cacheName": "pages-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 40,
      maxAgeSeconds: 604800
    })]
  }), 'GET');
  workbox.registerRoute(({
    request,
    url
  }) => request.method === "GET" && url.pathname.startsWith("/api/materials"), new workbox.StaleWhileRevalidate({
    "cacheName": "marketplace-api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 60,
      maxAgeSeconds: 1800
    })]
  }), 'GET');
  workbox.registerRoute(({
    request,
    url
  }) => request.method === "GET" && url.pathname.startsWith("/api/diy"), new workbox.StaleWhileRevalidate({
    "cacheName": "diy-api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 60,
      maxAgeSeconds: 1800
    })]
  }), 'GET');
  workbox.registerRoute(({
    request,
    url
  }) => request.method === "GET" && (url.pathname.startsWith("/api/achievements") || url.pathname.startsWith("/api/reputation") || url.pathname.startsWith("/api/orders/my-orders")), new workbox.NetworkFirst({
    "cacheName": "dashboard-api-cache",
    "networkTimeoutSeconds": 4,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 40,
      maxAgeSeconds: 900
    })]
  }), 'GET');
  workbox.registerRoute(({
    request
  }) => request.destination === "image", new workbox.CacheFirst({
    "cacheName": "image-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(({
    request
  }) => ["script", "style", "font"].includes(request.destination), new workbox.StaleWhileRevalidate({
    "cacheName": "asset-cache",
    plugins: []
  }), 'GET');
  workbox.registerRoute(({
    url
  }) => url.pathname.endsWith(".glb"), new workbox.CacheFirst({
    "cacheName": "glb-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 12,
      maxAgeSeconds: 1209600
    })]
  }), 'GET');

}));
