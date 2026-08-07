async function getApiUrl() {
  try {
    const res = await fetch('https://mixer-496406.web.app/');
    const text = await res.text();
    const match = text.match(/<script[^>]+src="([^"]+_layout[^"]*\.js)"/);
    if (!match) {
      console.log("Could not find _layout JS file");
      return;
    }
    const jsUrl = 'https://mixer-496406.web.app' + match[1];
    console.log("Fetching JS:", jsUrl);
    
    const jsRes = await fetch(jsUrl);
    const jsText = await jsRes.text();
    const apiMatch = jsText.match(/https:\/\/mixer-api-[a-zA-Z0-9-]+\.a\.run\.app/);
    if (apiMatch) {
      console.log("Found API URL:", apiMatch[0]);
    } else {
      console.log("API URL not found in JS");
    }
  } catch (e) {
    console.error(e);
  }
}
getApiUrl();
