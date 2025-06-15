const CLIENT_ID = '64187947728-hc0gt59ba72lm3tdngm7m6cua62eeejp.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDu-nZY6vNGAZNihqn_dPAxz3BWqrEYFIw';

const DISCOVERY_DOCS = ['https://photoslibrary.googleapis.com/$discovery/rest?version=v1'];
const SCOPES = 'https://www.googleapis.com/auth/photoslibrary.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Declare DOM elements globally
let authorizeButton;
let signoutButton;
let galleryContent;
let galleryMessage;
let albumListDiv;
let photoGridDiv;
let messageBox;
let messageBoxText;
let messageBoxOk;

// Function to show custom message box
function showMessageBox(message) {
    if (messageBox && messageBoxText && messageBoxOk) {
        messageBoxText.textContent = message;
        messageBox.style.display = 'block';

        messageBoxOk.onclick = () => {
            messageBox.style.display = 'none';
        };
    } else {
        console.error("Message box elements not found when trying to show message:", message);
        alert(message); // Fallback to alert if message box not ready
    }
}

/**
 * Callback function called when the gapi.js client library is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Initializes the Google API client.
 */
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        checkLibrariesLoaded(); // Check if both libraries are ready
    } catch (error) {
        console.error("Error initializing gapi client:", error);
        showMessageBox("Failed to initialize Google API client. Check API Key and network. " + error.message);
    }
}

/**
 * Callback function called when the gis.js client library is loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Handled by authorizeButton.onclick
    });
    gisInited = true;
    checkLibrariesLoaded(); // Check if both libraries are ready
}

/**
 * Checks if both GAPI and GIS libraries are loaded and then enables buttons.
 */
function checkLibrariesLoaded() {
    // Ensure DOM elements are assigned before trying to use them
    if (!authorizeButton) {
        console.warn("DOM elements not yet assigned when checkLibrariesLoaded is called.");
        return; // Exit if DOM not ready
    }

    if (gapiInited && gisInited) {
        authorizeButton.disabled = false; // Enable the button
        authorizeButton.style.display = 'block'; // Make sure it's visible if hidden by default CSS
        if (galleryMessage) {
            galleryMessage.textContent = 'Click "Connect Google Photos" to view your albums.';
        }
    }
}


// Wrap all DOM element assignments and event listeners in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements
    authorizeButton = document.getElementById('authorize_button');
    signoutButton = document.getElementById('signout_button');
    galleryContent = document.getElementById('gallery_content');
    galleryMessage = document.getElementById('gallery_message');
    albumListDiv = document.getElementById('album_list');
    photoGridDiv = document.getElementById('photo_grid');
    messageBox = document.getElementById('messageBox');
    messageBoxText = document.getElementById('messageBoxText');
    messageBoxOk = document.getElementById('messageBoxOk');

    // Initially hide the authorize button until scripts are loaded and ready
    if (authorizeButton) {
        authorizeButton.style.display = 'none';
        authorizeButton.disabled = true; // Keep it disabled until ready
    }

    // Attach event listeners after elements are guaranteed to be available
    if (authorizeButton) {
        authorizeButton.onclick = () => {
            // Check if tokenClient is initialized before requesting access token
            if (!tokenClient) {
                showMessageBox("Google Identity Services not fully initialized. Please try refreshing the page.");
                return;
            }
            tokenClient.callback = async (resp) => {
                if (resp.error !== undefined) {
                    console.error("Authorization error:", resp);
                    showMessageBox("Authorization failed: " + resp.error);
                    return;
                }
                authorizeButton.style.display = 'none';
                signoutButton.style.display = 'block';
                galleryMessage.textContent = 'Loading your albums...';
                listAlbums();
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        };
    } else {
        console.error("Authorize button not found!");
    }


    if (signoutButton) {
        signoutButton.onclick = () => {
            if (!gapi.client.getToken()) {
                showMessageBox("Not currently signed in.");
                return;
            }
            google.accounts.oauth2.revoke(gapi.client.getToken().access_token, () => {
                if (galleryContent) galleryContent.innerHTML = '<p class="message">Signed out. Connect again to view photos.</p>';
                if (authorizeButton) {
                    authorizeButton.style.display = 'block';
                    authorizeButton.disabled = true; // Re-disable until next full load/auth attempt
                }
                if (signoutButton) signoutButton.style.display = 'none';
                if (albumListDiv) albumListDiv.innerHTML = '';
                if (photoGridDiv) photoGridDiv.innerHTML = '';
                if (galleryMessage) galleryMessage.textContent = 'Please connect your Google Photos account.';

                // Reset GAPI and GIS flags
                gapiInited = false;
                gisInited = false;
                // Re-enable authorization flow logic if needed
            });
        };
    } else {
        console.error("Signout button not found!");
    }

    // Call checkLibrariesLoaded here initially after DOM elements are assigned.
    // This will handle the case where gapiLoaded/gisLoaded fire before DOMContentLoaded.
    checkLibrariesLoaded();
});


