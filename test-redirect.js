async function resolveRedirect(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    console.log("Resolved URL:", response.url);
  } catch(e) {
    console.error(e);
  }
}
resolveRedirect("https://vm.tiktok.com/ZMkYm7YgJ/");
