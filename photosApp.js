const CLIENT_ID = '64187947728-hc0gt59ba72lm3tdngm7m6cua62eeejp.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDu-nZY6vNGAZNihqn_dPAxz3BWqrEYFIw';

// Discovery document for the Google Photos Library API
const DISCOVERY_DOCS = ['https://photoslibrary.googleapis.com/$discovery/rest?version=v1'];

// Scopes required for accessing Google Photos Library
// 'https://www.googleapis.com/auth/photoslibrary.readonly' allows read access to photos and videos
// 'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata' for app-created content, not needed here
const SCOPES = 'https://www.googleapis.com/auth/photoslibrary.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// DOM elements
const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const galleryContent = document.getElementById('gallery_content');
const galleryMessage = document.getElementById('gallery_message');
const albumListDiv = document.getElementById('album_list');
const photoGridDiv = document.getElementById('photo_grid');

// Function to show custom message box (reused from shoppinglistApp.js)
function showMessageBox(message) {
    const messageBox = document.getElementById('messageBox');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxOk = document.getElementById('messageBoxOk');

    messageBoxText.textContent = message;
    messageBox.style.display = 'block';

    messageBoxOk.onclick = () => {
        messageBox.style.display = 'none';
    };
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
        maybeEnableButtons();
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
    maybeEnableButtons();
}

/**
 * Enables the authorize button if both gapi and gis are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        authorizeButton.style.display = 'block';
        galleryMessage.textContent = 'Click "Connect Google Photos" to view your albums.';
    }
}

/**
 * Handle the authorize button click.
 */
authorizeButton.onclick = () => {
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

    // Request an access token; prompt consent on first authorization
    tokenClient.requestAccessToken({ prompt: 'consent' });
};

/**
 * Handle the sign-out button click.
 */
signoutButton.onclick = () => {
    // Revoke the current access token
    google.accounts.oauth2.revoke(gapi.client.getToken().access_token, () => {
        galleryContent.innerHTML = '<p class="message">Signed out. Connect again to view photos.</p>';
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        albumListDiv.innerHTML = ''; // Clear albums
        photoGridDiv.innerHTML = ''; // Clear photos
        galleryMessage.textContent = 'Please connect your Google Photos account.';
    });
};

/**
 * Lists the user's Google Photos albums.
 */
async function listAlbums() {
    try {
        const response = await gapi.client.photoslibrary.albums.list({
            pageSize: 20, // Fetch up to 20 albums
        });

        const albums = response.result.albums;
        albumListDiv.innerHTML = ''; // Clear previous albums
        photoGridDiv.innerHTML = ''; // Ensure photo grid is empty

        if (!albums || albums.length === 0) {
            galleryMessage.textContent = 'No albums found in your Google Photos.';
            return;
        }

        galleryMessage.textContent = 'Select an album to view photos:';
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
                galleryMessage.textContent = `Loading photos from "${album.title}"...`;
                listMediaItems(album.id);
            };
            albumListDiv.appendChild(albumCard);
        });

    } catch (err) {
        console.error("Error listing albums:", err);
        showMessageBox("Error listing albums. Ensure Google Photos Library API is enabled for your project and scopes are correct. " + (err.result && err.result.error ? err.result.error.message : err.message));
        galleryMessage.textContent = 'Failed to load albums.';
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
            pageSize: 50, // Fetch up to 50 media items
        });

        const mediaItems = response.result.mediaItems;
        photoGridDiv.innerHTML = ''; // Clear previous photos
        albumListDiv.style.display = 'none'; // Hide album list once photos are loaded
        galleryMessage.textContent = 'Click on an album cover above to go back and select a different album.'; // Update message

        if (!mediaItems || mediaItems.length === 0) {
            galleryMessage.textContent = 'No photos found in this album.';
            return;
        }

        mediaItems.forEach(item => {
            const img = document.createElement('img');
            // Use '=wXXX-hYYY-c' to request a specific size and crop of the image
            // This is good practice to avoid loading very large images.
            img.src = `${item.baseUrl}=w300-h300-c`;
            img.alt = item.filename;
            photoGridDiv.appendChild(img);
        });

    } catch (err) {
        console.error("Error listing media items:", err);
        showMessageBox("Error loading photos from album. " + (err.result && err.result.error ? err.result.error.message : err.message));
        galleryMessage.textContent = 'Failed to load photos.';
    }
}
