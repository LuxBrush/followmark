/**
 * Utility functions for checking types, existence, and retrieving DOM elements.
 * @module Check
 */
export const Check = {
  /**
   * Checks if an object, array, or string is empty.
   */
  isEmpty: {
    /**
     * Checks if an object is empty.
     * @param {object} ob - The object to check.
     * @returns {boolean} True if the object has no keys.
     * @throws {Error} If input is not an object.
     */
    object(ob: object): boolean {
      if (Check.isObject(ob) === false) {
        console.log(ob);
        throw new Error("isEmpty.object() input is not an Object.");
      }
      return Object.keys(ob).length === 0;
    },
    /**
     * Checks if an array is empty.
     * @param {any[]} array - The array to check.
     * @returns {boolean} True if the array has no elements.
     * @throws {Error} If input is not an array.
     */
    array(array: any[]): boolean {
      if (Check.isArray(array) === false) {
        console.log(array);
        throw new Error("isEmpty.array() input is not an Array.");
      }
      return array.length === 0;
    },
    /**
     * Checks if a string is empty.
     * @param {string} string - The string to check.
     * @returns {boolean} True if the string has no characters.
     * @throws {Error} If input is not a string.
     */
    string(string: string): boolean {
      if (Check.isTypeOf(string, "string") === false) {
        throw new Error("isEmpty.string() input is not a string.");
      }
      return string.length === 0;
    },
  },
  /**
   * Checks if an item is an object (but not an array).
   * @param {*} item - The item to check.
   * @returns {boolean} True if the item is an object and not an array.
   */
  isObject(item: any): boolean {
    if (Array.isArray(item) === true) {
      return false;
    }
    return typeof item === "object";
  },
  /**
   * Checks if an item is an array.
   * @param {*} item - The item to check.
   * @returns {boolean} True if the item is an array.
   */
  isArray(item: any): boolean {
    return Array.isArray(item);
  },
  /**
   * Checks if an item is of a specific type.
   * @param {*} item - The item to check.
   * @param {string} type - The expected type.
   * @returns {boolean} True if the item is of the specified type.
   */
  isTypeOf(item: any, type: string): boolean {
    return typeof item === type;
  },
  /**
   * Checks if an item is a DOM Element or Document.
   * @param {*} element - The element to check.
   * @returns {boolean} True if the item is an Element or Document.
   */
  isElement(element: any): boolean {
    return element instanceof Element || element instanceof Document;
  },
  /**
   * Checks if an item is defined (not undefined).
   * @param {*} item - The item to check.
   * @returns {boolean} True if the item is not undefined.
   */
  ifExists(item: any): boolean {
    return typeof item !== "undefined";
  },
  /**
   * Throws an error if item is undefined, otherwise returns the item.
   * @template T
   * @param {T | undefined} item - The item to check.
   * @returns {T} The item if it's defined.
   * @throws {Error} If item is undefined.
   */
  forUndefined<T>(item: T | undefined): T {
    if (typeof item === "undefined") {
      throw new Error("item is undefined");
    } else {
      return item;
    }
  },
  /**
   * Throws an error if item is null, otherwise returns the item.
   * @template T
   * @param {T | null} item - The item to check.
   * @returns {T} The item if it's not null.
   * @throws {Error} If item is null.
   */
  forNull<T>(item: T | null): T {
    if (item === null) {
      throw new Error(`${item} is null`);
    }
    return item;
  },
  /**
   * Determines the type of user input device.
   * @param {MouseEvent} e - The mouse event.
   * @returns {UserPointerType} The type of pointer device ('touchscreen', 'keyboard', or 'mouse').
   */
  userPointer(e: MouseEvent): UserPointerType {
    /** @type {UserPointerType} */
    let output_pointer: UserPointerType;
    if (navigator.maxTouchPoints !== 0) {
      output_pointer = "touchscreen";
    } else if (e.clientX === 0 && e.clientY === 0) {
      output_pointer = "keyboard";
    } else {
      output_pointer = "mouse";
    }
    return output_pointer;
  },
};

/**
 * Returns utility functions for null/undefined checks and data retrieval.
 */
