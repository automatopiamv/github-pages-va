// Define Airtable API key, base ID, and table name
const atKey = 'keyDOIkxuexRDhwi7';
const appId = 'appzktw4aywkZzH3I';
const tableName = 'Scenes';

// Topia
const apiKey = '796440d0-1949-44b3-836d-80b5a38e7dbc';
const apiEmail = 'automatopia@topia.io';

///////////// CHECK STORED URL SLUG /////////////

(async function() {
  // Read 'urlSlug' from local storage
  const urlSlug = localStorage.getItem('urlSlug');
  
  // Populate the search field with urlSlug if it exists
  if (urlSlug) {
    console.log('Checking stored URL slug: ' + urlSlug)
    const searchField = document.querySelector('.search-box input[type="text"]');
    searchField.value = urlSlug;

    // Validate Topia World slug
    const apiKey = '796440d0-1949-44b3-836d-80b5a38e7dbc';
    const apiEmail = 'automatopia@topia.io';
    const urlSlugValid = await checkTopiaWorld(apiKey, apiEmail, urlSlug);

    // Update world icon
    const worldIcon = document.querySelector('.search-box img');
    if (urlSlugValid) {
      worldIcon.src = 'https://i.ibb.co/8gt35gz/icon-whitecheck.png';
    } else {
      worldIcon.src = 'https://i.ibb.co/D8MV6gT/icon-whitex.png';
    }
  }
})();

///////////// LOAD SCENES /////////////

// Get the URL parameters
const urlParams = new URLSearchParams(window.location.search);

// Get the 'records' parameter value or set a default value
const recordsParam = urlParams.get('scenes') ? urlParams.get('scenes').split(',') : ['recTotrYtI9ozZpiO','recqCp5t8ebDN6nJn','recNH1ZirIHKAqocX']
//['recRLk3HeZsMjEmAw','recV5uoQ0xjUQMWh2','recjrIw18688t4TGv','rec5yKJ8077Jsl6mc','recg7b0A6amyXtGX0','receTz5M2OzLvX9zm'];
// ['recjrIw18688t4TGv','rec5yKJ8077Jsl6mc','recg7b0A6amyXtGX0','receTz5M2OzLvX9zm']

// Run the getAirtableScenes function when the page loads
window.onload = () => {
  showLoader(); // show the loader before fetching data
  getAirtableScenes(recordsParam).then(() => {
    hideLoader(); // hide the loader after the data has been fetched
  });
};

/**
 * Displays the loader element on the page
 */
function showLoader() {
  const loader = document.querySelector('.spinner');
  loader.style.display = 'flex';
}

/**
 * Hides the loader element on the page
 */
function hideLoader() {
  const loader = document.querySelector('.loader-container');
  loader.style.display = 'none';
}

/**
 * Fetches scene records from Airtable and displays them in a scrollable list.
 * 
 * @param {Array} recordIds - Array of scene record IDs to fetch from Airtable.
 * @param {number} maxRecords - Maximum number of scene records to fetch from Airtable.
 */
