async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  const out = [];
  const snap = async (name) => {
    await page.waitForTimeout(350);
    const r = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    out.push(name + "__" + r.data);
  };
  const clickText = async (txt) => {
    await page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        (b.textContent || "").toUpperCase().includes(t.toUpperCase())
      );
      if (!btn) throw new Error("Missing button: " + t);
      btn.click();
    }, txt);
  };

  // 1. Updated NASA Archive Modal
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(350);
  await clickText("NASA ARCHIVE");
  await snap("r2_archive.png");
  await clickText("CLOSE");

  // 2. Mini-Game 3 (Moon Rover Adventure)
  await page.evaluate(() => {
    localStorage.setItem("jack_forgotten_explorers_save_v1", JSON.stringify({
      version: 1, missionDay: 34, screen: "minigame_3", storyStep: "ch3_lrv_talk",
      completedMiniGames: [1, 2],
      discoveredMachines: ["eagle", "lrv"],
      talkedMachines: ["eagle", "lrv"],
      collectedComponents: ["universal_power_coupler"],
      installedComponents: ["universal_power_coupler"],
      inventory: [], discoveries: [],
      lunarSuppliesCollected: { oxygen: 3, energyCells: 3, repairParts: 4 },
      lunarSamplesCollected: 0, marsDiscoveriesRecorded: [],
      chapter5TurnedBackOnce: false, endingReached: false
    }));
  });
  await page.goto("http://localhost:3000/?autostart=1");
  await page.waitForTimeout(450);
  await clickText("DRIVE LRV");
  await page.waitForTimeout(350);
  await snap("r2_mg3.png");

  // 3. Mini-Game 4 (Match Equipment)
  await page.evaluate(() => {
    localStorage.setItem("jack_forgotten_explorers_save_v1", JSON.stringify({
      version: 1, missionDay: 45, screen: "minigame_4", storyStep: "ch4_crater_awakening",
      completedMiniGames: [1, 2, 3],
      discoveredMachines: ["eagle", "lrv", "alsep", "surveyor", "apollo_comms"],
      talkedMachines: ["eagle", "lrv"],
      collectedComponents: ["universal_power_coupler", "lunar_traction_module"],
      installedComponents: ["universal_power_coupler", "lunar_traction_module"],
      inventory: [], discoveries: [],
      lunarSuppliesCollected: { oxygen: 3, energyCells: 3, repairParts: 4 },
      lunarSamplesCollected: 3, marsDiscoveriesRecorded: [],
      chapter5TurnedBackOnce: false, endingReached: false
    }));
  });
  await page.goto("http://localhost:3000/?autostart=1");
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("button[aria-label]")).filter((b) =>
      (b.getAttribute("aria-label") || "").includes("Hidden ALSEP")
    );
    if (cards[0]) cards[0].click();
    if (cards[1]) cards[1].click();
  });
  await snap("r2_mg4.png");

  // 4. Mini-Game 6 (Mars Explorer)
  await page.evaluate(() => {
    localStorage.setItem("jack_forgotten_explorers_save_v1", JSON.stringify({
      version: 1, missionDay: 108, screen: "minigame_6", storyStep: "ch7_opportunity_talk",
      completedMiniGames: [1, 2, 3, 4, 5],
      discoveredMachines: ["eagle", "lrv", "alsep", "surveyor", "apollo_comms", "sojourner", "spirit", "opportunity"],
      talkedMachines: ["eagle", "lrv", "alsep", "surveyor", "apollo_comms", "sojourner", "spirit", "opportunity"],
      collectedComponents: ["universal_power_coupler", "lunar_traction_module", "diagnostic_sensor_pack", "deep_space_comms_relay", "solar_charging_controller"],
      installedComponents: ["universal_power_coupler", "lunar_traction_module", "diagnostic_sensor_pack", "deep_space_comms_relay", "solar_charging_controller"],
      inventory: [], discoveries: [],
      lunarSuppliesCollected: { oxygen: 3, energyCells: 3, repairParts: 4 },
      lunarSamplesCollected: 3, marsDiscoveriesRecorded: [],
      chapter5TurnedBackOnce: false, endingReached: false
    }));
  });
  await page.goto("http://localhost:3000/?autostart=1");
  await page.waitForTimeout(450);
  await clickText("EXPLORE MARS");
  await page.waitForTimeout(350);
  await snap("r2_mg6.png");

  // 5. Final Repair in Spacecraft Hub -> Day 123 Return to Earth Ending
  await page.evaluate(() => {
    localStorage.setItem("jack_forgotten_explorers_save_v1", JSON.stringify({
      version: 1, missionDay: 118, screen: "explore_mars", storyStep: "ch7_final_install",
      completedMiniGames: [1, 2, 3, 4, 5, 6],
      discoveredMachines: ["eagle", "lrv", "alsep", "surveyor", "apollo_comms", "sojourner", "spirit", "opportunity"],
      talkedMachines: ["eagle", "lrv", "alsep", "surveyor", "apollo_comms", "sojourner", "spirit", "opportunity"],
      collectedComponents: ["universal_power_coupler", "lunar_traction_module", "diagnostic_sensor_pack", "deep_space_comms_relay", "solar_charging_controller", "deep_space_nav_beacon"],
      installedComponents: ["universal_power_coupler", "lunar_traction_module", "diagnostic_sensor_pack", "deep_space_comms_relay", "solar_charging_controller"],
      inventory: [],
      discoveries: ["Ancient Martian Rock", "Ancient Water Evidence", "Abandoned Exploration Signal"],
      lunarSuppliesCollected: { oxygen: 3, energyCells: 3, repairParts: 4 },
      lunarSamplesCollected: 3,
      marsDiscoveriesRecorded: ["Ancient Martian Rock", "Ancient Water Evidence", "Abandoned Exploration Signal"],
      chapter5TurnedBackOnce: false, endingReached: false
    }));
  });
  await page.goto("http://localhost:3000/?autostart=1");
  await page.waitForTimeout(450);
  await clickText("SHIP HUB");
  await page.waitForTimeout(250);
  await clickText("CLICK TO INSTALL COMPONENT");
  await page.waitForTimeout(300);
  await clickText("RETURN TO EARTH");
  await page.waitForTimeout(4800);
  await snap("r2_ending.png");

  const endingMeta = await page.evaluate(() => ({
    bodyState: document.body.dataset.state,
    hasQuote: document.body.innerText.includes("NO EXPLORER SHOULD EVER BE FORGOTTEN."),
    hasDay123: document.body.innerText.includes("DAY 123")
  }));
  out.push("META__" + JSON.stringify(endingMeta));

  return out.join("\n");
}