export const Return = {
  /**
   * Returns an element if it's not null.
   * @template {Element} T
   * @param {T | null} item - The element to check.
   * @returns {T} The element if it's not null.
   */
  element<T>(item: T | null): T {
    return Check.forNull(item);
  },
  /**
   * Returns a button element if it's not null.
   * @param {HTMLButtonElement | null} button - The button element to check.
   * @returns {HTMLButtonElement} The button if it's not null.
   */
  button(button: HTMLButtonElement | null): HTMLButtonElement {
    return Check.forNull(button);
  },
  /**
   * Returns a string if it's not null.
   * @param {string | null} string - The string to check.
   * @returns {string} The string if it's not null.
   */
  string(string: string | null): string {
    return Check.forNull(string);
  },
  /**
   * Returns a number if it's defined.
   * @param {number | undefined} number - The number to check.
   * @returns {number} The number if it's defined.
   */
  number(number: number | undefined): number {
    return Check.forUndefined(number);
  },
  /**
   * Returns any item if it's not null.
   * @template T
   * @param {T | null} item - The item to check.
   * @returns {T} The item if it's not null.
   */
  _any<T>(item: T | null): T {
    return Check.forNull(item);
  },
  /**
   * Handles data retrieval from local storage or database.
   * @param {any} dm - Data manager instance.
   * @param {string} key - Database key.
   * @param {string} item - Item identifier.
   * @param {any} data - Data to process.
   */
  data(dm: any, key: string, item: string, data: any) {
    const empty = "";
    if (dm.ls.loadData(item, empty) !== "") {
      dm.fn(dm.ls.loadData(item, data));
    } else {
      dm.db.getValue(key, item, data, dm.fn);
    }
  },
};

/**
 * Utility functions for retrieving DOM elements by ID, tag, or class.
 */
export const Get = {
  /**
   * Gets an element by its ID.
   * @param {string} id - The element ID.
   * @returns {HTMLElement} The found element.
   * @throws {Error} If element is not found.
   */
  elementByID(id: string): HTMLElement {
    const item = document.getElementById(id);
    if (item === null) {
      console.log("element:", item);
      throw new Error("Element is null in elementByID.");
    } else {
      return item;
    }
  },
  /**
   * Gets a button element by its ID.
   * @param {string} id - The button ID.
   * @returns {HTMLButtonElement} The found button element.
   * @throws {Error} If element is not found or is not a button.
   */
  button(id: string): HTMLButtonElement {
    const item = document.getElementById(id);
    if (item === null) {
      console.log("element:", item);
      throw new Error("Element is null in button.");
    } else {
      if (item instanceof HTMLButtonElement) {
        return item;
      } else {
        throw new Error("Element is not a button.");
      }
    }
  },
  /**
   * Gets elements by tag name.
   * @param {string} tag - The tag name.
   * @returns {HTMLCollectionOf<Element>} Collection of found elements.
   * @throws {Error} If no elements are found.
   */
  elementByTag(tag: string): HTMLCollectionOf<Element> {
    const item = document.getElementsByTagName(tag);
    if (item === null) {
      console.log("element:", item);
      throw new Error("Element is null in elementByTag.");
    } else {
      return item;
    }
  },
  /**
   * Gets elements by class name.
   * @param className - The class name.
   * @returns Array of found elements.
   */
  elementsByClass(className: string) {
    const items = document.getElementsByClassName(className);
    return items;
  },
  /**
   * Gets the bounding client rect of an element.
   * @param {string} id - The element ID.
   * @returns {DOMRect} The element's bounding client rect.
   */
  boundingClientRect(id: string): DOMRect {
    const element = Get.elementByID(id);
    return element.getBoundingClientRect();
  },
};

/**
 * Utility functions for querying DOM elements using CSS selectors.
 */
export const Query = {
  /**
   * Queries a single element using a CSS selector.
   * @param {string} select - The CSS selector.
   * @returns {Element} The found element.
   * @throws {Error} If no element is found.
   */
  selector(select: string): Element {
    const item = document.querySelector(select);
    if (item === null) {
      console.log("element:", item);
      throw new Error("Element is null in querySelector.");
    } else {
      return item;
    }
  },
  /**
   * Queries multiple elements using a CSS selector.
   * @param {string} selector - The CSS selector.
   * @returns {NodeListOf<Element>} List of found elements.
   * @throws {Error} If no elements are found.
   */
  selectorAll(selector: string): NodeListOf<Element> {
    const item = document.querySelectorAll(selector);
    if (item === null) {
      console.log("element:", item);
      throw new Error("Element is null in querySelectorAll.");
    } else {
      return item;
    }
  },
};

type UserPointerType = "touchscreen" | "keyboard" | "mouse";