async function getAirtableScenes(recordIds, maxRecords) {
  if (!recordIds) {
    console.log('No scene records detected.');
    return;
  }

  // Set thumbnail size for the scene profile image
  const thumbSize = 'large'; // 'full', 'large', or 'small'

  // Retrieve scene records from Airtable using record IDs
  const scenes = await findRecordsByRecIdsList(atKey, appId, tableName, recordIds);

  // Filter scenes for testing, if a maximum number of records is specified
  let slicedScenes = [];
  if (scenes && scenes.length > 0) {
    slicedScenes = maxRecords ? scenes.slice(0, maxRecords) : scenes;
  }

  // Get Topia World Assets
  const urlSlug = localStorage.getItem('urlSlug');
  const assets = await getTopiaWorldAssets(apiKey, apiEmail, urlSlug);

  let htmlStrings = '';
  const img_default = 'https://i.ibb.co/PgfVSFV/31314483-7611c488-ac0e-11e7-97d1-3cfc1c79610e.png';

  slicedScenes.forEach(({ id, fields: { ['Topia Scene ID']: scene_id, ['Scene Name']: title, ['Scene Description']: description, ['Scene Profile Image']: images, ['Drop Profile Library Asset ID']: assetId, ['Default Pos X']: posx, ['Default Pos Y']: posy,['Sub-Scenes']: subscenes = null } }, i) => {
    const subscenesString = subscenes ? subscenes.join(',') : '';
    const numString = (subscenes?.length ?? 0) + ' ' + ((subscenes?.length ?? 0) == 1 ? 'subscene' : 'subscenes');
    let thumbUrl = img_default;
    if (images && images.length > 0 && images[0].thumbnails && images[0].thumbnails[thumbSize] && images[0].thumbnails[thumbSize].url) {
      thumbUrl = images[0].thumbnails[thumbSize].url;
    }
    let fullUrl = '';
    if (images && images.length > 0) {
      fullUrl = images[0].url;
    }

    const isClickable = subscenes && subscenes.length > 0;
    const clickAttribute = isClickable ? `onclick="location.href='index.html?scenes=${encodeURIComponent(subscenesString)}'"` : '';

    // Search for dropped assets from this scene
    const suffix = toKebabCase(title);
    const droppedSceneAssets = assets ? filterAssetsBySuffix(assets, suffix) : [];

    function filterAssetsBySuffix(assets, suffix) {
      return assets.filter((obj) => {
        if (obj.uniqueName && obj.uniqueName.endsWith(suffix)) {
          return true;
        }
        return false;
      });
    }
		//console.log('droppedSceneAssets',droppedSceneAssets)
    
    let arrowButtonHtml = '';
    if (droppedSceneAssets.length > 0) {
      arrowButtonHtml = `
        <div class="button button-arrow" onclick="onRemoveButtonClick(event, '${title}');">
          <img src="https://i.ibb.co/1bnpCsr/remove-icon-32.png" alt="Remove Icon">
          <div class="tooltip">Remove Scene</div>
          <div class="tooltip-arrow"></div>
        </div>
      `;
    } else {
      arrowButtonHtml = `
        <div class="button button-arrow" onclick="onArrowButtonClick(event, '${scene_id}', '${title}', '${posx}', '${posy}');">
          <img src="https://i.ibb.co/VYMnmHm/icons8-download-24.png" alt="Arrow Icon">
          <div class="tooltip">Drop scene</div>
          <div class="tooltip-arrow"></div>
        </div>
      `;
    }

    const itemHtml = `
      <div class="list-item"${clickAttribute}>
        <div class="image-container">
          <img src="${thumbUrl}" alt="${title}">
        </div>
        <div class="item-info">
          <h2>${title}</h2>
          <p>${numString}</p>
        </div>
        ${arrowButtonHtml}
      </div>`;
    htmlStrings += itemHtml;
  });
	//console.log('htmlStrings',htmlStrings);
  
  // Set the HTML of the scrollable list container to the generated HTML strings
  const scrollableList = document.querySelector('.scrollable-list');
  scrollableList.innerHTML = htmlStrings;
}


///////////// REGISTER URL SLUG /////////////

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('input[type="text"]');
  const worldIcon = document.querySelector('.search-box img');

  searchInput.addEventListener('keydown', async (event) => {
    if (event.keyCode === 13) {
    	
      worldIcon.src = 'https://i.ibb.co/KrWGthn/topia-globe-white.png';
      
      // Get the value of the search input field
      const urlSlug = searchInput.value;
      
      if (!urlSlug) {
      	worldIcon.src = 'https://i.ibb.co/D8MV6gT/icon-whitex.png';
        
      } else {
      
      	console.log('Testing URL slug ' + urlSlug + '...')
        
        // Validate Topia World slug
        const apiKey = '796440d0-1949-44b3-836d-80b5a38e7dbc';
        const apiEmail = 'automatopia@topia.io';
        const urlSlugValid = await checkTopiaWorld(apiKey, apiEmail, urlSlug);

        // Update world icon
        if (urlSlugValid) {
          worldIcon.src = 'https://i.ibb.co/8gt35gz/icon-whitecheck.png';

          // Store the value in local storage
          localStorage.setItem('urlSlug', urlSlug);

        } else {
          worldIcon.src = 'https://i.ibb.co/D8MV6gT/icon-whitex.png';
        }
      }
    }
  });
});

