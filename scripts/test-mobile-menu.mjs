import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.argv[2] ?? "http://localhost:3000/pokemon-champions";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 375, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});
const page = await browser.newPage();
await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });

// Closed-state screenshot
await page.screenshot({ path: "/tmp/menu-closed.png" });
console.log("closed screenshot taken");

// Find the hamburger and click it
const button = await page.$('button[aria-label="Open menu"]');
if (!button) throw new Error("hamburger button not found");
const box = await button.boundingBox();
console.log("hamburger box:", box);
await button.click();
await new Promise((r) => setTimeout(r, 400)); // wait for slide-in animation

// Inspect the drawer state
const drawerInfo = await page.evaluate(() => {
  const aside = document.querySelector('aside[role="dialog"][aria-modal="true"]');
  if (!aside) return { error: "no aside found" };
  const rect = aside.getBoundingClientRect();
  const cs = getComputedStyle(aside);
  const linkCount = aside.querySelectorAll('a').length;
  const buttonCount = aside.querySelectorAll('button').length;
  const parentTag = aside.parentElement?.tagName ?? null;
  // Find the My-Pokémon FAB to compare its z-index against the drawer.
  const fabRoot = Array.from(document.querySelectorAll("div.fixed.bottom-4.left-4")).find(
    (el) => el !== aside.parentElement,
  );
  const fabZ = fabRoot ? getComputedStyle(fabRoot).zIndex : null;
  const fabRect = fabRoot ? fabRoot.getBoundingClientRect() : null;
  const bodyChildren = Array.from(document.body.children).map((el) => ({
    tag: el.tagName,
    cls: el.className.slice(0, 60),
    z: getComputedStyle(el).zIndex,
  }));
  // Pixel test — sample the color at the FAB centre to confirm what's on top.
  const pt = fabRect
    ? { x: fabRect.x + fabRect.width / 2, y: fabRect.y + fabRect.height / 2 }
    : null;
  const topAtFab = pt ? document.elementFromPoint(pt.x, pt.y)?.tagName : null;
  const bodyMenuOpen = document.body.getAttribute("data-menu-open");
  const allFabs = Array.from(document.querySelectorAll(".pokedd-fab, .fixed.bottom-4.left-4"));
  const fabSummary = allFabs.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      cls: el.className,
      display: getComputedStyle(el).display,
      visibility: getComputedStyle(el).visibility,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    };
  });
  const fabDisplay = fabRoot ? getComputedStyle(fabRoot).display : null;
  const fabClassList = fabRoot ? fabRoot.className : null;
  return {
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    bg: cs.backgroundColor,
    drawerZ: cs.zIndex,
    transform: cs.transform,
    linkCount,
    buttonCount,
    parentTag,
    fabZ,
    fabDisplay,
    fabClassList,
    bodyMenuOpen,
    topAtFab,
    fabSummary,
  };
});
console.log("drawer:", JSON.stringify(drawerInfo, null, 2));

await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: "/tmp/menu-open.png", captureBeyondViewport: false });
console.log("open screenshot taken");

await browser.close();
