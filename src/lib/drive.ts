import { google } from "googleapis";

// Initialize Google Drive API for Document Organization using a Service Account
// This requires NO user consent screens, domains, or deployments!

let authClient: any;

try {
  if (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON);
    authClient = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
  } else {
    console.warn("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not set. Drive API will fail.");
  }
} catch (error) {
  console.error("Failed to parse Service Account JSON:", error);
}

export const drive = google.drive({
  version: "v3",
  auth: authClient,
});

export const SHARED_FOLDER_ID = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID;

/**
 * Creates a folder within the shared Google Drive workspace.
 */
export async function createWorkspaceFolder(folderName: string, parentId?: string) {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : (SHARED_FOLDER_ID ? [SHARED_FOLDER_ID] : []),
    };
    
    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, name",
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error creating folder ${folderName}:`, error);
    throw error;
  }
}

/**
 * Initializes the main folder structure based on the Input Layer architecture.
 * This should be run once during the setup phase.
 */
export async function initializeDriveWorkspace() {
  if (!SHARED_FOLDER_ID) {
    throw new Error("GOOGLE_DRIVE_SHARED_FOLDER_ID is missing from environment variables.");
  }

  const workspaceFolders = [
    "Papers & Documents", // For "Upload document"
    "Links & Bookmarks",  // For "Paste a URL"
    "Notes & Snippets",   // For "Paste text / notes"
    "Videos",             // For "Video link"
  ];

  console.log("Initializing Shared Workspace Folders...");
  const createdFolders = [];

  for (const folder of workspaceFolders) {
    const res = await createWorkspaceFolder(folder, SHARED_FOLDER_ID);
    createdFolders.push(res);
    console.log(`Created Folder: ${res.name} (ID: ${res.id})`);
  }

  return createdFolders;
}

/**
 * Uploads a document to a specific folder in the workspace.
 */
export async function uploadDocumentToWorkspace(
  fileName: string, 
  mimeType: string, 
  contentStream: any, 
  parentFolderId: string
) {
  const fileMetadata = {
    name: fileName,
    parents: [parentFolderId],
  };

  const media = {
    mimeType: mimeType,
    body: contentStream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, name, webViewLink",
  });

  return response.data;
}