///////////// CLICK FUNCTIONS /////////////

// Drop Scene Button
const onArrowButtonClick = async (event, sceneId, sceneName, posX, posY) => {
  event.stopPropagation(); // Prevent triggering the list item click event

  let urlSlug = localStorage.getItem('urlSlug');
  console.log(`Dropping Scene ID ${sceneId} in ${urlSlug}...`);

  let dropPos = {
    x: isNaN(parseFloat(posX)) || posX === null || posX === 0 ? 0.01 : parseFloat(posX),
    y: isNaN(parseFloat(posY)) || posY === null || posY === 0 ? 0.01 : parseFloat(posY)
  };
  //console.log('dropPos', dropPos);

  // No URL Slug Error Pop-up
  if (!urlSlug) {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.classList.add('overlay');

    const popup = document.createElement('div');
    popup.classList.add('popup');

    const heading = document.createElement('h3');
    heading.textContent = '⚠️ No URL Slug detected!';

    const description = document.createElement('p');
    description.textContent = 'Close this window and enter the Topia URL slug in which you wish to drop this scene';

    const closeButton = document.createElement('div');
    closeButton.classList.add('close-button');
    closeButton.textContent = 'x';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    popup.appendChild(heading);
    popup.appendChild(closeButton);
    popup.appendChild(description);

    overlay.appendChild(popup);

    document.body.appendChild(overlay);

    return; // Stop further execution
  }

  // Drop Scene Pop-up
  try {
    // Show pop-up overlay
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.classList.add('overlay');

    const popup = document.createElement('div');
    popup.classList.add('popup');

    const heading = document.createElement('h3');
    heading.textContent = sceneName;

    const description = document.createElement('p');
    description.textContent = `Dropping this scene at [${dropPos.x},${dropPos.y}]...`;

    popup.appendChild(heading);
    popup.appendChild(description);
    overlay.appendChild(popup);

    document.body.appendChild(overlay);

    try {
      // Topia Variables
      const apiKey = '796440d0-1949-44b3-836d-80b5a38e7dbc';
      const apiEmail = 'automatopia@topia.io';

      const suffix = toKebabCase(sceneName);
      const result = await dropTopiaSceneByCoords(apiKey, apiEmail, urlSlug, sceneId, dropPos, suffix);
      console.log(result.success ? result.message : result.error);
      document.body.removeChild(overlay);
			location.reload(); // Refresh the page
      
    } catch (error) {
      console.error('Error in inner try-catch:', error);
      console.error('Stack Trace:', error.stack);
    }
  } catch (error) {
    console.error('Error in outer try-catch:', error);
    console.error('Stack Trace:', error.stack);
  }
};