/**
 * Lists the user's Google Photos albums.
 */
async function listAlbums() {
    try {
        const response = await gapi.client.photoslibrary.albums.list({
            pageSize: 20,
        });

        const albums = response.result.albums;
        if (albumListDiv) albumListDiv.innerHTML = '';
        if (photoGridDiv) photoGridDiv.innerHTML = '';

        if (!albums || albums.length === 0) {
            if (galleryMessage) galleryMessage.textContent = 'No albums found in your Google Photos.';
            return;
        }

        if (galleryMessage) galleryMessage.textContent = 'Select an album to view photos:';
        // Ensure albumListDiv is visible when displaying albums
        if (albumListDiv) albumListDiv.style.display = 'flex'; // Assuming album-list class uses flex

        albums.forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.classList.add('album-card');
            albumCard.setAttribute('data-id', album.id);

            const thumbnailUrl = album.coverPhotoBaseUrl ? `${album.coverPhotoBaseUrl}=w100-h100-c` : 'https://placehold.co/100x100/eeeeee/333333?text=Album';
            albumCard.innerHTML = `
                <img src="${thumbnailUrl}" alt="${album.title} cover">
                <h3>${album.title}</h3>
            `;
            albumCard.onclick = () => {
                if (galleryMessage) galleryMessage.textContent = `Loading photos from "${album.title}"...`;
                listMediaItems(album.id);
            };
            if (albumListDiv) albumListDiv.appendChild(albumCard);
        });

    } catch (err) {
        console.error("Error listing albums:", err);
        showMessageBox("Error listing albums. Ensure Google Photos Library API is enabled for your project and scopes are correct. " + (err.result && err.result.error ? err.result.error.message : err.message));
        if (galleryMessage) galleryMessage.textContent = 'Failed to load albums.';
    }
}

/**
 * Lists media items (photos) from a specific Google Photos album.
 * @param {string} albumId The ID of the album to fetch photos from.
 */
async function listMediaItems(albumId) {
    try {
        const response = await gapi.client.photoslibrary.mediaItems.search({
            albumId: albumId,
            pageSize: 50,
        });

        const mediaItems = response.result.mediaItems;
        if (photoGridDiv) photoGridDiv.innerHTML = '';
        if (albumListDiv) albumListDiv.style.display = 'none'; // Hide album list once photos are loaded
        if (galleryMessage) galleryMessage.textContent = 'Click on an album cover above to go back and select a different album.';


        if (!mediaItems || mediaItems.length === 0) {
            if (galleryMessage) galleryMessage.textContent = 'No photos found in this album.';
            return;
        }

        mediaItems.forEach(item => {
            const img = document.createElement('img');
            img.src = `${item.baseUrl}=w300-h300-c`;
            img.alt = item.filename;
            if (photoGridDiv) photoGridDiv.appendChild(img);
        });

    } catch (err) {
        console.error("Error listing media items:", err);
        showMessageBox("Error loading photos from album. " + (err.result && err.result.error ? err.result.error.message : err.message));
        if (galleryMessage) galleryMessage.textContent = 'Failed to load photos.';
    }
}