const axios = require("axios");

// 1. Create Repo
const createGroupRepo = async (accessToken, groupName) => {
  try {
    const safeName = `devconnect-${groupName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

    // Create
    const createRes = await axios.post(
      "https://api.github.com/user/repos",
      {
        name: safeName,
        private: true,
        auto_init: true,
        description: `Workspace for DevConnect Group: ${groupName}`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    const { owner, name: repo } = createRes.data;

    // DevContainer Setup
    const devContainerContent = {
      name: "DevConnect Workspace",
      image: "mcr.microsoft.com/devcontainers/javascript-node:18",
      forwardPorts: [3000, 5173],
    };
    const contentEncoded = Buffer.from(
      JSON.stringify(devContainerContent, null, 2),
    ).toString("base64");

    await axios.put(
      `https://api.github.com/repos/${owner.login}/${repo}/contents/.devcontainer/devcontainer.json`,
      { message: "Initialize DevConnect environment", content: contentEncoded },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    return {
      repoId: createRes.data.id.toString(),
      repoName: createRes.data.name,
      repoUrl: createRes.data.html_url,
      owner: owner.login,
    };
  } catch (err) {
    console.error(
      "GitHub Create Error:",
      err.response?.data?.message || err.message,
    );
    throw new Error("Failed to create GitHub repository");
  }
};

// 2. Add/Update Collaborator
const addCollaborator = async (
  ownerAccessToken,
  repoName,
  collaboratorUsername,
  permission = "pull",
) => {
  try {
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${ownerAccessToken}` },
    });
    const ownerUsername = userRes.data.login;

    await axios.put(
      `https://api.github.com/repos/${ownerUsername}/${repoName}/collaborators/${collaboratorUsername}`,
      { permission },
      {
        headers: {
          Authorization: `Bearer ${ownerAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    return true;
  } catch (err) {
    console.error(
      `GitHub Add Collab Error (${collaboratorUsername}):`,
      err.response?.data?.message || err.message,
    );
    return false;
  }
};

// 3. Remove Collaborator (Crucial for Revoking)
const removeCollaborator = async (
  ownerAccessToken,
  repoName,
  collaboratorUsername,
) => {
  try {
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${ownerAccessToken}` },
    });
    const ownerUsername = userRes.data.login;

    await axios.delete(
      `https://api.github.com/repos/${ownerUsername}/${repoName}/collaborators/${collaboratorUsername}`,
      {
        headers: {
          Authorization: `Bearer ${ownerAccessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    return true;
  } catch (err) {
    console.error(
      "GitHub Remove Error:",
      err.response?.data?.message || err.message,
    );
    return false;
  }
};

// 4. Delete Repo
const deleteGroupRepo = async (ownerAccessToken, repoName) => {

  if (!ownerAccessToken) {
    console.error("[GitHub] Delete failed: No token provided");
    return false;
  }

  try {
    // 1. Verify the token owner
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${ownerAccessToken}` },
    });
    const tokenOwner = userRes.data.login;

    // 2. Construct URL (Ensure we are deleting User's OWN repo)
    // If the repoName already includes "owner/", strip it, otherwise use tokenOwner
    const cleanRepoName = repoName.includes("/")
      ? repoName.split("/")[1]
      : repoName;
    const targetUrl = `https://api.github.com/repos/${tokenOwner}/${cleanRepoName}`;


    await axios.delete(targetUrl, {
      headers: {
        Authorization: `Bearer ${ownerAccessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    return true;
  } catch (err) {
    console.error("❌ [GitHub Delete Error]");
    // 403 or 404 often means the Token lacks 'delete_repo' scope OR user isn't the owner
    console.error("   Status:", err.response?.status);
    console.error("   Message:", err.response?.data?.message || err.message);

    if (err.response?.status === 403) {
      console.error(
        "   HINT: Check if 'delete_repo' scope is added in routes/auth.js",
      );
    }
    return false;
  }
};

module.exports = {
  createGroupRepo,
  addCollaborator,
  removeCollaborator,
  deleteGroupRepo,
};