// Remvoe Scene Button
const onRemoveButtonClick = async (event, sceneName) => {
  event.stopPropagation(); // Prevent triggering the list item click event

  let urlSlug = localStorage.getItem('urlSlug');
  console.log(`Removing Scene ID ${sceneName} in ${urlSlug}...`);

  // No URL Slug Error Pop-up
  if (!urlSlug) {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.classList.add('overlay');

    const popup = document.createElement('div');
    popup.classList.add('popup');

    const heading = document.createElement('h3');
    heading.textContent = '⚠️ No URL Slug detected!';

    const description = document.createElement('p');
    description.textContent = 'Close this window and enter the Topia URL slug in which you wish to drop this scene';

    const closeButton = document.createElement('div');
    closeButton.classList.add('close-button');
    closeButton.textContent = 'x';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    popup.appendChild(heading);
    popup.appendChild(closeButton);
    popup.appendChild(description);

    overlay.appendChild(popup);

    document.body.appendChild(overlay);

    return; // Stop further execution
  }

  // Remove Scene Pop-up
  try {
    // Show pop-up overlay
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.classList.add('overlay');

    const popup = document.createElement('div');
    popup.classList.add('popup');

    const heading = document.createElement('h3');
    heading.textContent = sceneName;

    const description = document.createElement('p');
    description.textContent = `Removing this scene...`;

    popup.appendChild(heading);
    popup.appendChild(description);
    overlay.appendChild(popup);

    document.body.appendChild(overlay);

    try {
      // Topia Variables
      const apiKey = '796440d0-1949-44b3-836d-80b5a38e7dbc';
      const apiEmail = 'automatopia@topia.io';

      const suffix = toKebabCase(sceneName);
      const result = await removeTopiaWorldAssetsBySuffix(apiKey, apiEmail, urlSlug, suffix);
      console.log(result.success ? result.message : result.error);
      document.body.removeChild(overlay);
			location.reload(); // Refresh the page
      
    } catch (error) {
      console.error('Error in inner try-catch:', error);
      console.error('Stack Trace:', error.stack);
    }
  } catch (error) {
    console.error('Error in outer try-catch:', error);
    console.error('Stack Trace:', error.stack);
  }
};

function closePopup() {
  const overlay = document.getElementById('overlay');
  document.body.removeChild(overlay);
}

///////////// AIRTABLE FUNCTIONS /////////////

/**
 * Finds Airtable records from a list of record IDs
 *
 * @param {string} atKey - The API key for Airtable
 * @param {string} appId - The ID of the Airtable base
 * @param {string} tableName - The name of the Airtable table
 * @param {array} recordIds - The list of record IDs to search for
 * @returns {array} - The list of Airtable records that match the record IDs
 */
async function findRecordsByRecIdsList(atKey, appId, tableName, recordIds){
    // If recordIds is not an array, convert it to an array
    if (!Array.isArray(recordIds)){recordIds = [recordIds]}
    
    // Create the Airtable formula to search for the record IDs
    let formula = 'OR(RECORD_ID()="' + recordIds.join('",RECORD_ID()="') + '")'
    
    // Create the API URL for the Airtable search
    let apiUrl = 'https://api.airtable.com/v0/' + appId + '/' + encodeURIComponent(tableName) + '?filterByFormula=' + encodeURIComponent(formula)
    
    // Initialize variables for storing records and API URL
    let tmpApiUrl = apiUrl; 
    let records = [];
    
    // Loop through all pages of the Airtable search results
    while (tmpApiUrl){
        // Fetch the data from the API
        let apiData =  await fetch(tmpApiUrl, {method: 'GET', headers: {'Authorization':'Bearer '+atKey, 'Content-Type':'application/json'}}).then(r => r.json())
        
        // Add the records from the current page to the records array
        records = records.concat(apiData.records)
        
        // If there is another page of results, update the API URL to fetch that page
        if ("offset" in apiData){tmpApiUrl = apiUrl + '&offset=' + apiData.offset} else {tmpApiUrl = null}
    }
    
    // Log the number of records found
    console.log(records.length + ' records detected from ' + recordIds.length + ' record IDs.')
    
    // Return the list of records
    return records
}

/**
 * Retrieve all records from an Airtable table.
 * @param {string} appId - The Airtable app ID.
 * @param {string} tableName - The name of the table to retrieve records from.
 * @returns {Promise} A promise that resolves with an array of all records in the table.
 */
async function getAllAirtableRecordsInTable(appId, tableName) {
  // Construct API URL
  let apiUrl = `https://api.airtable.com/v0/${appId}/${encodeURIComponent(tableName)}/?`;
  let tmpApiUrl = apiUrl;
  let allRecords = new Array;
  while (tmpApiUrl) {
    // Fetch data from API
    let data = await fetch(tmpApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + atKey,
        'Content-Type': 'application/json'
      }
    });
    let apiData = await data.json();
    // Concatenate retrieved records to the allRecords array
    allRecords = allRecords.concat(apiData.records);
    // Check for offset in API response and update API URL for pagination
    if ("offset" in apiData) {
      tmpApiUrl = `${apiUrl}&offset=${apiData.offset}`;
    } else {
      tmpApiUrl = null;
    }
  };
  console.log(`${allRecords.length} records detected.`);
  return allRecords;
};

