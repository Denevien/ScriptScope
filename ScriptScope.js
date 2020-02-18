function updateDOM() {
  // Update the function that changes content to support our new item
  // By using 99, this helps future proof, and should mainly require
  // updating the pages array when new skills are added.
  changePage = function(page) {
    $('[data-toggle="tooltip"]').tooltip('hide');
    let pages = ["woodcutting", "shop", "bank", "settings", "changelog", "milestones", "statistics", "fishing", "firemaking", "cooking", "mining", "smithing", "mastery", "combat", "thieving", "farming", "fletching","crafting","runecrafting","herblore"];
    
    if(currentPage === 99) {
      $("#automation-container").attr("class", "content d-none");
    }
    else {
      $("#" + pages[currentPage] + "-container").attr("class", "content d-none");
    }
    if(page === 99) {
      $("#automation-container").attr("class", "content");
      $("#header-title").text("Script Scope");
      $("#header-icon").attr("src", "assets/media/main/settings_header.svg");
      $("#header-theme").attr("class", "content-header bg-settings");
      $("#page-header").attr("class", "bg-settings");
    }
    else {
      $("#" + pages[page] + "-container").attr("class", "content");
      $("#header-title").text(pages[page].charAt(0).toUpperCase() + pages[page].slice(1));
      $("#header-icon").attr("src", "assets/media/main/" + pages[page] + "_header.svg");
      $("#header-theme").attr("class", "content-header bg-" + pages[page]);
      $("#page-header").attr("class", "bg-" + pages[page]);
    }
    currentPage = page;
      
    if( $(window).width() < 992) {
      One.layout('sidebar_toggle');
    } 
    if (currentPage === 13) { 
      if (!mapLoaded)	{
        init('map');
        mapLoaded = true;
        showMap();
      }
    }
    if (page === 15) {
      updateCompostQty();
    }  
    else if ((page === 19) && (selectedHerblore !== null)) selectHerblore(selectedHerblore, true); 
    showFarmingAreas();
    updatePotionHeader();
  }
  
  // Inject the content view into the DOM
  contentView = '\
  <div class="content d-none" id="automation-container"> \
    <div class="row"> \
      <div class="col-12"> \
        <div class="bg-white p-3 push"> \
          <!-TODO: Add support for smaller resolutions--> \
          <div id="horizontal-navigation-scripting" class="d-none d-lg-block mt-w mt-lg-0"> \
            <ul class="nav-main nav-main-horizontal nav-main-hover nav-main-horizontal-center">' +
              // This is where new functionality gets added to the navigation menu
              generateScriptNavItem("Combat", "assets/media/skills/combat/combat.svg", 0) +
              generateScriptNavItem("Woodcutting", "assets/media/skills/woodcutting/woodcutting.svg", 1) +
              generateScriptNavItem("Fishing", "assets/media/skills/fishing/fishing.svg", 2) +
              generateScriptNavItem("Mining", "assets/media/skills/mining/mining.svg", 3) +
            '</ul> \
          </div> \
        </div> \
      </div> \
      <div class="col-12"> \
        <div class="block block-rounded block-link-pop border-top border-settings border-4x"> \
          <div class="row no-gutters" id="automation-category-container">' +
            // This defines what is displayed in the main content window when
            // the respective navigation item is clicked.
            generateScriptContent(0, generateCombatContent()) +
            generateScriptContent(1, generateWoodcuttingContent()) +
            generateScriptContent(2, generateFishingContent()) +
            generateScriptContent(3, generateMiningContent()) +
          '</div> \
        </div> \
      </div> \
    </div> \
  </div>'
  $("#main-container").append(contentView)
  
  // Inject our menu option in to the side menu
  $(".nav-main li:eq(4)").before('' +
  '<li class="nav-main-item">' +
    '<a class="nav-main-link nav-compact" href="javascript:changePage(99);">' +
      '<img class="nav-img" src="assets/media/main/settings_header.svg">' +
      '<span class="nav-main-link-name">Script Scope</span>' +
    '</a>' +
  '</li>')
}

// Create Handler for switching categories in Script Options
function automationCategory(cat) {
  // Be sure this value matches the actual number of categories
  for (let i = 0; i < $('#automation-category-container div').length; i++) {
    $("#automation-category-" + i).addClass("d-none");
  }

  $("#automation-category-" + cat).removeClass("d-none");
}

