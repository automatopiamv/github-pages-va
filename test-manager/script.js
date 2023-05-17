// Define Airtable API key, base ID, and table name
const atKey = 'keyDOIkxuexRDhwi7';
const appId = 'appzktw4aywkZzH3I';
const tableName = 'Scenes';
const recordId = 'recab5qbNkd92dRiu';


///////////// LOAD PROJECTS /////////////

// Run the getAirtableProjects function when the page loads
window.onload = () => {
  showLoader(); // show the loader before fetching data
  getAirtableScenes().then(() => {
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
 * Fetches all project records from Airtable and displays them in the scrollable list
 */
async function getAirtableScenes() {
  // Retrieve primary scene record
  const record = await getAirtableRecord(atKey, appId, tableName, recordId);

  // Retrieve all sub-scene records from Airtable and sort by "Scene Name" field
  const scenes = await findRecordsByRecIdsList(atKey, appId, tableName, record.fields["Sub-Scenes"]);
  scenes.sort((a, b) => {
    if (a.fields["Scene Name"] < b.fields["Scene Name"]) {
      return -1;
    }
    if (a.fields["Scene Name"] > b.fields["Scene Name"]) {
      return 1;
    }
    return 0;
  });
  console.log(scenes.length + " scenes detected.");

  // Loop through each project and generate HTML string
  const htmlStrings = scenes.map((scene, index, array) => {
    // Extract relevant fields from the scene record
    const { id, fields: { "Scene Name": title, "Scene Description": description, "Topia Scene ID": sceneId, Notes: notes, "Sub-Scenes": subscenes } } = scene;

    let dropPos = [0.01, 0.01];
    if (notes) {
      dropPos = JSON.parse(notes.split("]")[0] + "]");
    }
		
    // Convert subscenes array to a comma-separated string
    const numSubscenes = (subscenes ? subscenes.length : 0);
    const subscenesString = subscenes ? subscenes.join(",") : "";
    const numString = `${numSubscenes} ${(numSubscenes === 1 ? "scene" : "scenes")}`;
    
    // Generate HTML string for the project
    const isClickable = subscenes && subscenes.length > 0;
    const clickAttribute = isClickable ? `onclick="location.href='scenes/index.html?scenes=${encodeURIComponent(subscenesString)}'"` : "";
    return `
      <div class="list-item"${clickAttribute}>
        <div class="item-info">
          <h2>${title}</h2>
          <p>${numString}</p>
        </div>
      </div>
    `;
  }).join(""); // Join the HTML strings into a single string
  //console.log("htmlStrings", htmlStrings);

  // Set the HTML of the scrollable list container to the generated HTML strings
  const scrollableList = document.querySelector(".scrollable-list");
  scrollableList.innerHTML = htmlStrings;

  console.log(`Generated HTML for ${scenes.length} scenes`);
}


///////////// AIRTABLE FUNCTIONS /////////////

/**
 * Retrieve a single record from an Airtable table using the Airtable API.
 * 
 * @param {string} appId - The ID of the Airtable base.
 * @param {string} tableName - The name of the table within the base.
 * @param {string} recordId - The ID of the record to retrieve.
 * @returns {Promise<Object>} - A Promise that resolves to the record object.
 */
async function getAirtableRecord(atKey, appId, tableName, recordId) {
  // Construct the Airtable API URL
  let apiUrl = `https://api.airtable.com/v0/${appId}/${encodeURIComponent(tableName)}/${recordId}`;

  // Fetch the record data from the API
  let data = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${atKey}`,
      'Content-Type': 'application/json'
    }
  });

  // Parse the response as JSON
  let apiData = await data.json();

  // Return the record object
  return apiData;
};

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