///////////// TOPIA FUNCTIONS /////////////

/**
 * Validate Topia world slug
 *
 * @param {string} apiKey - The Topia API key.
 * @param {string} apiEmail - The Topia API email.
 * @param {string} urlSlug - The URL slug of the Topia world.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the URL slug is valid or not.
 */
async function checkTopiaWorld(apiKey, apiEmail, urlSlug) {
  const apiUrl = `https://api.topia.io/api/v1/world/${urlSlug}/assets`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const assets = await response.json();
    
    if ("errors" in assets) {
      console.log(`Invalid URL slug: "${urlSlug}"`);
      return false;
    } else {
      console.log(`Valid URL slug: "${urlSlug}"`);
      return true;
    }
  } catch (error) {
    console.error(`Error checking Topia world: ${error}`);
    return false;
  }
}

/**
 * Drops a Topia scene by its ID into a specified Topia world.
 *
 * @param {string} apiKey - The API key used to authenticate with the Topia API.
 * @param {string} apiEmail - The email address associated with the Topia account.
 * @param {string} urlSlug - The URL slug of the Topia world to drop the scene into.
 * @param {string} sceneId - The ID of the scene to drop.
 * @param {object} dropPos - The position at which to drop the scene, expressed as an object with 'x' and 'y' properties (both between 0 and 1).
 * @param {string} suffix - A suffix to add to the end of the scene's name (optional).
 * @returns {object} An object with 'success' (boolean) and 'message' (string) properties indicating whether the scene was successfully dropped into the Topia world.
 */
async function dropTopiaSceneByCoords(apiKey, apiEmail, urlSlug, sceneId, dropPos = {x: 0.1, y: 0.1}, suffix = null) {
  // Create the payload object.
  const payload = {
    "sceneId": sceneId,
    "position": dropPos,
  };
	
  if (suffix){
  	payload.assetSuffix = suffix
  }
  
  // Log the scene and position being dropped.
  console.log(`Dropping Scene "${sceneId}" into Topia World "${urlSlug}"...`);
  //console.log('Payload:', payload);

  // Set the URL for the Topia API endpoint.
  const apiUrl = `https://api.topia.io/api/v1/world/${urlSlug}/drop-scene?email=${apiEmail}`;

  // Send a POST request to the Topia API to drop the scene.
  const data = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  }).then(r => r.json());

  // Check if the scene was successfully dropped.
  const success = data.success;
  const message = success ?
    `Scene "${sceneId}" successfully dropped into Topia World "${urlSlug}".` :
    data.message;

  // Log the response from the API.
  //console.log('Response data:', data);
  //console.log('Response:', {success, message});

  // Return an object indicating whether the scene was successfully dropped.
  return {success, message};
}

/**
 * Drops a single asset by ID into a Topia world by coordinates.
 * @param {string} apiKey - The API key for accessing the Topia API.
 * @param {string} apiEmail - The email address associated with the Topia API key.
 * @param {string} urlSlug - The URL slug of the Topia world to drop the asset into.
 * @param {string} assetId - The ID of the asset to drop into the world.
 * @param {number[]} dropPos - The [x,y] coordinates to drop the asset at.
 * @param {string|null} [uniqueName=null] - An optional unique name for the asset.
 * @param {number} [scatter=0] - An optional scatter value in pixels to add randomness to the drop position.
 * @returns {Object} - The JSON response from the Topia API containing the dropped asset's data.
 */
