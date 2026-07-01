(function () {
  const FALLBACK_USER = {
    username: "nznt",
    discriminator: "0",
    avatar: "https://cdn.discordapp.com/avatars/1160416704791330926/93221244e0bc7f2f08ca4f4839a1199a.png?size=256",
    status: "offline",
    about: ".gg/nznt",
    links: {},
  };

  function avatarUrl(user) {
    if (user.avatar) {
      const extension = user.avatar.startsWith("a_") ? "gif" : "png";
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`;
    }

    return `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;
  }

  function renderFallback(profile) {
    if (!document.getElementById("loading")) return;

    updateUser(profile);
    stopLoading();
  }

  window.addEventListener("load", function () {
    window.setTimeout(async function () {
      if (!document.getElementById("loading")) return;

      try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
        const result = await response.json();

        if (!result.success) {
          renderFallback(FALLBACK_USER);
          return;
        }

        const data = result.data;
        const user = data.discord_user;
        renderFallback({
          username: user.global_name || user.username,
          discriminator: user.discriminator || "0",
          avatar: avatarUrl(user),
          status: data.discord_status || "offline",
          about:
            data.activities?.find((activity) => activity.type === 4)?.state ||
            FALLBACK_USER.about,
          links: {},
        });
      } catch (error) {
        renderFallback(FALLBACK_USER);
      }
    }, 5000);
  });
})();
