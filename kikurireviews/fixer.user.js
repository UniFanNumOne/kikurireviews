// ==UserScript==
// @name         Temporary File Garden Fixer
// @namespace    https://filegarden.com/
// @version      1.0.3
// @description  Temporarily fixes most broken file.garden links.
// @author       File Garden
// @match        *://*/*
// @icon         https://filegarden.com/favicon.ico
// @grant        none
// @downloadURL  https://temporary-file-garden.link/fixer.user.js
// @updateURL    https://temporary-file-garden.link/fixer.user.js
// ==/UserScript==

(function () {
  "use strict";

  const ORIGINAL_URL_PATTERN = /\/\/file\.garden/gi;

  function replaceUrl(url) {
    return (
      url &&
      url
        .toString()
        .replace(ORIGINAL_URL_PATTERN, "//temporary-file-garden.link")
    );
  }

  const initialXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    return initialXhrOpen.apply(this, [method, replaceUrl(url), ...args]);
  };

  const initialFetch = window.fetch;
  window.fetch = function (url, ...args) {
    return initialFetch(replaceUrl(url), ...args);
  };

  const initialSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    initialSetAttribute.apply(this, [name, replaceUrl(value)]);
  };

  const srcProperty = {
    set(value) {
      this.setAttribute("src", value);
    },
    get() {
      return this.getAttribute("src");
    },
  };
  const hrefProperty = {
    set(value) {
      this.setAttribute("href", value);
    },
    get() {
      return this.getAttribute("href");
    },
  };

  for (const key of Object.getOwnPropertyNames(window)) {
    try {
      const value = window[key];
      if (typeof value === "function" && value.prototype instanceof Element) {
        Object.defineProperty(value.prototype, "src", srcProperty);
        Object.defineProperty(value.prototype, "href", hrefProperty);
      }
    } catch {}
  }

  function fixElement(element) {
    if (
      typeof element.src === "string" &&
      ORIGINAL_URL_PATTERN.test(element.src)
    ) {
      element.src = element.src;
    }

    if (
      typeof element.href === "string" &&
      ORIGINAL_URL_PATTERN.test(element.href)
    ) {
      element.href = element.href;
    }

    const elementStyle = element.getAttribute("style");
    if (
      typeof elementStyle === "string" &&
      ORIGINAL_URL_PATTERN.test(elementStyle)
    ) {
      element.style = replaceUrl(element.getAttribute("style"));
    }
  }

  for (const element of document.getElementsByTagName("*")) {
    fixElement(element);
  }

  const observer = new MutationObserver(function (records) {
    for (const record of records) {
      if (record.target) {
        fixElement(record.target);
      }

      if (record.addedNodes) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          fixElement(node);
          for (const subNode of node.querySelectorAll("*")) {
            fixElement(subNode);
          }
        }
      }
    }
  });
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
  });

  function fixStyleElement(styleElement) {
    if (ORIGINAL_URL_PATTERN.test(styleElement.textContent)) {
      styleElement.textContent = replaceUrl(styleElement.textContent);
    }
  }

  for (const element of document.getElementsByTagName("style")) {
    fixStyleElement(element);
  }

  const styleObserver = new MutationObserver(function (records) {
    for (const record of records) {
      if (record.target?.parentNode instanceof HTMLStyleElement) {
        fixStyleElement(record.target.parentNode);
      }

      if (record.addedNodes) {
        if (record.target instanceof HTMLStyleElement) {
          fixStyleElement(record.target);
        }

        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (node instanceof HTMLStyleElement) {
            fixStyleElement(node);
          } else {
            for (const subNode of node.querySelectorAll("*")) {
              if (subNode instanceof HTMLStyleElement) {
                fixStyleElement(subNode);
              }
            }
          }
        }
      }
    }
  });
  styleObserver.observe(document, {
    subtree: true,
    childList: true,
    characterData: true,
  });
})();