async function dropAssetByIdInWorld(apiKey, apiEmail, urlSlug, assetId, dropPos, uniqueName=null, scatter=0){
    console.log(`Dropping asset "${assetId}" into Topia World "${urlSlug}"...`);
    // Create the payload object for the Topia API request.
    const payload = {
        "assetId": assetId,
        "position": {"x": dropPos[0], "y": dropPos[1]},
        "uniqueName": uniqueName
    };
    // Construct the URL for the Topia API request.
    const apiUrl = `https://api.topia.io/api/world/${urlSlug}/assets?email=${apiEmail}`;
    // If a scatter value is provided, apply it to the drop position.
    if (scatter > 0) {
        // Calculate a random offset within the scatter range for both x and y coordinates.
        const xOffset = Math.floor(Math.random() * scatter) * (Math.random() > 0.5 ? 1 : -1);
        const yOffset = Math.floor(Math.random() * scatter) * (Math.random() > 0.5 ? 1 : -1);
        // Apply the offset to the drop position.
        payload.position.x += xOffset;
        payload.position.y += yOffset;
    }
    // Send the Topia API request using fetch and return the JSON response.
    const assetData = await fetch(apiUrl, {
        method: "POST",
        headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(response => response.json());
    //console.log('assetData',assetData);
    if ("errors" in assetData){
    	console.log('Asset failed to drop in world.')
    } else {
    	console.log('Asset successfully dropped in world.')
    }
    return assetData;
}

/**
 * Get all assets for a given Topia world.
 *
 * @param {string} apiKey - The Topia API key.
 * @param {string} apiEmail - The Topia API email.
 * @param {string} urlSlug - The URL slug of the Topia world.
 * @returns {Promise<object[]>} - A promise that resolves to an array of assets.
 */
async function getTopiaWorldAssets(apiKey, apiEmail, urlSlug) {
  // Construct the API URL
  const apiUrl = `https://api.topia.io/api/v1/world/${urlSlug}/assets`;

  // Fetch assets from the Topia API
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    }
  });

  // Parse the response JSON
  const assets = await response.json();

  // Log the retrieved assets and their count
  console.log(`Retrieving All Assets for Topia World "${urlSlug}"...`);
  //console.log('Assets:', assets);
  console.log(`${assets.length} assets detected in world "${urlSlug}".`);

  return assets;
}

/**
 * Remove all Topia World assets with a specific suffix.
 * @param {string} apiKey - The Topia API key.
 * @param {string} apiEmail - The Topia API email.
 * @param {string} urlSlug - The Topia world URL slug.
 * @param {string} suffix - The asset suffix to filter by.
 * @returns {Promise<Object>} - A promise that resolves to an object with success status and message.
 */
async function removeTopiaWorldAssetsBySuffix(apiKey, apiEmail, urlSlug, suffix) {
    console.log(`Removing All Assets for Topia World "${urlSlug}" with suffix "${suffix}"...`);
    
    // Build the API URL and set headers
    const apiUrl = `https://api.topia.io/api/world/${urlSlug}/assets?email=${apiEmail}`;
    const headers = {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
    };

    // Fetch the assets from the Topia World API
    const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers
    });
    
    // Check if the fetch request was successful
    if (!response.ok) {
        throw new Error(`Failed to fetch assets from Topia World "${urlSlug}".`);
    }
    
    // Parse the response into JSON
    const assets = await response.json();

    // Filter the assets based on the suffix
    const suffixAssets = assets.filter((obj) => {
      if (obj.uniqueName) {
        return obj.uniqueName.endsWith(suffix);
      }
      return false;
    });
    console.log(`${suffixAssets.length} assets with suffix "${suffix}" detected in world "${urlSlug}".`);

    // Extract the asset IDs
    const assetIds = suffixAssets.map(obj => obj.id.toString());
    console.log(`Removing ${assetIds.length} Assets from Topia World "${urlSlug}"...`);

    // Prepare the batch API requests for deleting the assets
    const requests = assetIds.map(assetId => ({
        apiUrl: `https://api.topia.io/api/v1/world/${urlSlug}/assets/${assetId}?email=${apiEmail}`
    }));

    console.log('requests', requests);

    // Send the batch API requests to delete the assets
    const batchResponse = await batchParallelProcApiReqs(requests, "DELETE", headers);

    // Extract any error messages from the batch response
    const errors = convObjArrayToValues(batchResponse, "errors");
    
    // Check if there were any errors
    if (errors.length > 0) {
        return {
            success: false,
            message: errors.map(error => error.message).join(" ")
        };
    } else {
        return {
            success: true,
            message: `${assetIds.length} assets successfully removed from Topia world.`
        };
    }

    /**
     * Convert an array of objects to an array of values based on the specified key.
     * @param {Array} objArray - The array of objects.
     * @param {string} key - The key to extract the values from.
     * @returns {Array} - The array of values.
     */
    function convObjArrayToValues(objArray, key) {
        return objArray
            .filter(obj => key in obj)
            .flatMap(obj => Array.isArray(obj[key]) ? obj[key] : [obj[key]])
            .filter(Boolean)
            .filter((item, index, array) => array.indexOf(item) === index);
    }
}