// On the Automation Script Options page, these are the items that will go in the
// Nav Menu at the top. This allows for different automation scripts to be separated
// into categories (e.g. combat, mining, farming, etc)
function generateScriptNavItem(name, icon, pos) {
  return '\
  <li class="nav-main-item">\
    <a class="nav-main-link acive" href="javascript:automationCategory(' + pos + ');">\
      <img class="skill-icon-xs m-0 mr-2" src="' + icon + '">\
      <span class="nav-main-link-name">' + name + '</span>\
    </a>\
  </li>'
}

// This will be the main content shown when clicking the respective Nav Menu Item on
// the Automation Script Options page. Content needs to be the formatted HTML that
// is expected to be in the main container under the nav menu
function generateScriptContent(pos, content) {
  return '\
  <div id="automation-category-' + pos + '" class="col-12' + (pos === 0 ? '' : ' d-none') + '"> \
    <div class="block-content"> \
      <div class="row">' +
        content +
      '</div> \
    </div> \
  </div>'
}

/***************
*   Combat Logic
****************/
function generateCombatContent() {
  return '\
  <div id=automationCombatContent">\
    Enable Auto Loot? <input type="checkbox" id="autoCombatLoot"></br>\
    Enable Auto Eat? <input type="checkbox" id="autoCombatEat"></br>\
    Auto Eat Threshold: <input type="number" id="autoCombatEatThreshold" min="1"></br>\
    <button onclick="startAutoCombat()"> Toggle Auto Combat</button>\
  </div>'
}

var autoCombatEnabled = false;
var autoCombatLootEnabled = false;
var autoCombatEatEnabled = false;
var autoCombatEatThreshold = 0;
var autoCombat;

function startAutoCombat() {
  if(autoCombatEatEnabled) {
    clearInterval(autoCombat);
    autoCombatEnabled = false;
  }
  else {
    autoCombatLootEnabled = $('#autoCombatLoot').is(':checked');
    autoCombatEatEnabled = $('#autoCombatEat').is(':checked');
    if(autoCombatEatEnabled && $('#autoCombatEatThreshold').val()) {
      autoCombatEatThreshold = $('#autoCombatEatThreshold').val()
    }
    else {
      autoCombatEatEnabled = false;
    }
    autoCombat = setInterval(function(){
      if(autoCombatLootEnabled) {
        lootAll();
      }
      if(autoCombatEatEnabled && combatData.player.hitpoints <= autoCombatEatThreshold)
      {
          eatFood();
      }
    }, 10000);
    autoCombatEnabled = true;
  }
}

/********************
*   Woodcutting Logic
*********************/
function generateWoodcuttingContent() {
  return '\
  <div id="automationWoodCuttingContent">\
    <p>Select which tree to harvest. If you\'ve bought the perk, you can select two.</br>\
    Only the first one (or two) checked will be used.</br>\
    I understand this isn\'t super useful, but I wanted something for each skill.</p></br>\
    Normal: <input type="checkbox" id="autoChop_0"></br>\
    Oak: <input type="checkbox" id="autoChop_1"></br>\
    Willow: <input type="checkbox" id="autoChop_2"></br>\
    Teak: <input type="checkbox" id="autoChop_3"></br>\
    Maple: <input type="checkbox" id="autoChop_4"></br>\
    Mahogany: <input type="checkbox" id="autoChop_5"></br>\
    Yew: <input type="checkbox" id="autoChop_6"></br>\
    Magic: <input type="checkbox" id="autoChop_7"></br>\
    Redwood: <input type="checkbox" id="autoChop_8"></br>\
    <button onclick="startAutoChop()">Chop Selected Tree(s)</button>\
  </div>'
}

function startAutoChop() {
  // Clear any that we're already harvesting
  for(i=0; i<=8; i++) {
    if(treeCuttingHandler[i] != null) {
      cutTree(i, false);
    }
  }
  // Start the ones we want
  for(i=0; i<=8; i++) {
    if($('#autoChop_' + i).is(':checked')) {
      cutTree(i, false);
    }
    if(treeCuttingHandler.filter(x => x != null).length == treeCutLimit) {
      break;
    }
  }
}

/****************
*   Fishing Logic
*****************/
function generatefishingContent() {
  return '\
  <div id="automationFishingContent">\
    Shrimp: <input type="number" id="autoFish_0" min="1" max="13"></br>\
    Sardine: <input type="number" id="autoFish_1" min="1" max="13"></br>\
    Herring: <input type="number" id="autoFish_2" min="1" max="13"></br>\
    Trout: <input type="number" id="autoFish_3" min="1" max="13"></br>\
    Salmon: <input type="number" id="autoFish_4" min="1" max="13"></br>\
    Lobster: <input type="number" id="autoFish_5" min="1" max="13"></br>\
    Swordfish: <input type="number" id="autoFish_6" min="1" max="13"></br>\
    Crab: <input type="number" id="autoFish_7" min="1" max="13"></br>\
    Shark: <input type="number" id="autoFish_8" min="1" max="13"></br>\
    Cave Fish: <input type="number" id="autoFish_9" min="1" max="13"></br>\
    Manta Ray: <input type="number" id="autoFish_10" min="1" max="13"></br>\
    Whale: <input type="number" id="autoFish_11" min="1" max="13"></br>\
    Treasure Chest: <input type="number" id="autoFish_12" min="1" max="13"></br>\
    <button onclick="startAutoFish()">Toggle Auto Fishing</button>\
  </div>'
}

