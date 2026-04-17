const VONALIA_API_URL = "https://beta.vonalia.com/api/v1/Infrastructure";

interface VonaliaResponse {
  Info?: {
    Key?: string;
    Password?: string;
    Hardware?: string;
    Type?: string;
    IP?: string;
    Roblox?: string;
    Used?: string;
    Changed?: string;
    Frozen?: string;
    Whitelist?: string;
    Blacklist?: string;
    Reason?: string;
    Note?: string;
  };
  Error?: string;
}

interface CreateUserResponse {
  Info?: {
    Key?: string;
    Info?: {
      Key?: string;
      Password?: string;
    };
  };
  Error?: string;
}

export async function createUser(
  apiKey: string,
  type: "Free" | "Weekly" | "Monthly" | "Lifetime",
  whitelistTimestamp: number
): Promise<CreateUserResponse> {
  const response = await fetch(VONALIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Key: apiKey,
      Category: "Users",
      Type: "Create",
      Info: {
        Type: type,
        Whitelist: whitelistTimestamp.toString(),
      },
    }),
  });

  return response.json();
}

export async function findUser(
  apiKey: string,
  password: string
): Promise<VonaliaResponse> {
  const response = await fetch(VONALIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Key: apiKey,
      Category: "Users",
      Type: "Find",
      Info: {
        Password: password,
      },
    }),
  });

  return response.json();
}

export async function editUser(
  apiKey: string,
  password: string,
  updates: Partial<{
    Hardware: string;
    Type: string;
    IP: string;
    Roblox: string;
    Used: string;
    Changed: string;
    Frozen: string;
    Whitelist: string;
    Blacklist: string;
    Reason: string;
    Note: string;
  }>
): Promise<VonaliaResponse> {
  const response = await fetch(VONALIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Key: apiKey,
      Category: "Users",
      Type: "Edit",
      Info: {
        Password: password,
        ...updates,
      },
    }),
  });

  return response.json();
}

export async function deleteUser(
  apiKey: string,
  password: string
): Promise<VonaliaResponse> {
  const response = await fetch(VONALIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Key: apiKey,
      Category: "Users",
      Type: "Delete",
      Info: {
        Password: password,
      },
    }),
  });

  return response.json();
}

// Helper to calculate whitelist timestamp based on plan
export function getWhitelistTimestamp(plan: "Weekly" | "Monthly" | "Lifetime"): number {
  const now = Math.floor(Date.now() / 1000);
  switch (plan) {
    case "Weekly":
      return now + 7 * 24 * 60 * 60; // 7 days
    case "Monthly":
      return now + 30 * 24 * 60 * 60; // 30 days
    case "Lifetime":
      return now + 100 * 365 * 24 * 60 * 60; // 100 years (essentially forever)
    default:
      return now;
  }
}

// Helper to format expiration
export function formatExpiration(timestamp: string | undefined): string {
  if (!timestamp) return "Unknown";
  const ts = parseInt(timestamp);
  if (isNaN(ts)) return "Unknown";
  
  // If it's more than 50 years from now, consider it lifetime
  const now = Math.floor(Date.now() / 1000);
  if (ts - now > 50 * 365 * 24 * 60 * 60) {
    return "Never (Lifetime)";
  }
  
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
