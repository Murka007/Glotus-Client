// ==UserScript==
// @name ! Glotus Client Development
// @author Murka
// @description An excellent Moomoo.io hack for a comfortable gaming experience
// @icon https://imagizer.imageshack.com/img924/3497/SedB2D.png
// @version 1.0
// @match *://moomoo.io/
// @match *://moomoo.io/?server*
// @match *://*.moomoo.io/
// @match *://*.moomoo.io/?server*
// @run-at document-start
// @grant GM_webRequest
// @noframes
// @license MIT
// ==/UserScript==
/* jshint esversion:6 */

/*
    Author: Murka
    Github: https://github.com/Murka007/Glotus-client
    Greasyfork: https://greasyfork.org/users/919633
    Discord: https://discord.gg/cPRFdcZkeD

    If you are not a developer, ignore this script.
    This script is intented to be used in development.
    In order to do so, first you need to install the whole repository
    to your computer and then run `npm start` command.

    After that, you can use this script to test some stuff.
*/

GM_webRequest([
    { selector: { include: ["*cookie*", "*cloudflare*", "*ads*", "*jquery*", "*howler*", "*frvr-channel-web*", "*securepubads*"] }, action: "cancel" },
]);

try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:8081/dist", false);
    xhr.send();
    Function(xhr.responseText)();
} catch(err) {
    console.error("Glotus Client loading error..");
    console.error(err);
}