var autoFishEnabled = false;
var autoFishPriority = [];
var autoFish;

function startAutoFish() {
  if(autoFishEnabled) {
    clearInterval(autoFish);
    autoFishEnabled = false;
  }
  else {
    let orderedFish = [null, null, null, null, null, null, null, null, null, null, null, null, null];
    for(i=0; i<13; i++) {
      if($('#autoFish_'+i).val()) {
        let order = $('#autoFish_'+i).val();
        orderedFish[order] = i;
      }
    }
    autoFishPriority = orderedFish.filter(x => x != null);
    autoFish = setInterval(function() {
      for(i=0; i<autoFishPriority.length; i++) { // For fish in priority
        let best_loc = 0;
        let best_chance = 0;
        for(j=0; j<=8; j++) { // For each fishing area
          let local_chance = fishingArea[j].currentFish.filter(x => x == autoFishPriority[i]).length / fishingArea[j].currentFish.length;
          if(local_chance > best_chance) {
            best_chance = local_chance;
            best_loc = j;
          }
        }
        if(best_chance > 0) {
          if(currentlyFishingArea != best_loc) {
            if(currentlyFishing) {
              startFishing(currentlyFishingArea, false)
            }
            startFishing(best_loc, false)
          }
          break;
        }
      }
    }, 1000);
    autoFishEnabled = true;
  }
}

/***************
*   Mining Logic
****************/
function generateMiningContent() {
  return '\
  <div id="automationMiningContent">\
    Prefer Priority #1? <input type="checkbox" id="autoMineAvailiable"></br>\
    Copper: <input type="number" id="autoMine_0" min="1" max="11"></br>\
    Tin: <input type="number" id="autoMine_1" min="1" max="11"></br>\
    Iron: <input type="number" id="autoMine_2" min="1" max="11"></br>\
    Coal: <input type="number" id="autoMine_3" min="1" max="11"></br>\
    Silver: <input type="number" id="autoMine_4" min="1" max="11"></br>\
    Gold: <input type="number" id="autoMine_5" min="1" max="11"></br>\
    Mithril: <input type="number" id="autoMine_6" min="1" max="11"></br>\
    Adamantite: <input type="number" id="autoMine_7" min="1" max="11"></br>\
    Runite: <input type="number" id="autoMine_8" min="1" max="11"></br>\
    Dragonite: <input type="number" id="autoMine_9" min="1" max="11"></br>\
    Rune Essence: <input type="number" id="autoMine_10" min="1" max="11"></br>\
    <button onclick="startAutoMine()">Toggle Auto Mining</button>\
  </div>'
}

var autoMineEnabled = false;
var autoMineAvailiable = false;
var autoMinePriority = [];
var autoMine;

function startAutoMine() {
  if(autoMineEnabled) {
    clearInterval(autoMine);
    autoMineEnabled = false;
  }
  else {
    autoMineAvailiable = $('#autoMineAvailiable').is(':checked');
    let orderedOres = [null, null, null, null, null, null, null, null, null, null, null];
    for(i=0; i<11; i++) {
      if($('#autoMine_'+i).val()) {
        let order = $('#autoMine_'+i).val();
        orderedOres[order] = i;
      }
    }
    autoMinePriority = orderedOres.filter(x => x != null);
    autoMine = setInterval(function(){
      // Check to see if set to always mine #1
      // If so, check if it is available to mine
      if(autoMineAvailiable && currentRock != autoMinePriority[0] && !rockData[autoMinePriority[0]].depleted) {
        mineRock(autoMinePriority[0], true);
      }
      // Check if current rock is depleted, then work through priority list
      else if (rockData[currentRock].depleted) {
        for(i=0; i<autoMinePriority.length; i++) {
          if(!rockData[autoMinePriority[i]].depleted) {
            mineRock(autoMinePriority[i], true)
            break;
          }
        }
      }
    }, 1000)
    autoMineEnabled = true;
  }
}

/******************
*   Start Execution
*******************/
updateDOM();