//////////////////// UTILITY FUNCTIONS ////////////////////

// Convert to Kebab Case
function toKebabCase(str){
    return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replaceAll("+","-")
    .replaceAll("---","-")
}

//////////////////// BATCH PROCESSING FUNCTIONS ////////////////////

/**
 * Batch parallel process API requests using Promise.allSettled
 * @param {Array} requests - An array of request objects with apiUrl and payload properties
 * @param {string} method - The HTTP method for the requests (default: "GET")
 * @param {Object} headers - An object containing request headers
 * @param {number} itemsPerBatch - The number of items to process in parallel per batch (default: 5)
 * @returns {Array} - An array of response data from the API requests
 */
async function batchParallelProcApiReqs(requests, method = "GET", headers = {}, itemsPerBatch = 5) {
    let reqBatches = configBatchesForParallelProc(requests, itemsPerBatch);
    let apiData = [];

    for (let i = 0; i < reqBatches.length; i++) {
        apiData = apiData.concat(await parallelProcApiReqs(reqBatches[i], method, headers));
        console.log(`Batch #${i + 1} (of ${reqBatches.length}) complete. ${apiData.length} items returned so far.`);
    }
    console.log('apiData', apiData);
    return apiData;

    /**
     * Configure batches for parallel processing
     * @param {Array} array - The array to be parallel processed
     * @param {number} itemsPerBatch - The number of items per batch
     * @returns {Array} - An array of arrays containing items for parallel processing
     */
    function configBatchesForParallelProc(array, itemsPerBatch) {
        let numBatches = Math.ceil(array.length / itemsPerBatch);
        console.log(`Configuring parallel processing into ${numBatches} sets...`);
        let batches = [];

        for (let i = 0; i < numBatches; i++) {
            let startIt = ((i + 1) * itemsPerBatch) - itemsPerBatch;
            let endIt = startIt + itemsPerBatch;
            batches[i] = array.slice(startIt, endIt);
        }
        return batches;
    }

    /**
     * Parallel process API requests using Promise.allSettled
     * @param {Array} requests - An array of request objects with apiUrl and payload properties
     * @param {string} method - The HTTP method for the requests (default: "GET")
     * @param {Object} headers - An object containing request headers
     * @returns {Array} - An array of response data from the API requests
     */
    async function parallelProcApiReqs(requests, method = "GET", headers = {}) {
        console.log(`Parallel processing ${requests.length} API requests...`);
        const fetches = [];

        for (let i = 0; i < requests.length; i++) {
            if ("payload" in requests[i]) {
                fetches.push(fetch(requests[i].apiUrl, { "method": method, "headers": headers, "body": JSON.stringify(requests[i].payload) }));
            } else {
                fetches.push(fetch(requests[i].apiUrl, { "method": method, "headers": headers }));
            }
        }

        const data = await Promise.allSettled(fetches).then(results => Promise.allSettled(results.map(r => r.value.json())));
        let apiData = [];

        for (let i = 0; i < data.length; i++) {
            if (data[i].status != "fulfilled") {
                console.log(`Error: Request #${i + 1}: "${data[i].status}`);
                apiData[i] = {};}
            else {apiData[i] = data[i].value;}
        }
      return apiData;
    }
}
